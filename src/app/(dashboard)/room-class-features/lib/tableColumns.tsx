import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Popconfirm, Space } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { FaPenToSquare, FaTrashCan } from 'react-icons/fa6'

import { queryKey } from './constants'
import { roomClassFeatureDetailStore } from './state'
import { deleteItem, DeleteRoomClassFeatureParams } from '../services/delete'

import { useAntdContextHolder } from '@/lib/context/AntdContextHolder'
import { RoomClassFeatureListItem } from '@/types/room-class-feature'

type Props = {
  onEdit: () => void
}

export const tableColumns = (props: Props) => {
  const { onEdit } = props

  return (): ColumnsType<RoomClassFeatureListItem> => {
    const queryClient = useQueryClient()
    const { antdMessage } = useAntdContextHolder()
    const { setData: setRoomClassFeatureDetail } = roomClassFeatureDetailStore()

    const {
      mutate: deleteMutation,
      variables: deleteVariables,
      isPending: isDeleteLoading,
    } = useMutation({
      mutationFn: deleteItem,
      onSuccess: () => {
        antdMessage?.success('Room class feature deleted successfully')
        queryClient.invalidateQueries({ queryKey: [queryKey.RES_ROOM_CLASS_FEATURE_LIST] })
      },
      onError: () => {
        antdMessage?.error('Failed to delete room class feature')
      },
    })

    const onDelete = ({ roomClassId, featureId }: DeleteRoomClassFeatureParams) => {
      if (isDeleteLoading) return
      deleteMutation({ roomClassId, featureId })
    }

    return [
      {
        title: 'Room Class',
        dataIndex: ['room_class', 'class_name'],
        key: 'room_class_name',
        width: '30%',
        sorter: (a, b) => a.room_class_id.localeCompare(b.room_class_id),
      },
      {
        title: 'Feature',
        dataIndex: ['feature', 'feature_name'],
        key: 'feature_name',
        width: '40%',
        sorter: (a, b) => a.feature_id.localeCompare(b.feature_id),
      },
      {
        title: 'Actions',
        key: 'actions',
        width: '30%',
        align: 'center',
        render: (_, record) => {
          return (
            <Space>
              <Button
                type="text"
                icon={<FaPenToSquare />}
                onClick={() => {
                  setRoomClassFeatureDetail(record)
                  onEdit()
                }}
              />
              <Popconfirm
                title="Delete Room Class Features"
                description="Are you sure you want to delete all features from this room class?"
                placement="leftTop"
                okText="Yes"
                okType="danger"
                cancelText="No"
                onConfirm={() => {
                  onDelete({ roomClassId: record.room_class_id, featureId: record.feature_id })
                }}
                okButtonProps={{
                  loading:
                    isDeleteLoading &&
                    deleteVariables.roomClassId === record.room_class_id &&
                    deleteVariables.featureId === record.feature_id,
                }}
              >
                <Button
                  type="text"
                  danger
                  icon={<FaTrashCan className="text-red-500" />}
                  loading={
                    isDeleteLoading &&
                    deleteVariables.roomClassId === record.room_class_id &&
                    deleteVariables.featureId === record.feature_id
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
