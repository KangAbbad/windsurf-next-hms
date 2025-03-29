'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Form, DatePicker, Select, Typography, Drawer, Button, Input } from 'antd'
import { AxiosError } from 'axios'
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
import { ApiResponse } from '@/services/apiResponse'
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
  amount: number
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
  const watchDates = Form.useWatch('dates', form) ?? []
  const watchRoomIds = Form.useWatch('room_ids', form) ?? []
  const watchAddonIds = Form.useWatch('addon_ids', form) ?? []
  const { data: bookingDetailState } = bookingDetailStore()

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

  const roomsTotal = watchRoomIds.reduce((total, roomId) => {
    const room = rooms.find((r) => r.id === roomId)
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    return total + (room?.room_class.price || 0)
  }, 0)
  const addonsTotal = watchAddonIds.reduce((total, addonId) => {
    const addon = addons.find((a) => a.id === addonId)
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    return total + (addon?.price || 0)
  }, 0)
  const nights = watchDates.length ? watchDates[1].diff(watchDates[0], 'days') : 0
  const bookingAmount = roomsTotal * nights + addonsTotal

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
    onError: (res: AxiosError<ApiResponse>) => {
      const errors = res.response?.data?.errors ?? []
      const errorMessages = errors.length ? errors.join(', ') : 'Failed to create booking'
      antdMessage?.error(errorMessages)
    },
  })

  const { mutate: updateMutation, isPending: isUpdateLoading } = useMutation({
    mutationFn: updateItem,
    onSuccess: (res) => {
      antdMessage?.success(res?.message ?? 'Booking updated successfully')
      queryClient.invalidateQueries({ queryKey: [queryKey.RES_BOOKING_LIST] })
      hideDrawer()
    },
    onError: (res: AxiosError<ApiResponse>) => {
      const errors = res.response?.data?.errors ?? []
      const errorMessages = errors.length ? errors.join(', ') : 'Failed to update booking'
      antdMessage?.error(errorMessages)
    },
  })

  const isFormLoading = isCreateLoading || isUpdateLoading

  const onSubmit = (values: FormType) => {
    if (isFormLoading) return
    const { dates, ...restValues } = values
    const [checkin_date, checkout_date] = dates

    const submitData: CreateBookingBody | UpdateBookingBody = {
      ...restValues,
      num_adults: Number(values.num_adults),
      num_children: Number(values.num_children),
      checkin_date: checkin_date.toISOString(),
      checkout_date: checkout_date.toISOString(),
      amount: bookingAmount,
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
        guest_id: bookingDetailState.guest?.id,
        payment_status_id: bookingDetailState.payment_status.id,
        dates: [dayjs(bookingDetailState.checkin_date), dayjs(bookingDetailState.checkout_date)],
        num_adults: bookingDetailState.num_adults,
        num_children: bookingDetailState.num_children,
        amount: bookingDetailState.amount,
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
      closeIcon={<IoClose className="text-black dark:text-white text-2xl" />}
      extra={
        <Button type="primary" loading={isFormLoading} onClick={form.submit}>
          {bookingDetailState ? 'Update' : 'Create'}
        </Button>
      }
      onClose={hideDrawer}
    >
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <Form.Item<FormType>
          name="guest_id"
          label="Guest"
          rules={[{ required: true, message: 'Please select a guest' }]}
          className="!mb-3"
        >
          <Select
            showSearch
            loading={isLoadingGuests}
            disabled={!!bookingDetailState?.guest}
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
            format="YYYY-MM-DD, HH:mm"
            showTime
            disabled={[!!bookingDetailState?.checkin_date, false]}
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
            initialValue={1}
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
            initialValue={0}
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

        <Typography.Paragraph className="!mb-1">Total Amount:</Typography.Paragraph>
        <Title level={4} className="!m-0">
          {formatCurrency(bookingAmount)}
        </Title>
      </Form>
    </Drawer>
  )
}
