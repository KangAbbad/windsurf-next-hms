import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Popconfirm, Space, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { FaPenToSquare, FaTrashCan } from 'react-icons/fa6'

import { queryKey } from './constants'
import { roomClassDetailStore } from './state'
import { deleteItem } from '../services/delete'

import type { RoomClassListItem } from '@/app/api/room-classes/types'
import { useAntdContextHolder } from '@/lib/context/AntdContextHolder'
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
      onSuccess: () => {
        antdMessage?.success('Room class deleted successfully')
        queryClient.invalidateQueries({ queryKey: [queryKey.RES_ROOM_CLASS_LIST] })
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
        width: '20%',
      },
      {
        title: 'Price',
        dataIndex: 'base_price',
        key: 'base_price',
        width: '15%',
        render: (price: number) => formatCurrency(price),
      },
      {
        title: 'Bed Types',
        key: 'bed_types',
        width: '20%',
        render: (_, record) => (
          <Space direction="vertical">
            {record.bed_types.map((bt) => (
              <span key={bt.bed_type.id}>
                {bt.bed_type.name} ({bt.num_beds} bed{bt.num_beds > 1 ? 's' : ''})
              </span>
            ))}
          </Space>
        ),
      },
      {
        title: 'Features',
        key: 'features',
        width: '20%',
        render: (_, record) => (
          <Space size={8} wrap>
            {record.features.map((feature) => (
              <Tag key={feature.id}>{feature.name}</Tag>
            ))}
          </Space>
        ),
      },
      {
        title: 'Created At',
        dataIndex: 'created_at',
        key: 'created_at',
        width: '15%',
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
        width: '10%',
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
