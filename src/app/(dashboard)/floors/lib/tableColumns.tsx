import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Popconfirm, Space } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { FaPenToSquare, FaTrashCan } from 'react-icons/fa6'

import { queryKey } from './constants'
import { floorDetailStore } from './state'
import { deleteItem } from '../services/delete'

import { useAntdContextHolder } from '@/lib/context/AntdContextHolder'
import { FloorListItem } from '@/types/floor'

type Props = {
  onEdit: () => void
}

export const tableColumns = (props: Props) => {
  const { onEdit } = props

  return (): ColumnsType<FloorListItem> => {
    const queryClient = useQueryClient()
    const { antdMessage } = useAntdContextHolder()
    const { setData: setFloorDetail } = floorDetailStore()

    const {
      mutate: deleteMutation,
      variables: deleteVariables,
      isPending: isDeleteLoading,
    } = useMutation({
      mutationFn: deleteItem,
      onSuccess: () => {
        antdMessage?.success('Floor deleted successfully')
        queryClient.invalidateQueries({ queryKey: [queryKey.RES_FLOOR_LIST] })
      },
      onError: () => {
        antdMessage?.error('Failed to delete floor')
      },
    })

    const onDelete = (id: string) => {
      if (isDeleteLoading) return
      deleteMutation(id)
    }

    return [
      {
        title: 'Floor Number',
        dataIndex: 'floor_number',
        key: 'floor_number',
        width: '40%',
        sorter: (a, b) => a.floor_number - b.floor_number,
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
                  setFloorDetail(record)
                  onEdit()
                }}
              />
              <Popconfirm
                title="Delete Floor"
                description="Are you sure to delete this floor?"
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
