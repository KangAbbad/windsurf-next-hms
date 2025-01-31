'use client'

import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Modal, Form, Input, InputNumber, Select, Space, Button } from 'antd'
import { useEffect } from 'react'

import { queryKey as queryKeyBedTypeList } from '../../bed-types/lib/constants'
import { getAll as getBedTypes } from '../../bed-types/services/get'
import { queryKey as queryKeyFeatureList } from '../../features/lib/constants'
import { getAll as getFeatures } from '../../features/services/get'
import { queryKey } from '../lib/constants'
import { roomClassDetailStore } from '../lib/state'
import { createItem } from '../services/post'
import { updateItem } from '../services/put'

import type { CreateRoomClassBody } from '@/app/api/room-classes/types'
import { useAntdContextHolder } from '@/lib/context/AntdContextHolder'

type Props = {
  isVisible: boolean
  onCancel: () => void
}

export default function FormModal(props: Props) {
  const { isVisible, onCancel } = props
  const queryClient = useQueryClient()
  const { antdMessage } = useAntdContextHolder()
  const [form] = Form.useForm<CreateRoomClassBody>()
  const { data: roomClassDetailState } = roomClassDetailStore()

  const { data: bedTypesResponse, isFetching: isLoadingBedTypes } = useQuery({
    queryKey: [queryKeyBedTypeList.RES_BED_TYPE_LIST],
    queryFn: () => getBedTypes({ page: 1, limit: 100 }),
  })
  const bedTypes = bedTypesResponse?.data?.items ?? []

  const { data: featuresResponse, isFetching: isLoadingFeatures } = useQuery({
    queryKey: [queryKeyFeatureList.RES_FEATURE_LIST],
    queryFn: () => getFeatures({ page: 1, limit: 100 }),
  })
  const features = featuresResponse?.data?.items ?? []

  const hideModal = () => {
    form.resetFields()
    onCancel()
  }

  const { mutate: createMutation, isPending: isCreateLoading } = useMutation({
    mutationFn: createItem,
    onSuccess: (res) => {
      antdMessage?.success(res?.message ?? 'Room class created successfully')
      hideModal()
      queryClient.invalidateQueries({ queryKey: [queryKey.RES_ROOM_CLASS_LIST] })
    },
    onError: (res) => {
      antdMessage?.error(res?.message ?? 'Failed to create room class')
    },
  })

  const { mutate: updateMutation, isPending: isUpdateLoading } = useMutation({
    mutationFn: updateItem,
    onSuccess: (res) => {
      antdMessage?.success(res?.message ?? 'Room class updated successfully')
      hideModal()
      queryClient.invalidateQueries({ queryKey: [queryKey.RES_ROOM_CLASS_LIST] })
    },
    onError: (res) => {
      antdMessage?.error(res?.message ?? 'Failed to update room class')
    },
  })

  const isFormLoading = isCreateLoading || isUpdateLoading

  const onSubmit = (values: CreateRoomClassBody) => {
    if (isFormLoading) return
    if (roomClassDetailState) {
      updateMutation({ id: roomClassDetailState.id, ...values })
    } else {
      createMutation(values)
    }
  }

  useEffect(() => {
    if (!isVisible) return
    if (roomClassDetailState) {
      form.setFieldsValue({
        class_name: roomClassDetailState.class_name,
        base_price: roomClassDetailState.base_price,
        bed_types: roomClassDetailState.bed_types.map((bt) => ({
          bed_type_id: bt.bed_type.id,
          num_beds: bt.num_beds,
        })),
        feature_ids: roomClassDetailState.features.map((f) => f.id),
      })
    } else {
      form.resetFields()
    }
  }, [isVisible])

  return (
    <Modal
      open={isVisible}
      title={roomClassDetailState ? 'Edit Room Class' : 'Create New Room Class'}
      confirmLoading={isFormLoading}
      maskClosable={false}
      width={720}
      okText={roomClassDetailState ? 'Update' : 'Create'}
      onCancel={onCancel}
      onOk={form.submit}
    >
      <Form form={form} layout="vertical" onFinish={onSubmit} className="!mt-4">
        <Form.Item
          name="class_name"
          label="Name"
          rules={[{ required: true, message: 'Please enter room class name' }]}
          className="!mb-3"
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="base_price"
          label="Base Price"
          rules={[{ required: true, message: 'Please enter room class base price' }]}
          className="!mb-3"
        >
          <InputNumber
            className="!w-full"
            formatter={(value) => `Rp ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(value: string | undefined): 0 | number => {
              if (!value) return 0
              return Number(value.replace(/[^\d]/g, ''))
            }}
            min={0}
          />
        </Form.Item>

        <Form.List
          name="bed_types"
          rules={[
            {
              validator: async (_, value) => {
                if (!value || value.length === 0) {
                  return await Promise.reject(new Error('At least one bed type is required'))
                }
              },
            },
          ]}
        >
          {(fields, { add, remove }, { errors }) => (
            <>
              {fields.map(({ key, name, ...restField }, index) => (
                <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                  <Form.Item
                    {...restField}
                    name={[name, 'bed_type_id']}
                    rules={[{ required: true, message: 'Missing bed type' }]}
                  >
                    <Select
                      loading={isLoadingBedTypes}
                      placeholder="Select bed type"
                      options={bedTypes.map((bt) => ({
                        label: bt.name,
                        value: bt.id,
                      }))}
                      style={{ width: 200 }}
                    />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    name={[name, 'num_beds']}
                    rules={[{ required: true, message: 'Missing number of beds' }]}
                  >
                    <InputNumber min={1} placeholder="Number of beds" />
                  </Form.Item>
                  {fields.length > 1 && (
                    <MinusCircleOutlined
                      onClick={() => {
                        remove(name)
                      }}
                    />
                  )}
                </Space>
              ))}
              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() => {
                    add()
                  }}
                  block
                  icon={<PlusOutlined />}
                >
                  Add Bed Type
                </Button>
                <Form.ErrorList errors={errors} />
              </Form.Item>
            </>
          )}
        </Form.List>

        <Form.Item
          name="feature_ids"
          label="Features"
          rules={[{ required: true, message: 'Please select at least one feature' }]}
        >
          <Select
            mode="multiple"
            loading={isLoadingFeatures}
            placeholder="Select features"
            options={features.map((f) => ({
              label: f.feature_name,
              value: f.id,
            }))}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
