import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Popconfirm, Space } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { FaPenToSquare, FaTrashCan } from 'react-icons/fa6'

import { queryKey } from './constants'
import { roomClassBedTypeDetailStore } from './state'
import { deleteItem } from '../services/delete'

import { useAntdContextHolder } from '@/lib/context/AntdContextHolder'
import { RoomClassBedTypeListItem } from '@/types/room-class-bed-type'

type Props = {
  onEdit: () => void
}

export const tableColumns = (props: Props) => {
  const { onEdit } = props

  return (): ColumnsType<RoomClassBedTypeListItem> => {
    const queryClient = useQueryClient()
    const { antdMessage } = useAntdContextHolder()
    const { setData: setRoomClassBedTypeDetail } = roomClassBedTypeDetailStore()

    const {
      mutate: deleteMutation,
      variables: deleteVariables,
      isPending: isDeleteLoading,
    } = useMutation({
      mutationFn: deleteItem,
      onSuccess: () => {
        antdMessage?.success('Room class bed type deleted successfully')
        queryClient.invalidateQueries({ queryKey: [queryKey.RES_ROOM_CLASS_BED_TYPE_LIST] })
      },
      onError: () => {
        antdMessage?.error('Failed to delete room class bed type')
      },
    })

    const onDelete = (id: string) => {
      if (isDeleteLoading) return
      deleteMutation(id)
    }

    return [
      {
        title: 'Room Class',
        dataIndex: ['room_class', 'room_class_name'],
        key: 'room_class_name',
        width: '30%',
        sorter: (a, b) => {
          const aName = a.room_class?.room_class_name ?? ''
          const bName = b.room_class?.room_class_name ?? ''
          return aName.localeCompare(bName)
        },
      },
      {
        title: 'Bed Type',
        dataIndex: ['bed_type', 'bed_type_name'],
        key: 'bed_type_name',
        width: '30%',
        sorter: (a, b) => {
          const aName = a.bed_type?.bed_type_name ?? ''
          const bName = b.bed_type?.bed_type_name ?? ''
          return aName.localeCompare(bName)
        },
      },
      {
        title: 'Quantity',
        dataIndex: 'quantity',
        key: 'quantity',
        width: '20%',
        sorter: (a, b) => a.quantity - b.quantity,
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
                  setRoomClassBedTypeDetail(record)
                  onEdit()
                }}
              />
              <Popconfirm
                title="Delete Room Class Bed Type"
                description="Are you sure to delete this room class bed type?"
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
