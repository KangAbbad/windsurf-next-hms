'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Modal, Form, Input } from 'antd'
import { useEffect } from 'react'

import { queryKey } from '../lib/constants'
import { bedTypeDetailStore } from '../lib/state'
import { createItem } from '../services/post'
import { updateItem } from '../services/put'

import { useAntdContextHolder } from '@/lib/context/AntdContextHolder'

type FormType = {
  bed_type_name: string
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
  const { data: bedTypeDetailState, resetData: resetBedTypeDetail } = bedTypeDetailStore()

  const hideModal = () => {
    form.resetFields()
    resetBedTypeDetail()
    onCancel()
  }

  const { mutate: createMutation, isPending: isCreateLoading } = useMutation({
    mutationFn: createItem,
    onSuccess: async () => {
      antdMessage?.success('Bed type created successfully')
      await queryClient.invalidateQueries({ queryKey: [queryKey.RES_BED_TYPE_LIST] })
      hideModal()
    },
    onError: () => {
      antdMessage?.error('Failed to create bed type')
    },
  })

  const { mutate: updateMutation, isPending: isUpdateLoading } = useMutation({
    mutationFn: updateItem,
    onSuccess: async () => {
      antdMessage?.success('Bed type updated successfully')
      await queryClient.invalidateQueries({ queryKey: [queryKey.RES_BED_TYPE_LIST] })
      hideModal()
    },
    onError: () => {
      antdMessage?.error('Failed to update bed type')
    },
  })

  const isFormLoading = isCreateLoading || isUpdateLoading

  const onSubmit = (values: FormType) => {
    if (isFormLoading) return
    if (bedTypeDetailState) {
      updateMutation({ id: bedTypeDetailState.id, ...values })
    } else {
      createMutation(values)
    }
  }

  useEffect(() => {
    if (!isVisible) return
    if (bedTypeDetailState) {
      form.setFieldsValue({
        bed_type_name: bedTypeDetailState.bed_type_name,
      })
    } else {
      form.resetFields()
    }
  }, [isVisible])

  return (
    <Modal
      title={bedTypeDetailState ? 'Edit Bed Type' : 'Add New Bed Type'}
      open={isVisible}
      onCancel={hideModal}
      onOk={form.submit}
      confirmLoading={isFormLoading}
    >
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <Form.Item
          label="Bed Type Name"
          name="bed_type_name"
          rules={[{ required: true, message: 'Please input bed type name' }]}
        >
          <Input className="w-full" placeholder="Enter bed type name" />
        </Form.Item>
      </Form>
    </Modal>
  )
}
