import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Popconfirm, Space, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { FaPenToSquare, FaTrashCan } from 'react-icons/fa6'

import { queryKey } from './constants'
import { roomDetailStore } from './state'
import { deleteItem } from '../services/delete'

import { RoomListItem } from '@/app/api/rooms/types'
import { useAntdContextHolder } from '@/lib/context/AntdContextHolder'

type Props = {
  onEdit: () => void
}

export const tableColumns = (props: Props) => {
  const { onEdit } = props

  return (): ColumnsType<RoomListItem> => {
    const queryClient = useQueryClient()
    const { antdMessage } = useAntdContextHolder()
    const { setData: setRoomDetail } = roomDetailStore()

    const {
      mutate: deleteMutation,
      variables: deleteVariables,
      isPending: isDeleteLoading,
    } = useMutation({
      mutationFn: deleteItem,
      onSuccess: () => {
        antdMessage?.success('Room deleted successfully')
        queryClient.invalidateQueries({ queryKey: [queryKey.RES_ROOM_LIST] })
      },
      onError: () => {
        antdMessage?.error('Failed to delete room')
      },
    })

    const onDelete = (id: string) => {
      if (isDeleteLoading) return
      deleteMutation(id)
    }

    return [
      {
        title: 'Room Number',
        dataIndex: 'room_number',
        key: 'room_number',
        width: '20%',
        sorter: (a, b) => a.room_number.localeCompare(b.room_number),
      },
      {
        title: 'Room Class',
        dataIndex: ['room_class', 'class_name'],
        key: 'room_class',
        width: '20%',
        sorter: (a, b) => a.room_class.class_name.localeCompare(b.room_class.class_name),
      },
      {
        title: 'Status',
        dataIndex: ['room_status', 'status_name'],
        key: 'status',
        width: '20%',
        sorter: (a, b) => a.room_status.name.localeCompare(b.room_status.name),
        render: (_, record) => {
          const statusColor: { [key: number]: string } = {
            1: 'green',
            2: 'blue',
            3: 'orange',
            4: 'red',
          }

          return <Tag color={statusColor[record.room_status.number] ?? 'default'}>{record.room_status.name}</Tag>
        },
      },
      {
        title: 'Floor',
        dataIndex: ['floor', 'number'],
        key: 'floor',
        width: '20%',
        sorter: (a, b) => a.floor.number - b.floor.number,
        render: (number) => `Floor ${number}`,
      },
      {
        title: 'Created At',
        dataIndex: 'created_at',
        key: 'created_at',
        width: '20%',
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
        width: '10%',
        align: 'center',
        render: (_, record) => (
          <Space>
            <Button
              type="text"
              icon={<FaPenToSquare />}
              onClick={() => {
                setRoomDetail(record)
                onEdit()
              }}
            />
            <Popconfirm
              title="Delete room"
              description="Are you sure you want to delete this room?"
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
        ),
      },
    ]
  }
}
