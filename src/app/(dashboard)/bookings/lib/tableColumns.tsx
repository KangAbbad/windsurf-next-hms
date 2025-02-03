import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Popconfirm, Space, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { FaPenToSquare, FaTrashCan } from 'react-icons/fa6'

import { queryKey } from './constants'
import { bookingDetailStore } from './state'
import { deleteItem } from '../services/delete'

import { BookingListItem } from '@/app/api/bookings/types'
import { useAntdContextHolder } from '@/lib/context/AntdContextHolder'

type Props = {
  onEdit: () => void
}

export const tableColumns = (props: Props) => {
  const { onEdit } = props

  return (): ColumnsType<BookingListItem> => {
    const queryClient = useQueryClient()
    const { antdMessage } = useAntdContextHolder()
    const { setData: setBookingDetail } = bookingDetailStore()

    const {
      mutate: deleteMutation,
      variables: deleteVariables,
      isPending: isDeleteLoading,
    } = useMutation({
      mutationFn: deleteItem,
      onSuccess: () => {
        antdMessage?.success('Booking deleted successfully')
        queryClient.invalidateQueries({ queryKey: [queryKey.RES_BOOKING_LIST] })
      },
      onError: () => {
        antdMessage?.error('Failed to delete booking')
      },
    })

    const onDelete = (id: string) => {
      if (isDeleteLoading) return
      deleteMutation(id)
    }

    return [
      {
        title: 'Guest',
        key: 'guest',
        width: '20%',
        render: (_, record) => (
          <span>
            {record.guest.first_name} {record.guest.last_name}
            <br />
            <small className="text-gray-500">{record.guest.email_address}</small>
          </span>
        ),
        sorter: (a, b) =>
          `${a.guest.first_name} ${a.guest.last_name}`.localeCompare(`${b.guest.first_name} ${b.guest.last_name}`),
      },
      {
        title: 'Stay Period',
        key: 'stay_period',
        width: '15%',
        render: (_, record) => {
          const checkin = new Date(record.checkin_date)
          const checkout = new Date(record.checkout_date)
          const nights = Math.ceil((checkout.getTime() - checkin.getTime()) / (1000 * 60 * 60 * 24))

          return (
            <span>
              {checkin.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
              {' - '}
              {checkout.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
              <br />
              <small className="text-gray-500">{nights} night(s)</small>
            </span>
          )
        },
        sorter: (a, b) => new Date(a.checkin_date).getTime() - new Date(b.checkin_date).getTime(),
      },
      {
        title: 'Rooms',
        key: 'rooms',
        width: '15%',
        render: (_, record) => (
          <Space direction="vertical" size="small">
            {record.rooms.map((room) => (
              <Tag key={room.id}>
                Room {room.room_number} ({room.room_class.class_name})
              </Tag>
            ))}
          </Space>
        ),
      },
      {
        title: 'Guests',
        key: 'guests',
        width: '10%',
        render: (_, record) => (
          <span>
            {record.num_adults} Adult(s)
            {record.num_children > 0 && (
              <>
                <br />
                <small className="text-gray-500">{record.num_children} Children</small>
              </>
            )}
          </span>
        ),
        sorter: (a, b) => a.num_adults - b.num_adults,
      },
      {
        title: 'Amount',
        dataIndex: 'booking_amount',
        key: 'booking_amount',
        width: '15%',
        sorter: (a, b) => a.booking_amount - b.booking_amount,
        render: (amount) => (
          <span className="font-medium">
            ${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        ),
      },
      {
        title: 'Payment Status',
        key: 'payment_status',
        width: '15%',
        render: (_, record) => (
          <Tag
            color={
              record.payment_status.name.toLowerCase() === 'paid'
                ? 'success'
                : record.payment_status.name.toLowerCase() === 'pending'
                  ? 'warning'
                  : 'error'
            }
          >
            {record.payment_status.name}
          </Tag>
        ),
        sorter: (a, b) => a.payment_status.name.localeCompare(b.payment_status.name),
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
                setBookingDetail(record)
                onEdit()
              }}
            />
            <Popconfirm
              title="Delete booking"
              description="Are you sure you want to delete this booking?"
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
          </Space>
        ),
      },
    ]
  }
}
