import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Flex, Popconfirm, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { FaPenToSquare, FaTrashCan } from 'react-icons/fa6'

import { queryKey } from './constants'
import { roomDetailStore } from './state'
import { deleteItem } from '../services/delete'

import { RoomListItem } from '@/app/api/rooms/types'
import { ImageFallback } from '@/components/ImageFallback'
import { useAntdContextHolder } from '@/lib/context/AntdContextHolder'
import { formatCurrency } from '@/utils/formatCurrency'

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
        title: 'Room',
        dataIndex: 'room_class',
        key: 'room_class',
        width: '15%',
        fixed: 'left',
        sorter: (a, b) => a.room_class.name.localeCompare(b.room_class.name),
        render: (_, record) => {
          const { room_class } = record
          const { bed_type } = (room_class.bed_types ?? [])[0]

          return (
            <>
              <Typography.Paragraph className="font-semibold !mb-0">
                Floor: {record.floor.number}{' '}
                <Typography.Text className="font-normal">({record.floor.name})</Typography.Text>
              </Typography.Paragraph>
              <Typography.Paragraph className="font-semibold !mb-2">Room number: {record.number}</Typography.Paragraph>
              <Flex gap={8}>
                <div className="rounded-lg border border-[#D9D9D9] bg-[rgba(0,0,0,0.02)] h-[150px] w-[150px] overflow-hidden">
                  <ImageFallback
                    src={room_class.image_url ?? require('@/assets/images/empty-placeholder.png')}
                    alt={room_class.name}
                    height={150}
                    width={150}
                    className="!h-full !w-full !object-contain"
                  />
                </div>
                <div>
                  <Typography.Paragraph className="!mb-0">{room_class.name}</Typography.Paragraph>
                  <Typography.Paragraph className="!text-gray-400 !mb-0">{bed_type.material}</Typography.Paragraph>
                  <Typography.Paragraph className="!text-gray-400 !mb-0">
                    {bed_type.length}x{bed_type.width}x{bed_type.height}
                  </Typography.Paragraph>
                  <Typography.Paragraph className="!mt-2 !mb-0">
                    {formatCurrency(room_class.price)}
                  </Typography.Paragraph>
                </div>
              </Flex>
            </>
          )
        },
      },
      {
        title: 'Status',
        dataIndex: ['room_status', 'name'],
        key: 'status',
        width: '13%',
        sorter: (a, b) => a.room_status.name.localeCompare(b.room_status.name),
        render: (_, record) => {
          return <Tag color={record.room_status.color ?? 'default'}>{record.room_status.name}</Tag>
        },
      },
      {
        title: 'Time',
        dataIndex: 'created_at',
        key: 'created_at',
        width: '10%',
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
        width: '10%',
        align: 'center',
        fixed: 'right',
        render: (_, record) => (
          <Flex gap={4} align="center" justify="center">
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
              disabled={isDeleteLoading && deleteVariables === record.id}
            >
              <Button
                type="text"
                danger
                icon={<FaTrashCan />}
                loading={isDeleteLoading && deleteVariables === record.id}
              />
            </Popconfirm>
          </Flex>
        ),
      },
    ]
  }
}
