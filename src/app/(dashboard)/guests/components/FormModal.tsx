'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Form, Input, Modal } from 'antd'
import { useEffect } from 'react'

import { queryKey } from '../lib/constants'
import { guestDetailStore } from '../lib/state'
import { createItem } from '../services/post'
import { updateItem } from '../services/put'

import { useAntdContextHolder } from '@/lib/context/AntdContextHolder'

type FormType = {
  first_name: string
  last_name: string
  email_address: string
  phone_number: string
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
  const { data: guestDetailState } = guestDetailStore()

  const hideModal = () => {
    form.resetFields()
    onCancel()
  }

  const { mutate: createMutation, isPending: isCreateLoading } = useMutation({
    mutationFn: createItem,
    onSuccess: (res) => {
      antdMessage?.success(res?.message ?? 'Guest created successfully')
      hideModal()
      queryClient.invalidateQueries({ queryKey: [queryKey.RES_GUEST_LIST] })
    },
    onError: (res) => {
      antdMessage?.error(res?.message ?? 'Failed to create guest')
    },
  })

  const { mutate: updateMutation, isPending: isUpdateLoading } = useMutation({
    mutationFn: updateItem,
    onSuccess: (res) => {
      antdMessage?.success(res?.message ?? 'Guest updated successfully')
      hideModal()
      queryClient.invalidateQueries({ queryKey: [queryKey.RES_GUEST_LIST] })
    },
    onError: (res) => {
      antdMessage?.error(res?.message ?? 'Failed to update guest')
    },
  })

  const isFormLoading = isCreateLoading || isUpdateLoading

  const onSubmit = (values: FormType) => {
    if (isFormLoading) return
    if (guestDetailState) {
      updateMutation({ id: guestDetailState.id, ...values })
    } else {
      createMutation(values)
    }
  }

  useEffect(() => {
    if (!isVisible) return
    if (guestDetailState) {
      form.setFieldsValue({
        first_name: guestDetailState.first_name,
        last_name: guestDetailState.last_name,
        email_address: guestDetailState.email_address,
        phone_number: guestDetailState.phone_number,
      })
    } else {
      form.resetFields()
    }
  }, [isVisible])

  return (
    <Modal
      open={isVisible}
      title={guestDetailState ? 'Edit Guest' : 'Create New Guest'}
      confirmLoading={isFormLoading}
      maskClosable={false}
      width={520}
      okText={guestDetailState ? 'Update' : 'Create'}
      onCancel={onCancel}
      onOk={form.submit}
    >
      <Form form={form} layout="vertical" onFinish={onSubmit} className="!mt-4">
        <Form.Item
          name="first_name"
          label="First Name"
          rules={[{ required: true, message: 'Please enter guest first name' }]}
          className="!mb-3"
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="last_name"
          label="Last Name"
          rules={[{ required: true, message: 'Please enter guest last name' }]}
          className="!mb-3"
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="email_address"
          label="Email"
          rules={[
            { required: true, message: 'Please enter guest email' },
            { type: 'email', message: 'Please enter valid email' },
          ]}
          className="!mb-3"
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="phone_number"
          label="Phone"
          rules={[{ required: true, message: 'Please enter guest phone' }]}
          className="!mb-3"
        >
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  )
}
