import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Popconfirm, Space } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { FaPenToSquare, FaTrashCan } from 'react-icons/fa6'

import { queryKey } from './constants'
import { featureDetailStore } from './state'
import { deleteItem } from '../services/delete'

import { FeatureListItem } from '@/app/api/features/types'
import { useAntdContextHolder } from '@/lib/context/AntdContextHolder'

type Props = {
  onEdit: () => void
}

export const tableColumns = (props: Props) => {
  const { onEdit } = props

  return (): ColumnsType<FeatureListItem> => {
    const queryClient = useQueryClient()
    const { antdMessage } = useAntdContextHolder()
    const { setData: setFeatureDetail } = featureDetailStore()

    const {
      mutate: deleteMutation,
      variables: deleteVariables,
      isPending: isDeleteLoading,
    } = useMutation({
      mutationFn: deleteItem,
      onSuccess: () => {
        antdMessage?.success('Feature deleted successfully')
        queryClient.invalidateQueries({ queryKey: [queryKey.RES_FEATURE_LIST] })
      },
      onError: () => {
        antdMessage?.error('Failed to delete feature')
      },
    })

    const onDelete = (id: string) => {
      if (isDeleteLoading) return
      deleteMutation(id)
    }

    return [
      {
        title: 'Name',
        dataIndex: 'name',
        key: 'name',
        width: '40%',
        sorter: (a, b) => a.name.localeCompare(b.name),
      },
      {
        title: 'Created At',
        dataIndex: 'created_at',
        key: 'created_at',
        width: '40%',
        sorter: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        render: (date) => {
          return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })
        },
      },
      {
        title: 'Actions',
        key: 'actions',
        width: '20%',
        render: (_, record) => {
          return (
            <Space>
              <Button
                type="text"
                icon={<FaPenToSquare />}
                onClick={() => {
                  setFeatureDetail(record)
                  onEdit()
                }}
              />
              <Popconfirm
                title="Delete Feature"
                description="Are you sure to delete this feature?"
                placement="leftTop"
                okText="Yes"
                okType="danger"
                cancelText="No"
                onConfirm={() => {
                  onDelete(record.id)
                }}
              >
                <Button
                  type="text"
                  danger
                  icon={<FaTrashCan className="text-red-500" />}
                  loading={isDeleteLoading && deleteVariables === record.id}
                />
              </Popconfirm>
            </Space>
          )
        },
      },
    ]
  }
}
