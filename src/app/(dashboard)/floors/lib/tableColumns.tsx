import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Flex, Popconfirm, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { FaPenToSquare, FaTrashCan } from 'react-icons/fa6'

import { queryKey } from './constants'
import { floorDetailStore } from './state'
import { deleteItem } from '../services/delete'

import { FloorListItem } from '@/app/api/floors/types'
import { useAntdContextHolder } from '@/lib/context/AntdContextHolder'

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
        title: 'Name',
        dataIndex: 'name',
        key: 'name',
        width: '30%',
        sorter: (a, b) => a?.name?.localeCompare(b?.name ?? '') ?? 0,
        render: (_, record) => {
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          return record?.name || '-'
        },
      },
      {
        title: 'Number',
        dataIndex: 'number',
        key: 'number',
        width: '30%',
        sorter: (a, b) => a.number - b.number,
      },
      {
        title: 'Time',
        dataIndex: 'created_at',
        key: 'created_at',
        width: '15%',
        sorter: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        render: (_, record) => {
          const createdAt = record.created_at ? dayjs(record.created_at).format('DD MMM YYYY, HH:mm') : '-'
          const updatedAt = record.updated_at ? dayjs(record.updated_at).format('DD MMM YYYY, HH:mm') : '-'
          return (
            <Flex gap={4} vertical>
              <Typography.Paragraph className="font-semibold !mb-0">Created At</Typography.Paragraph>
              <Typography.Paragraph className="!mb-0">{createdAt}</Typography.Paragraph>
              <Typography.Paragraph className="font-semibold !mb-0">Updated At</Typography.Paragraph>
              <Typography.Paragraph className="!mb-0">{updatedAt}</Typography.Paragraph>
            </Flex>
          )
        },
      },
      {
        title: 'Actions',
        key: 'actions',
        width: '15%',
        render: (_, record) => {
          return (
            <Flex gap={4} align="center">
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
            </Flex>
          )
        },
      },
    ]
  }
}
