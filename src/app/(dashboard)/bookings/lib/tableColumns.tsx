import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Flex, Popconfirm, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { usePathname, useRouter } from 'next/navigation'
import { FaPenToSquare, FaTrashCan } from 'react-icons/fa6'

import { queryKey } from './constants'
import { getPageParams } from './getPageParams'
import { bookingDetailStore } from './state'
import { deleteItem } from '../services/delete'

import { BookingListItem } from '@/app/api/bookings/types'
import { useAntdContextHolder } from '@/lib/context/AntdContextHolder'
import { searchByTableColumn } from '@/utils/changeTableFilter'
import { formatCurrency } from '@/utils/formatCurrency'
import { getColumnSearchProps } from '@/utils/getColumnSearchProps'

type Props = {
  onEdit: () => void
}

export const tableColumns = (props: Props) => {
  const { onEdit } = props

  return (): ColumnsType<BookingListItem> => {
    const router = useRouter()
    const pathname = usePathname()
    const queryClient = useQueryClient()
    const { antdMessage } = useAntdContextHolder()
    const pageParams = getPageParams()
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
        title: 'Guest PIC',
        key: 'guest',
        dataIndex: 'guest',
        width: '20%',
        fixed: 'left',
        ...getColumnSearchProps({
          initialValue: pageParams.search?.guest,
          placeholder: 'Search by guest name',
          onSearch: (value) => {
            searchByTableColumn({ router, pathname, pageParams, dataIndex: 'search[guest]', value })
          },
        }),
        sorter: (a, b) => a.guest.name.localeCompare(b.guest.name),
        render: (_, record) => (
          <span>
            {record.guest.name}
            <br />
            <small className="text-gray-500">{record.guest.email ?? record.guest.phone}</small>
          </span>
        ),
      },
      {
        title: 'Stay Period',
        key: 'checkin_date',
        dataIndex: 'checkin_date',
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
        dataIndex: 'rooms',
        width: '15%',
        render: (_, record) => (
          <Flex gap={4} vertical>
            {record.rooms.map((room) => (
              <div key={room.id}>
                <Tag>
                  Room {room.number} ({room.room_class.name})
                </Tag>
              </div>
            ))}
          </Flex>
        ),
      },
      {
        title: 'Guests',
        key: 'num_adults',
        dataIndex: 'num_adults',
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
        ...getColumnSearchProps({
          initialValue: pageParams.search?.amount,
          placeholder: 'Search by amount',
          onSearch: (value) => {
            searchByTableColumn({ router, pathname, pageParams, dataIndex: 'search[amount]', value })
          },
        }),
        sorter: (a, b) => a.booking_amount - b.booking_amount,
        render: (amount) => <span className="font-medium">{formatCurrency(amount)}</span>,
      },
      {
        title: 'Payment Status',
        key: 'payment_status',
        dataIndex: 'payment_status',
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
        dataIndex: 'id',
        width: '10%',
        align: 'center',
        fixed: 'right',
        render: (_, record) => (
          <Flex gap={4} align="center" justify="center">
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
          </Flex>
        ),
      },
    ]
  }
}
