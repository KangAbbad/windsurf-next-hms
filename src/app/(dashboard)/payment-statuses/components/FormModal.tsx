'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Modal, Form, Input, InputNumber } from 'antd'
import { useEffect } from 'react'

import { queryKey } from '../lib/constants'
import { paymentStatusDetailStore } from '../lib/state'
import { createItem } from '../services/post'
import { updateItem } from '../services/put'

import { useAntdContextHolder } from '@/lib/context/AntdContextHolder'

type FormType = {
  payment_status_name: string
  payment_status_number: number
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
  const { data: paymentStatusDetailState } = paymentStatusDetailStore()

  const hideModal = () => {
    form.resetFields()
    onCancel()
  }

  const { mutate: createMutation, isPending: isCreateLoading } = useMutation({
    mutationFn: createItem,
    onSuccess: (res) => {
      antdMessage?.success(res?.message ?? 'Payment status created successfully')
      hideModal()
      queryClient.invalidateQueries({ queryKey: [queryKey.RES_PAYMENT_STATUS_LIST] })
    },
    onError: (res) => {
      antdMessage?.error(res?.message ?? 'Failed to create payment status')
    },
  })

  const { mutate: updateMutation, isPending: isUpdateLoading } = useMutation({
    mutationFn: updateItem,
    onSuccess: (res) => {
      antdMessage?.success(res?.message ?? 'Payment status updated successfully')
      hideModal()
      queryClient.invalidateQueries({ queryKey: [queryKey.RES_PAYMENT_STATUS_LIST] })
    },
    onError: (res) => {
      antdMessage?.error(res?.message ?? 'Failed to update payment status')
    },
  })

  const isFormLoading = isCreateLoading || isUpdateLoading

  const onSubmit = (values: FormType) => {
    if (isFormLoading) return
    if (paymentStatusDetailState) {
      updateMutation({ id: paymentStatusDetailState.id, ...values })
    } else {
      createMutation(values)
    }
  }

  useEffect(() => {
    if (!isVisible) return
    if (paymentStatusDetailState) {
      form.setFieldsValue({
        payment_status_name: paymentStatusDetailState.payment_status_name,
        payment_status_number: paymentStatusDetailState.payment_status_number,
      })
    } else {
      form.resetFields()
    }
  }, [isVisible])

  return (
    <Modal
      open={isVisible}
      title={paymentStatusDetailState ? 'Edit Payment Status' : 'Create New Payment Status'}
      confirmLoading={isFormLoading}
      maskClosable={false}
      width={520}
      okText={paymentStatusDetailState ? 'Update' : 'Create'}
      onCancel={onCancel}
      onOk={form.submit}
    >
      <Form form={form} layout="vertical" onFinish={onSubmit} className="!mt-4">
        <Form.Item
          name="payment_status_number"
          label="Number"
          rules={[{ required: true, message: 'Please enter payment status number' }]}
          className="!mb-3"
        >
          <InputNumber min={1} className="w-full" placeholder="Enter payment status number" />
        </Form.Item>

        <Form.Item
          name="payment_status_name"
          label="Name"
          rules={[{ required: true, message: 'Please enter payment status name' }]}
          className="!mb-3"
        >
          <Input placeholder="Enter payment status name" />
        </Form.Item>
      </Form>
    </Modal>
  )
}
