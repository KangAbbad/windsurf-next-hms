'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Drawer, Form, Input, Select } from 'antd'
import { AxiosError } from 'axios'
import { useEffect } from 'react'
import { IoClose } from 'react-icons/io5'

import { queryKey as queryKeyFloorList } from '../../floors/lib/constants'
import { queryKey as queryKeyRoomClassList } from '../../room-classes/lib/constants'
import { queryKey as queryKeyRoomStatusList } from '../../room-statuses/lib/constants'
import { queryKey } from '../lib/constants'
import { roomDetailStore } from '../lib/state'
import { createItem } from '../services/post'
import { updateItem } from '../services/put'

import { getAll as getFloors } from '@/app/(dashboard)/floors/services/get'
import { getAll as getRoomClasses } from '@/app/(dashboard)/room-classes/services/get'
import { getAll as getRoomStatuses } from '@/app/(dashboard)/room-statuses/services/get'
import { useAntdContextHolder } from '@/lib/context/AntdContextHolder'
import { ApiResponse } from '@/services/apiResponse'
import { inputNumberValidation } from '@/utils/inputNumberValidation'

type FormType = {
  room_number: string
  room_class_id: string
  status_id: string
  floor_id: string
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
  const { data: roomDetailState } = roomDetailStore()

  const { data: roomClassesResponse, isFetching: isLoadingRoomClasses } = useQuery({
    queryKey: [queryKeyRoomClassList.RES_ROOM_CLASS_LIST],
    queryFn: () => getRoomClasses({ page: 1, limit: 100 }),
  })
  const roomClasses = roomClassesResponse?.data?.items ?? []

  const { data: roomStatusesResponse, isFetching: isLoadingRoomStatuses } = useQuery({
    queryKey: [queryKeyRoomStatusList.RES_ROOM_STATUS_LIST],
    queryFn: () => getRoomStatuses({ page: 1, limit: 100 }),
  })
  const roomStatuses = roomStatusesResponse?.data?.items ?? []

  const { data: floorsResponse, isFetching: isLoadingFloors } = useQuery({
    queryKey: [queryKeyFloorList.RES_FLOOR_LIST],
    queryFn: () => getFloors({ page: 1, limit: 100 }),
  })
  const floors = floorsResponse?.data?.items ?? []

  const hideDrawer = () => {
    form.resetFields()
    onCancel()
  }

  const { mutate: createMutation, isPending: isCreateLoading } = useMutation({
    mutationFn: createItem,
    onSuccess: (res) => {
      antdMessage?.success(res?.message ?? 'Room created successfully')
      queryClient.invalidateQueries({ queryKey: [queryKey.RES_ROOM_LIST] })
      hideDrawer()
    },
    onError: (res: AxiosError<ApiResponse>) => {
      const errors = res.response?.data?.errors ?? []
      const errorMessages = errors.length ? errors.join(', ') : 'Failed to create room'
      antdMessage?.error(errorMessages)
    },
  })

  const { mutate: updateMutation, isPending: isUpdateLoading } = useMutation({
    mutationFn: updateItem,
    onSuccess: (res) => {
      antdMessage?.success(res?.message ?? 'Room updated successfully')
      queryClient.invalidateQueries({ queryKey: [queryKey.RES_ROOM_LIST] })
      hideDrawer()
    },
    onError: (res: AxiosError<ApiResponse>) => {
      const errors = res.response?.data?.errors ?? []
      const errorMessages = errors.length ? errors.join(', ') : 'Failed to update room'
      antdMessage?.error(errorMessages)
    },
  })

  const isFormLoading = isCreateLoading || isUpdateLoading

  const onSubmit = (values: FormType) => {
    if (isFormLoading) return
    if (roomDetailState) {
      updateMutation({ id: roomDetailState.id, ...values })
    } else {
      createMutation(values)
    }
  }

  useEffect(() => {
    if (!isVisible) return
    if (roomDetailState) {
      form.setFieldsValue({
        room_number: roomDetailState.room_number,
        room_class_id: roomDetailState.room_class_id,
        status_id: roomDetailState.status_id,
        floor_id: roomDetailState.floor_id,
      })
    } else {
      form.resetFields()
    }
  }, [isVisible])

  return (
    <Drawer
      title={roomDetailState ? 'Edit Room' : 'Add Room'}
      open={isVisible}
      placement="right"
      width={520}
      maskClosable={false}
      closeIcon={<IoClose className="text-black text-2xl" />}
      extra={
        <Button type="primary" loading={isFormLoading} onClick={form.submit}>
          {roomDetailState ? 'Update' : 'Create'}
        </Button>
      }
      onClose={hideDrawer}
    >
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <Form.Item<FormType>
          name="floor_id"
          label="Floor"
          rules={[{ required: true, message: 'Please select floor' }]}
          className="!mb-3"
        >
          <Select
            allowClear
            showSearch
            loading={isLoadingFloors}
            placeholder="Select floor"
            filterOption={(input, option) => {
              return (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }}
            options={floors.map((floor) => ({
              value: floor.id,
              label: floor.name,
            }))}
            className="!h-9"
          />
        </Form.Item>
        <Form.Item<FormType>
          name="room_number"
          label="Number"
          rules={[
            { required: true, message: 'Please enter number' },
            {
              pattern: /^\d+$/,
              message: 'Invalid number!',
            },
          ]}
          getValueFromEvent={inputNumberValidation}
          className="!mb-3"
        >
          <Input size="large" placeholder="Enter number" className="!text-sm" />
        </Form.Item>
        <Form.Item<FormType>
          name="room_class_id"
          label="Class"
          rules={[{ required: true, message: 'Please select class' }]}
          className="!mb-3"
        >
          <Select
            allowClear
            showSearch
            loading={isLoadingRoomClasses}
            placeholder="Select class"
            filterOption={(input, option) => {
              return (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }}
            options={roomClasses.map((roomClass) => ({
              value: roomClass.id,
              label: roomClass.name,
            }))}
            className="!h-9"
          />
        </Form.Item>
        <Form.Item<FormType>
          name="status_id"
          label="Status"
          rules={[{ required: true, message: 'Please select status' }]}
          className="!mb-3"
        >
          <Select
            allowClear
            showSearch
            loading={isLoadingRoomStatuses}
            placeholder="Select status"
            filterOption={(input, option) => {
              return (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }}
            options={roomStatuses.map((roomStatus) => ({
              value: roomStatus.id,
              label: roomStatus.name,
            }))}
            className="!h-9"
          />
        </Form.Item>
      </Form>
    </Drawer>
  )
}
