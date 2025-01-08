'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Modal, Form, Input, InputNumber } from 'antd'
import { useEffect } from 'react'

import { queryKey } from '../lib/constants'
import { addonDetailStore } from '../lib/state'
import { createItem } from '../services/post'
import { updateItem } from '../services/put'

import { useAntdContextHolder } from '@/lib/context/AntdContextHolder'

type FormType = {
  addon_name: string
  price: number
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
  const { data: addonDetailState } = addonDetailStore()

  const hideModal = () => {
    form.resetFields()
    onCancel()
  }

  const { mutate: createMutation, isPending: isCreateLoading } = useMutation({
    mutationFn: createItem,
    onSuccess: async () => {
      antdMessage?.success('Addon created successfully')
      await queryClient.invalidateQueries({ queryKey: [queryKey.RES_ADDON_LIST] })
      hideModal()
    },
    onError: () => {
      antdMessage?.error('Failed to create addon')
    },
  })

  const { mutate: updateMutation, isPending: isUpdateLoading } = useMutation({
    mutationFn: updateItem,
    onSuccess: async () => {
      antdMessage?.success('Addon updated successfully')
      await queryClient.invalidateQueries({ queryKey: [queryKey.RES_ADDON_LIST] })
      hideModal()
    },
    onError: () => {
      antdMessage?.error('Failed to update addon')
    },
  })

  const isFormLoading = isCreateLoading || isUpdateLoading

  const onSubmit = (values: FormType) => {
    if (isFormLoading) return
    if (addonDetailState) {
      updateMutation({ id: addonDetailState.id, ...values })
    } else {
      createMutation(values)
    }
  }

  useEffect(() => {
    if (!isVisible) return
    if (addonDetailState) {
      form.setFieldsValue({
        addon_name: addonDetailState.addon_name,
        price: addonDetailState.price,
      })
    } else {
      form.resetFields()
    }
  }, [isVisible])

  return (
    <Modal
      open={isVisible}
      title={addonDetailState ? 'Edit Addon' : 'Create New Addon'}
      confirmLoading={isFormLoading}
      maskClosable={false}
      width={520}
      okText={addonDetailState ? 'Update' : 'Create'}
      onCancel={onCancel}
      onOk={form.submit}
    >
      <Form form={form} layout="vertical" onFinish={onSubmit} className="!mt-4">
        <Form.Item
          name="addon_name"
          label="Name"
          rules={[{ required: true, message: 'Please enter addon name' }]}
          className="!mb-3"
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="price"
          label="Price"
          rules={[{ required: true, message: 'Please enter addon price' }]}
          className="!mb-3"
        >
          <InputNumber
            min={0}
            formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(value: string | undefined): 0 | number => {
              if (!value) return 0
              return Number(value.replace(/\$\s?|(,*)/g, ''))
            }}
            style={{ width: '100%' }}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
