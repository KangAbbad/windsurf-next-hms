'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Modal, Form, InputNumber, Select } from 'antd'
import { useEffect } from 'react'

import { queryKey } from '../lib/constants'
import { roomClassBedTypeDetailStore } from '../lib/state'
import { getAllBedTypes } from '../services/getBedTypes'
import { getAllRoomClasses } from '../services/getRoomClasses'
import { createItem } from '../services/post'
import { updateItem } from '../services/put'

import { useAntdContextHolder } from '@/lib/context/AntdContextHolder'

type FormType = {
  room_class_id: string
  bed_type_id: string
  quantity: number
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
  const { data: roomClassBedTypeDetailState, resetData: resetRoomClassBedTypeDetail } = roomClassBedTypeDetailStore()

  const { data: roomClassesResponse } = useQuery({
    queryKey: [queryKey.RES_ROOM_CLASS_LIST],
    queryFn: getAllRoomClasses,
  })
  const { data: roomClassesData } = roomClassesResponse ?? {}
  const { items: roomClasses = [] } = roomClassesData ?? {}

  const { data: bedTypesResponse } = useQuery({
    queryKey: [queryKey.RES_BED_TYPE_LIST],
    queryFn: getAllBedTypes,
  })
  const { data: bedTypesData } = bedTypesResponse ?? {}
  const { items: bedTypes = [] } = bedTypesData ?? {}

  const hideModal = () => {
    form.resetFields()
    resetRoomClassBedTypeDetail()
    onCancel()
  }

  const { mutate: createMutation, isPending: isCreateLoading } = useMutation({
    mutationFn: createItem,
    onSuccess: async () => {
      antdMessage?.success('Room class bed type created successfully')
      await queryClient.invalidateQueries({ queryKey: [queryKey.RES_ROOM_CLASS_BED_TYPE_LIST] })
      hideModal()
    },
    onError: () => {
      antdMessage?.error('Failed to create room class bed type')
    },
  })

  const { mutate: updateMutation, isPending: isUpdateLoading } = useMutation({
    mutationFn: updateItem,
    onSuccess: async () => {
      antdMessage?.success('Room class bed type updated successfully')
      await queryClient.invalidateQueries({ queryKey: [queryKey.RES_ROOM_CLASS_BED_TYPE_LIST] })
      hideModal()
    },
    onError: () => {
      antdMessage?.error('Failed to update room class bed type')
    },
  })

  const isFormLoading = isCreateLoading || isUpdateLoading

  const onSubmit = (values: FormType) => {
    if (isFormLoading) return
    if (roomClassBedTypeDetailState) {
      updateMutation({ ...values, id: roomClassBedTypeDetailState.id })
    } else {
      createMutation(values)
    }
  }

  useEffect(() => {
    if (!isVisible) return
    if (roomClassBedTypeDetailState) {
      form.setFieldsValue({
        room_class_id: roomClassBedTypeDetailState.room_class_id,
        bed_type_id: roomClassBedTypeDetailState.bed_type_id,
        quantity: roomClassBedTypeDetailState.quantity,
      })
    } else {
      form.resetFields()
    }
  }, [isVisible])

  return (
    <Modal
      title={roomClassBedTypeDetailState ? 'Edit Room Class Bed Type' : 'Add New Room Class Bed Type'}
      open={isVisible}
      onCancel={hideModal}
      onOk={form.submit}
      confirmLoading={isFormLoading}
    >
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <Form.Item
          label="Room Class"
          name="room_class_id"
          rules={[{ required: true, message: 'Please select room class' }]}
        >
          <Select
            placeholder="Select room class"
            options={roomClasses.map((roomClass) => ({
              label: roomClass.room_class_name,
              value: roomClass.id,
            }))}
          />
        </Form.Item>
        <Form.Item label="Bed Type" name="bed_type_id" rules={[{ required: true, message: 'Please select bed type' }]}>
          <Select
            placeholder="Select bed type"
            options={bedTypes.map((bedType) => ({
              label: bedType.bed_type_name,
              value: bedType.id,
            }))}
          />
        </Form.Item>
        <Form.Item
          label="Quantity"
          name="quantity"
          rules={[
            { required: true, message: 'Please input quantity' },
            { type: 'number', min: 1, message: 'Quantity must be greater than 0' },
          ]}
        >
          <InputNumber className="w-full" placeholder="Enter quantity" min={1} />
        </Form.Item>
      </Form>
    </Modal>
  )
}
