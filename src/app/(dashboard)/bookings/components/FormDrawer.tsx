'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Form, DatePicker, Select, Typography, Drawer, Button, Input } from 'antd'
import dayjs from 'dayjs'
import { useEffect } from 'react'
import { IoClose } from 'react-icons/io5'

import { queryKey as queryKeyAddonList } from '../../addons/lib/constants'
import { getAll as getAddons } from '../../addons/services/get'
import { queryKey as queryKeyGuestList } from '../../guests/lib/constants'
import { getAll as getGuests } from '../../guests/services/get'
import { queryKey as queryKeyPaymentStatusList } from '../../payment-statuses/lib/constants'
import { getAll as getPaymentStatuses } from '../../payment-statuses/services/get'
import { queryKey as queryKeyRoomList } from '../../rooms/lib/constants'
import { getAll as getRooms } from '../../rooms/services/get'
import { queryKey } from '../lib/constants'
import { bookingDetailStore } from '../lib/state'
import { createItem } from '../services/post'
import { updateItem } from '../services/put'

import { CreateBookingBody, UpdateBookingBody } from '@/app/api/bookings/types'
import { useAntdContextHolder } from '@/lib/context/AntdContextHolder'
import { formatCurrency } from '@/utils/formatCurrency'
import { inputNumberValidation } from '@/utils/inputNumberValidation'

const { RangePicker } = DatePicker
const { Title } = Typography

type FormType = {
  guest_id: string
  payment_status_id: string
  dates: [dayjs.Dayjs, dayjs.Dayjs]
  num_adults: number
  num_children: number
  booking_amount: number
  room_ids: string[]
  addon_ids: string[]
}

type Props = {
  isVisible: boolean
  onCancel: () => void
}

