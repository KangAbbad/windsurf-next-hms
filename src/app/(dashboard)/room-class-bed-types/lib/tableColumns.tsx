import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Popconfirm, Space } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { FaPenToSquare, FaTrashCan } from 'react-icons/fa6'

import { queryKey } from './constants'
import { roomClassBedTypeDetailStore } from './state'
import { deleteItem, DeleteItemParams } from '../services/delete'

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
      mutationFn: (params: DeleteItemParams) => deleteItem(params),
      onSuccess: () => {
        antdMessage?.success('Room class bed type deleted successfully')
        queryClient.invalidateQueries({ queryKey: [queryKey.RES_ROOM_CLASS_BED_TYPE_LIST] })
      },
      onError: () => {
        antdMessage?.error('Failed to delete room class bed type')
      },
    })

    return [
      {
        title: 'Room Class',
        dataIndex: ['room_class', 'class_name'],
        key: 'room_class_name',
        width: '30%',
        sorter: (a, b) => {
          const aName = a.room_class?.class_name ?? ''
          const bName = b.room_class?.class_name ?? ''
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
        dataIndex: 'num_beds',
        key: 'num_beds',
        width: '20%',
        sorter: (a, b) => a.num_beds - b.num_beds,
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
        width: '20%',
        render: (_, record) => {
          return (
            <Space>
              <Button
                type="text"
                icon={<FaPenToSquare />}
                onClick={() => {
                  setRoomClassBedTypeDetail({
                    room_class_id: record.room_class_id,
                    bed_type_id: record.bed_type_id,
                    num_beds: record.num_beds,
                    created_at: record.created_at,
                    updated_at: record.updated_at,
                    room_class: record.room_class,
                    bed_type: record.bed_type,
                  })
                  onEdit()
                }}
              />
              <Popconfirm
                title="Delete Room Class Bed Type"
                description="Are you sure you want to delete this room class bed type?"
                placement="leftTop"
                okText="Yes"
                cancelText="No"
                okType="danger"
                disabled={isDeleteLoading}
                onConfirm={() => {
                  deleteMutation({
                    roomClassId: record.room_class_id,
                    bedTypeId: record.bed_type_id,
                  })
                }}
              >
                <Button
                  type="text"
                  danger
                  icon={<FaTrashCan className="text-red-500" />}
                  loading={
                    isDeleteLoading &&
                    deleteVariables.roomClassId === record.room_class_id &&
                    deleteVariables.bedTypeId === record.bed_type_id
                  }
                />
              </Popconfirm>
            </Space>
          )
        },
      },
    ]
  }
}
