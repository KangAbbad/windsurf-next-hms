'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Modal, Form, InputNumber } from 'antd'
import { useEffect } from 'react'

import { queryKey } from '../lib/constants'
import { floorDetailStore } from '../lib/state'
import { createItem } from '../services/post'
import { updateItem } from '../services/put'

import { useAntdContextHolder } from '@/lib/context/AntdContextHolder'

type FormType = {
  floor_number: number
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
  const { data: floorDetailState, resetData: resetFloorDetail } = floorDetailStore()

  const hideModal = () => {
    form.resetFields()
    resetFloorDetail()
    onCancel()
  }

  const { mutate: createMutation, isPending: isCreateLoading } = useMutation({
    mutationFn: createItem,
    onSuccess: (res) => {
      antdMessage?.success(res?.message ?? 'Floor created successfully')
      hideModal()
      queryClient.invalidateQueries({ queryKey: [queryKey.RES_FLOOR_LIST] })
    },
    onError: (res) => {
      antdMessage?.error(res?.message ?? 'Failed to create floor')
    },
  })

  const { mutate: updateMutation, isPending: isUpdateLoading } = useMutation({
    mutationFn: updateItem,
    onSuccess: (res) => {
      antdMessage?.success(res?.message ?? 'Floor updated successfully')
      hideModal()
      queryClient.invalidateQueries({ queryKey: [queryKey.RES_FLOOR_LIST] })
    },
    onError: (res) => {
      antdMessage?.error(res?.message ?? 'Failed to update floor')
    },
  })

  const isFormLoading = isCreateLoading || isUpdateLoading

  const onSubmit = (values: FormType) => {
    if (isFormLoading) return
    if (floorDetailState) {
      updateMutation({ id: floorDetailState.id, ...values })
    } else {
      createMutation(values)
    }
  }

  useEffect(() => {
    if (!isVisible) return
    if (floorDetailState) {
      form.setFieldsValue({
        floor_number: floorDetailState.floor_number,
      })
    } else {
      form.resetFields()
    }
  }, [isVisible])

  return (
    <Modal
      title={floorDetailState ? 'Edit Floor' : 'Add New Floor'}
      open={isVisible}
      onCancel={hideModal}
      onOk={form.submit}
      confirmLoading={isFormLoading}
    >
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <Form.Item
          label="Floor Number"
          name="floor_number"
          rules={[{ required: true, message: 'Please input floor number' }]}
        >
          <InputNumber className="!w-full" placeholder="Enter floor number" />
        </Form.Item>
      </Form>
    </Modal>
  )
}
