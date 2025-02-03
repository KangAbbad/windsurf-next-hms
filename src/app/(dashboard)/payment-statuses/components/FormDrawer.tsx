'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Drawer, Form, Input } from 'antd'
import { useEffect } from 'react'
import { IoClose } from 'react-icons/io5'

import { queryKey } from '../lib/constants'
import { paymentStatusDetailStore } from '../lib/state'
import { createItem } from '../services/post'
import { updateItem } from '../services/put'

import { useAntdContextHolder } from '@/lib/context/AntdContextHolder'

type FormType = {
  name: string
  number: number
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
  const { data: paymentStatusDetailState } = paymentStatusDetailStore()

  const hideDrawer = () => {
    form.resetFields()
    onCancel()
  }

  const { mutate: createMutation, isPending: isCreateLoading } = useMutation({
    mutationFn: createItem,
    onSuccess: (res) => {
      antdMessage?.success(res?.message ?? 'Payment status created successfully')
      queryClient.invalidateQueries({ queryKey: [queryKey.RES_PAYMENT_STATUS_LIST] })
      hideDrawer()
    },
    onError: (res) => {
      antdMessage?.error(res?.message ?? 'Failed to create payment status')
    },
  })

  const { mutate: updateMutation, isPending: isUpdateLoading } = useMutation({
    mutationFn: updateItem,
    onSuccess: (res) => {
      antdMessage?.success(res?.message ?? 'Payment status updated successfully')
      queryClient.invalidateQueries({ queryKey: [queryKey.RES_PAYMENT_STATUS_LIST] })
      hideDrawer()
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
        name: paymentStatusDetailState.name,
        number: paymentStatusDetailState.number,
      })
    } else {
      form.resetFields()
    }
  }, [isVisible])

  return (
    <Drawer
      title={paymentStatusDetailState ? 'Edit Payment Status' : 'Add Payment Status'}
      open={isVisible}
      placement="right"
      width={520}
      maskClosable={false}
      closeIcon={<IoClose className="text-black text-2xl" />}
      extra={
        <Button type="primary" loading={isFormLoading} onClick={form.submit}>
          {paymentStatusDetailState ? 'Update' : 'Create'}
        </Button>
      }
      onClose={hideDrawer}
    >
      <Form form={form} layout="vertical" onFinish={onSubmit} className="!mt-4">
        <Form.Item<FormType>
          name="number"
          label="Number"
          rules={[
            { required: true, message: 'Please enter number' },
            {
              pattern: /^\d+$/,
              message: 'Invalid number!',
            },
          ]}
          className="!mb-3"
        >
          <Input size="large" placeholder="Enter number" className="!text-sm" />
        </Form.Item>

        <Form.Item<FormType>
          name="name"
          label="Name"
          rules={[{ required: true, message: 'Please enter name' }]}
          className="!mb-3"
        >
          <Input size="large" placeholder="Enter name" className="!text-sm" />
        </Form.Item>
      </Form>
    </Drawer>
  )
}
