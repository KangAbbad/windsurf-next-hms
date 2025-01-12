'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Modal, Form, Input } from 'antd'
import { useEffect } from 'react'

import { queryKey } from '../lib/constants'
import { featureDetailStore } from '../lib/state'
import { createItem } from '../services/post'
import { updateItem } from '../services/put'

import { useAntdContextHolder } from '@/lib/context/AntdContextHolder'
import { FEATURE_NAME_MAX_LENGTH } from '@/types/feature'

type FormType = {
  feature_name: string
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
  const { data: featureDetailState, resetData: resetFeatureDetail } = featureDetailStore()

  const hideModal = () => {
    form.resetFields()
    resetFeatureDetail()
    onCancel()
  }

  const { mutate: createMutation, isPending: isCreateLoading } = useMutation({
    mutationFn: createItem,
    onSuccess: (res) => {
      antdMessage?.success(res?.message ?? 'Feature created successfully')
      hideModal()
      queryClient.invalidateQueries({ queryKey: [queryKey.RES_FEATURE_LIST] })
    },
    onError: (res) => {
      antdMessage?.error(res?.message ?? 'Failed to create feature')
    },
  })

  const { mutate: updateMutation, isPending: isUpdateLoading } = useMutation({
    mutationFn: updateItem,
    onSuccess: (res) => {
      antdMessage?.success(res?.message ?? 'Feature updated successfully')
      hideModal()
      queryClient.invalidateQueries({ queryKey: [queryKey.RES_FEATURE_LIST] })
    },
    onError: (res) => {
      antdMessage?.error(res?.message ?? 'Failed to update feature')
    },
  })

  const isFormLoading = isCreateLoading || isUpdateLoading

  const onSubmit = (values: FormType) => {
    if (isFormLoading) return
    if (featureDetailState) {
      updateMutation({ ...values, id: featureDetailState.id })
    } else {
      createMutation(values)
    }
  }

  useEffect(() => {
    if (!isVisible) return
    if (featureDetailState) {
      form.setFieldsValue({
        feature_name: featureDetailState.feature_name,
      })
    } else {
      form.resetFields()
    }
  }, [isVisible])

  return (
    <Modal
      title={featureDetailState ? 'Edit Feature' : 'Add New Feature'}
      open={isVisible}
      onCancel={hideModal}
      onOk={form.submit}
      confirmLoading={isFormLoading}
    >
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <Form.Item
          label="Feature Name"
          name="feature_name"
          rules={[
            { required: true, message: 'Please input feature name' },
            { max: FEATURE_NAME_MAX_LENGTH, message: `Maximum length is ${FEATURE_NAME_MAX_LENGTH} characters` },
          ]}
        >
          <Input className="w-full" placeholder="Enter feature name" maxLength={FEATURE_NAME_MAX_LENGTH} showCount />
        </Form.Item>
      </Form>
    </Modal>
  )
}
