'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Drawer, Form, Input } from 'antd'
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

export default function FormDrawer(props: Props) {
  const { isVisible, onCancel } = props
  const queryClient = useQueryClient()
  const { antdMessage } = useAntdContextHolder()
  const [form] = Form.useForm<FormType>()
  const { data: guestDetailState } = guestDetailStore()

  const hideDrawer = () => {
    form.resetFields()
    onCancel()
  }

  const { mutate: createMutation, isPending: isCreateLoading } = useMutation({
    mutationFn: createItem,
    onSuccess: (res) => {
      antdMessage?.success(res?.message ?? 'Guest created successfully')
      hideDrawer()
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
      hideDrawer()
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
    <Drawer
      open={isVisible}
      title={guestDetailState ? 'Edit Guest' : 'Create New Guest'}
      placement="right"
      width={520}
      onClose={onCancel}
      maskClosable={false}
      footer={
        <div className="flex justify-end gap-2">
          <button className="px-4 py-2 border rounded-md hover:bg-gray-50" onClick={onCancel} type="button">
            Cancel
          </button>
          <button
            className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:bg-blue-300"
            onClick={form.submit}
            disabled={isFormLoading}
            type="submit"
          >
            {guestDetailState ? 'Update' : 'Create'}
          </button>
        </div>
      }
    >
      <Form form={form} layout="vertical" onFinish={onSubmit}>
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
    </Drawer>
  )
}
