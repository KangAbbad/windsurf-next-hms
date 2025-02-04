'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Modal, Form, Input, Select } from 'antd'
import { useEffect } from 'react'

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

export default function FormModal(props: Props) {
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

  const hideModal = () => {
    form.resetFields()
    onCancel()
  }

  const { mutate: createMutation, isPending: isCreateLoading } = useMutation({
    mutationFn: createItem,
    onSuccess: (res) => {
      antdMessage?.success(res?.message ?? 'Room created successfully')
      hideModal()
      queryClient.invalidateQueries({ queryKey: [queryKey.RES_ROOM_LIST] })
    },
    onError: (res) => {
      antdMessage?.error(res?.message ?? 'Failed to create room')
    },
  })

  const { mutate: updateMutation, isPending: isUpdateLoading } = useMutation({
    mutationFn: updateItem,
    onSuccess: (res) => {
      antdMessage?.success(res?.message ?? 'Room updated successfully')
      hideModal()
      queryClient.invalidateQueries({ queryKey: [queryKey.RES_ROOM_LIST] })
    },
    onError: (res) => {
      antdMessage?.error(res?.message ?? 'Failed to update room')
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
    <Modal
      open={isVisible}
      title={roomDetailState ? 'Edit Room' : 'Create New Room'}
      confirmLoading={isFormLoading}
      maskClosable={false}
      width={520}
      okText={roomDetailState ? 'Update' : 'Create'}
      onCancel={onCancel}
      onOk={form.submit}
    >
      <Form form={form} layout="vertical" onFinish={onSubmit} className="!mt-4">
        <Form.Item
          name="room_number"
          label="Room Number"
          rules={[{ required: true, message: 'Please enter room number' }]}
          className="!mb-3"
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="room_class_id"
          label="Room Class"
          rules={[{ required: true, message: 'Please select room class' }]}
          className="!mb-3"
        >
          <Select loading={isLoadingRoomClasses}>
            {roomClasses.map((roomClass) => (
              <Select.Option key={roomClass.id} value={roomClass.id}>
                {roomClass.class_name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          name="status_id"
          label="Status"
          rules={[{ required: true, message: 'Please select status' }]}
          className="!mb-3"
        >
          <Select loading={isLoadingRoomStatuses}>
            {roomStatuses.map((status) => (
              <Select.Option key={status.id} value={status.id}>
                {status.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          name="floor_id"
          label="Floor"
          rules={[{ required: true, message: 'Please select floor' }]}
          className="!mb-3"
        >
          <Select loading={isLoadingFloors}>
            {floors.map((floor) => (
              <Select.Option key={floor.id} value={floor.id}>
                Floor {floor.number}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  )
}
