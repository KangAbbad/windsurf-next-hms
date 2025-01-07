'use client'

import { Modal, Form, Input, InputNumber } from 'antd'
import { useEffect } from 'react'

import type { Addon } from '../services/addons'

interface AddonsFormProps {
  open: boolean
  onCancel: () => void
  initialValues?: Addon | null
  onSubmit: (values: Omit<Addon, 'id' | 'created_at' | 'updated_at'>) => void
  loading?: boolean
}

export default function AddonsForm(props: AddonsFormProps) {
  const { open, onCancel, onSubmit, initialValues, loading } = props
  const [form] = Form.useForm()

  useEffect(() => {
    if (!open) return
    if (initialValues) {
      form.setFieldsValue({
        ...initialValues,
        addon_name: initialValues.addon_name,
      })
    } else {
      form.resetFields()
    }
  }, [initialValues, form])

  return (
    <Modal
      open={open}
      title={initialValues ? 'Edit Addon' : 'Create New Addon'}
      onCancel={onCancel}
      onOk={() => {
        form.submit()
      }}
      okText={initialValues ? 'Update' : 'Create'}
      confirmLoading={loading}
      maskClosable={false}
      width={520}
    >
      <Form form={form} layout="vertical" onFinish={onSubmit} className="mt-4">
        <Form.Item name="addon_name" label="Name" rules={[{ required: true, message: 'Please enter addon name' }]}>
          <Input />
        </Form.Item>

        <Form.Item name="price" label="Price" rules={[{ required: true, message: 'Please enter addon price' }]}>
          <InputNumber
            style={{ width: '100%' }}
            formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(value: string | undefined): 0 | number => {
              if (!value) return 0
              return Number(value.replace(/\$\s?|(,*)/g, ''))
            }}
            min={0}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
