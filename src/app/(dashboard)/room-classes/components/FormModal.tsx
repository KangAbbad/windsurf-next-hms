'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Modal, Form, Input, InputNumber } from 'antd'
import { useEffect } from 'react'

import { queryKey } from '../lib/constants'
import { roomClassDetailStore } from '../lib/state'
import { createItem } from '../services/post'
import { updateItem } from '../services/put'

import { useAntdContextHolder } from '@/lib/context/AntdContextHolder'
import type { CreateRoomClassBody } from '@/types/room-class'

type Props = {
  isVisible: boolean
  onCancel: () => void
}

export default function FormModal(props: Props) {
  const { isVisible, onCancel } = props
  const queryClient = useQueryClient()
  const { antdMessage } = useAntdContextHolder()
  const [form] = Form.useForm<CreateRoomClassBody>()
  const { data: roomClassDetailState } = roomClassDetailStore()

  const hideModal = () => {
    form.resetFields()
    onCancel()
  }

  const { mutate: createMutation, isPending: isCreateLoading } = useMutation({
    mutationFn: createItem,
    onSuccess: (res) => {
      antdMessage?.success(res?.message ?? 'Room class created successfully')
      hideModal()
      queryClient.invalidateQueries({ queryKey: [queryKey.RES_ROOM_CLASS_LIST] })
    },
    onError: (res) => {
      antdMessage?.error(res?.message ?? 'Failed to create room class')
    },
  })

  const { mutate: updateMutation, isPending: isUpdateLoading } = useMutation({
    mutationFn: updateItem,
    onSuccess: (res) => {
      antdMessage?.success(res?.message ?? 'Room class updated successfully')
      hideModal()
      queryClient.invalidateQueries({ queryKey: [queryKey.RES_ROOM_CLASS_LIST] })
    },
    onError: (res) => {
      antdMessage?.error(res?.message ?? 'Failed to update room class')
    },
  })

  const isFormLoading = isCreateLoading || isUpdateLoading

  const onSubmit = (values: CreateRoomClassBody) => {
    if (isFormLoading) return
    if (roomClassDetailState) {
      updateMutation({ id: roomClassDetailState.id, ...values })
    } else {
      createMutation(values)
    }
  }

  useEffect(() => {
    if (!isVisible) return
    if (roomClassDetailState) {
      form.setFieldsValue({
        class_name: roomClassDetailState.class_name,
        base_price: roomClassDetailState.base_price,
      })
    } else {
      form.resetFields()
    }
  }, [isVisible])

  return (
    <Modal
      open={isVisible}
      title={roomClassDetailState ? 'Edit Room Class' : 'Create New Room Class'}
      confirmLoading={isFormLoading}
      maskClosable={false}
      width={720}
      okText={roomClassDetailState ? 'Update' : 'Create'}
      onCancel={onCancel}
      onOk={form.submit}
    >
      <Form form={form} layout="vertical" onFinish={onSubmit} className="!mt-4">
        <Form.Item
          name="class_name"
          label="Name"
          rules={[{ required: true, message: 'Please enter room class name' }]}
          className="!mb-3"
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="base_price"
          label="Base Price"
          rules={[{ required: true, message: 'Please enter room class base price' }]}
          className="!mb-3"
        >
          <InputNumber
            className="!w-full"
            formatter={(value) => `Rp ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(value: string | undefined): 0 | number => {
              if (!value) return 0
              return Number(value.replace(/[^\d]/g, ''))
            }}
            min={0}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
