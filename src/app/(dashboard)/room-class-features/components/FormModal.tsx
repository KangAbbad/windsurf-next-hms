'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Form, Modal, Select } from 'antd'
import { useEffect } from 'react'

import { queryKey as queryKeyFeatureList } from '../../features/lib/constants'
import { getAll as getAllFeatures } from '../../features/services/get'
import { queryKey as queryKeyRoomClassList } from '../../room-classes/lib/constants'
import { getAll as getAllRoomClasses } from '../../room-classes/services/get'
import { queryKey } from '../lib/constants'
import { roomClassFeatureDetailStore } from '../lib/state'
import { createItem } from '../services/post'
import { updateItem } from '../services/put'

import { useAntdContextHolder } from '@/lib/context/AntdContextHolder'
import { UpdateRoomClassFeatureBody } from '@/types/room-class-feature'

type Props = {
  isVisible: boolean
  onCancel: () => void
}

type FormType = UpdateRoomClassFeatureBody

export default function FormModal(props: Props) {
  const { isVisible, onCancel } = props
  const queryClient = useQueryClient()
  const { antdMessage } = useAntdContextHolder()
  const [form] = Form.useForm<FormType>()
  const { data: roomClassFeatureDetail } = roomClassFeatureDetailStore()

  const { data: roomClassesResponse } = useQuery({
    queryKey: [queryKeyRoomClassList.RES_ROOM_CLASS_LIST],
    queryFn: () => getAllRoomClasses({ limit: 100 }),
  })
  const { data: roomClassesData } = roomClassesResponse ?? {}
  const { items: roomClasses = [] } = roomClassesData ?? {}

  const { data: featuresResponse } = useQuery({
    queryKey: [queryKeyFeatureList.RES_FEATURE_LIST],
    queryFn: () => getAllFeatures({ limit: 100 }),
  })
  const { data: featuresData } = featuresResponse ?? {}
  const { items: features = [] } = featuresData ?? {}

  const hideModal = () => {
    form.resetFields()
    onCancel()
  }

  const { mutate: createMutation, isPending: isCreateLoading } = useMutation({
    mutationFn: createItem,
    onSuccess: () => {
      antdMessage?.success('Room class feature created successfully')
      queryClient.invalidateQueries({ queryKey: [queryKey.RES_ROOM_CLASS_FEATURE_LIST] })
      hideModal()
    },
    onError: () => {
      antdMessage?.error('Failed to create room class feature')
    },
  })

  const { mutate: updateMutation, isPending: isUpdateLoading } = useMutation({
    mutationFn: updateItem,
    onSuccess: async () => {
      antdMessage?.success('Room class feature updated successfully')
      await queryClient.invalidateQueries({ queryKey: [queryKey.RES_ROOM_CLASS_FEATURE_LIST] })
      hideModal()
    },
    onError: () => {
      antdMessage?.error('Failed to update room class feature')
    },
  })

  const isFormLoading = isCreateLoading || isUpdateLoading

  const onSubmit = (values: FormType) => {
    if (isFormLoading) return
    if (roomClassFeatureDetail) {
      updateMutation({
        room_class_id: roomClassFeatureDetail.room_class_id,
        feature_id: roomClassFeatureDetail.feature_id,
        new_room_class_id: values.new_room_class_id ?? '',
        new_feature_id: values.new_feature_id ?? '',
      })
    } else {
      createMutation({
        room_class_id: values.new_room_class_id ?? '',
        feature_id: values.new_feature_id ?? '',
      })
    }
  }

  useEffect(() => {
    if (!isVisible) return
    if (roomClassFeatureDetail) {
      form.setFieldsValue({
        new_room_class_id: roomClassFeatureDetail.room_class_id,
        new_feature_id: roomClassFeatureDetail.feature_id,
      })
    } else {
      form.resetFields()
    }
  }, [isVisible])

  return (
    <Modal
      open={isVisible}
      title={roomClassFeatureDetail ? 'Edit Room Class Feature' : 'Create New Room Class Feature'}
      confirmLoading={isFormLoading}
      maskClosable={false}
      width={520}
      okText={roomClassFeatureDetail ? 'Update' : 'Create'}
      onCancel={onCancel}
      onOk={form.submit}
    >
      <Form form={form} layout="vertical" onFinish={onSubmit} className="!mt-4">
        <Form.Item
          name="new_room_class_id"
          label="Room Class"
          rules={[{ required: true, message: 'Please select room class' }]}
          className="!mb-3"
        >
          <Select
            placeholder="Select room class"
            options={roomClasses.map((roomClass) => ({
              label: roomClass.class_name,
              value: roomClass.id,
            }))}
          />
        </Form.Item>

        <Form.Item
          name="new_feature_id"
          label="Feature"
          rules={[{ required: true, message: 'Please select feature' }]}
          className="!mb-3"
        >
          <Select
            placeholder="Select feature"
            options={features.map((feature) => ({
              label: feature.feature_name,
              value: feature.id,
            }))}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