export default function FormDrawer(props: Props) {
  const { isVisible, onCancel } = props
  const queryClient = useQueryClient()
  const { antdMessage } = useAntdContextHolder()
  const [form] = Form.useForm<FormType>()
  const { data: bookingDetailState } = bookingDetailStore()
  const bookingAmount = Form.useWatch('booking_amount', form) ?? 0

  const { data: guestsResponse, isFetching: isLoadingGuests } = useQuery({
    queryKey: [queryKeyGuestList.RES_GUEST_LIST],
    queryFn: () => getGuests({ page: 1, limit: 100 }),
    enabled: isVisible,
  })
  const guests = guestsResponse?.data?.items ?? []

  const { data: paymentStatusesResponse, isFetching: isLoadingPaymentStatuses } = useQuery({
    queryKey: [queryKeyPaymentStatusList.RES_PAYMENT_STATUS_LIST],
    queryFn: () => getPaymentStatuses({ page: 1, limit: 100 }),
    enabled: isVisible,
  })
  const paymentStatuses = paymentStatusesResponse?.data?.items ?? []

  const { data: roomsResponse, isFetching: isLoadingRooms } = useQuery({
    queryKey: [queryKeyRoomList.RES_ROOM_LIST],
    queryFn: () => getRooms({ page: 1, limit: 100 }),
    enabled: isVisible,
  })
  const rooms = roomsResponse?.data?.items ?? []

  const { data: addonsResponse, isFetching: isLoadingAddons } = useQuery({
    queryKey: [queryKeyAddonList.RES_ADDON_LIST],
    queryFn: () => getAddons({ page: 1, limit: 100 }),
    enabled: isVisible,
  })
  const addons = addonsResponse?.data?.items ?? []

  const hideDrawer = () => {
    form.resetFields()
    onCancel()
  }

  const { mutate: createMutation, isPending: isCreateLoading } = useMutation({
    mutationFn: createItem,
    onSuccess: (res) => {
      antdMessage?.success(res?.message ?? 'Booking created successfully')
      queryClient.invalidateQueries({ queryKey: [queryKey.RES_BOOKING_LIST] })
      hideDrawer()
    },
    onError: (res) => {
      antdMessage?.error(res?.message ?? 'Failed to create booking')
    },
  })

  const { mutate: updateMutation, isPending: isUpdateLoading } = useMutation({
    mutationFn: updateItem,
    onSuccess: (res) => {
      antdMessage?.success(res?.message ?? 'Booking updated successfully')
      queryClient.invalidateQueries({ queryKey: [queryKey.RES_BOOKING_LIST] })
      hideDrawer()
    },
    onError: (res) => {
      antdMessage?.error(res?.message ?? 'Failed to update booking')
    },
  })

  const isFormLoading = isCreateLoading || isUpdateLoading

  const calculateTotalAmount = (selectedRooms: string[], selectedAddons: string[], nights: number) => {
    const roomsTotal = selectedRooms.reduce((total, roomId) => {
      const room = rooms.find((r) => r.id === roomId)
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      return total + (room?.room_class.price || 0)
    }, 0)

    const addonsTotal = selectedAddons.reduce((total, addonId) => {
      const addon = addons.find((a) => a.id === addonId)
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      return total + (addon?.price || 0)
    }, 0)

    return roomsTotal * nights + addonsTotal
  }

  const onFieldsChange = () => {
    const values = form.getFieldsValue()
    const { dates, room_ids = [], addon_ids = [] } = values

    if (dates?.[0] && dates?.[1] && room_ids.length > 0) {
      const nights = dates[1].diff(dates[0], 'days')
      const totalAmount = calculateTotalAmount(room_ids, addon_ids || [], nights)
      form.setFieldValue('booking_amount', totalAmount)
    }
  }

  const onSubmit = (values: FormType) => {
    if (isFormLoading) return
    const { dates, ...restValues } = values
    const [checkin_date, checkout_date] = dates

    const submitData: CreateBookingBody | UpdateBookingBody = {
      ...restValues,
      num_adults: Number(values.num_adults),
      num_children: Number(values.num_children),
      checkin_date: checkin_date.format('YYYY-MM-DD'),
      checkout_date: checkout_date.format('YYYY-MM-DD'),
    }

    if (bookingDetailState) {
      updateMutation({ id: bookingDetailState.id, ...submitData })
    } else {
      createMutation(submitData)
    }
  }

  useEffect(() => {
    if (!isVisible) return
    if (bookingDetailState) {
      form.setFieldsValue({
        guest_id: bookingDetailState.guest.id,
        payment_status_id: bookingDetailState.payment_status.id,
        dates: [dayjs(bookingDetailState.checkin_date), dayjs(bookingDetailState.checkout_date)],
        num_adults: bookingDetailState.num_adults,
        num_children: bookingDetailState.num_children,
        booking_amount: bookingDetailState.booking_amount,
        room_ids: bookingDetailState.rooms.map((room) => room.id),
        addon_ids: bookingDetailState.addons.map((addon) => addon.id),
      })
    } else {
      form.resetFields()
    }
  }, [isVisible])

  return (
    <Drawer
      title={bookingDetailState ? 'Edit Booking' : 'Add Booking'}
      open={isVisible}
      placement="right"
      width={520}
      maskClosable={false}
      closeIcon={<IoClose className="text-black text-2xl" />}
      extra={
        <Button type="primary" loading={isFormLoading} onClick={form.submit}>
          {bookingDetailState ? 'Update' : 'Create'}
        </Button>
      }
      onClose={hideDrawer}
    >
      <Form form={form} layout="vertical" onFinish={onSubmit} onFieldsChange={onFieldsChange}>
        <Form.Item<FormType>
          name="guest_id"
          label="Guest"
          rules={[{ required: true, message: 'Please select a guest' }]}
          className="!mb-3"
        >
          <Select
            showSearch
            loading={isLoadingGuests}
            placeholder="Select a guest"
            optionFilterProp="children"
            options={guests.map((guest) => ({
              value: guest.id,
              label: `${guest.name} (${guest.phone} - ${guest.email})`,
            }))}
          />
        </Form.Item>

        <Form.Item<FormType>
          name="payment_status_id"
          label="Payment Status"
          rules={[{ required: true, message: 'Please select a payment status' }]}
          className="!mb-3"
        >
          <Select
            loading={isLoadingPaymentStatuses}
            placeholder="Select a payment status"
            options={paymentStatuses.map((status) => ({
              value: status.id,
              label: status.name,
            }))}
          />
        </Form.Item>

        <Form.Item<FormType>
          name="dates"
          label="Check-in / Check-out Dates"
          rules={[{ required: true, message: 'Please select dates' }]}
          className="!mb-3"
        >
          <RangePicker
            className="w-full"
            format="YYYY-MM-DD"
            disabledDate={(current) => current && current < dayjs().startOf('day')}
          />
        </Form.Item>

        <div className="flex gap-3">
          <Form.Item<FormType>
            name="num_adults"
            label="Number of Adults"
            rules={[
              { required: true, message: 'Please enter number of adults' },
              {
                pattern: /^\d+$/,
                message: 'Invalid number!',
              },
            ]}
            getValueFromEvent={inputNumberValidation}
            className="flex-1 !mb-3"
          >
            <Input placeholder="min: 1" className="max-w-20" />
          </Form.Item>

          <Form.Item<FormType>
            name="num_children"
            label="Number of Children"
            rules={[
              {
                pattern: /^\d+$/,
                message: 'Invalid number!',
              },
            ]}
            getValueFromEvent={inputNumberValidation}
            className="flex-1 !mb-3"
          >
            <Input className="max-w-20" />
          </Form.Item>
        </div>

        <Form.Item<FormType>
          name="room_ids"
          label="Rooms"
          rules={[{ required: true, message: 'Please select at least one room' }]}
          className="!mb-3"
        >
          <Select
            mode="multiple"
            loading={isLoadingRooms}
            placeholder="Select rooms"
            options={rooms.map((room) => ({
              value: room.id,
              label: `Room ${room.number} (${room.room_class.name})`,
            }))}
          />
        </Form.Item>

        <Form.Item<FormType> name="addon_ids" label="Addons" className="!mb-3">
          <Select
            mode="multiple"
            loading={isLoadingAddons}
            placeholder="Select addons"
            options={addons.map((addon) => ({
              value: addon.id,
              label: `${addon.name} (${formatCurrency(addon.price)})`,
            }))}
          />
        </Form.Item>

        <Form.Item<FormType> name="booking_amount" label="Total Amount" className="!mb-3">
          <Title level={4} className="!mb-0">
            {formatCurrency(bookingAmount)}
          </Title>
        </Form.Item>
      </Form>
    </Drawer>
  )
}
