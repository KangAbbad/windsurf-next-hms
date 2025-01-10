import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Popconfirm, Space } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { FaPenToSquare, FaTrashCan } from 'react-icons/fa6'

import { queryKey } from './constants'
import { roomClassDetailStore } from './state'
import { deleteItem } from '../services/delete'

import { useAntdContextHolder } from '@/lib/context/AntdContextHolder'
import type { RoomClassListItem } from '@/types/room-class'
import { formatCurrency } from '@/utils/formatCurrency'

type Props = {
  onEdit: () => void
}

export const tableColumns = (props: Props) => {
  const { onEdit } = props

  return (): ColumnsType<RoomClassListItem> => {
    const queryClient = useQueryClient()
    const { antdMessage } = useAntdContextHolder()
    const { setData: setRoomClassDetail } = roomClassDetailStore()

    const { mutate: deleteMutation } = useMutation({
      mutationFn: deleteItem,
      onSuccess: async () => {
        antdMessage?.success('Room class deleted successfully')
        await queryClient.invalidateQueries({ queryKey: [queryKey.RES_ROOM_CLASS_LIST] })
      },
      onError: () => {
        antdMessage?.error('Failed to delete room class')
      },
    })

    return [
      {
        title: 'Name',
        dataIndex: 'class_name',
        key: 'class_name',
        width: '25%',
      },
      {
        title: 'Price',
        dataIndex: 'base_price',
        key: 'base_price',
        width: '20%',
        render: (price: number) => formatCurrency(price),
      },
      {
        title: 'Created At',
        dataIndex: 'created_at',
        key: 'created_at',
        width: '30%',
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
        align: 'center',
        render: (_, record) => (
          <Space>
            <Button
              type="text"
              icon={<FaPenToSquare />}
              onClick={() => {
                setRoomClassDetail(record)
                onEdit()
              }}
            />
            <Popconfirm
              title="Delete Room Class"
              description="Are you sure to delete this room class?"
              onConfirm={() => {
                deleteMutation(record.id)
              }}
              okText="Yes"
              cancelText="No"
            >
              <Button type="text" danger icon={<FaTrashCan className="text-red-500" />} />
            </Popconfirm>
          </Space>
        ),
      },
    ]
  }
}
