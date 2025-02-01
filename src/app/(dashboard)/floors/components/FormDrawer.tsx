'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Drawer, Form, Input } from 'antd'
import { useEffect } from 'react'
import { IoClose } from 'react-icons/io5'

import { queryKey } from '../lib/constants'
import { floorDetailStore } from '../lib/state'
import { createItem } from '../services/post'
import { updateItem } from '../services/put'

import { FLOOR_NAME_MAX_LENGTH } from '@/app/api/floors/types'
import { useAntdContextHolder } from '@/lib/context/AntdContextHolder'
import { inputNumberValidation } from '@/utils/inputNumberValidation'

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
  const { data: floorDetailState, resetData: resetFloorDetail } = floorDetailStore()

  const hideDrawer = () => {
    form.resetFields()
    resetFloorDetail()
    onCancel()
  }

  const { mutate: createMutation, isPending: isCreateLoading } = useMutation({
    mutationFn: createItem,
    onSuccess: (res) => {
      antdMessage?.success(res?.message ?? 'Floor created successfully')
      queryClient.invalidateQueries({ queryKey: [queryKey.RES_FLOOR_LIST] })
      hideDrawer()
    },
    onError: (res) => {
      antdMessage?.error(res?.message ?? 'Failed to create floor')
    },
  })

  const { mutate: updateMutation, isPending: isUpdateLoading } = useMutation({
    mutationFn: updateItem,
    onSuccess: (res) => {
      antdMessage?.success(res?.message ?? 'Floor updated successfully')
      queryClient.invalidateQueries({ queryKey: [queryKey.RES_FLOOR_LIST] })
      hideDrawer()
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
        name: floorDetailState.name ?? '',
        number: floorDetailState.number,
      })
    } else {
      form.resetFields()
    }
  }, [isVisible])

  return (
    <Drawer
      title={floorDetailState ? 'Edit Floor' : 'Add Floor'}
      open={isVisible}
      placement="right"
      width={520}
      maskClosable={false}
      closeIcon={<IoClose className="text-black text-2xl" />}
      extra={
        <Button type="primary" loading={isFormLoading} onClick={form.submit}>
          {floorDetailState ? 'Update' : 'Create'}
        </Button>
      }
      onClose={hideDrawer}
    >
      <Form form={form} layout="vertical" onFinish={onSubmit} className="!mt-4">
        <Form.Item<FormType>
          label="Floor Name"
          name="name"
          rules={[{ max: FLOOR_NAME_MAX_LENGTH, message: `Maximum length is ${FLOOR_NAME_MAX_LENGTH} characters` }]}
          className="!mb-3"
        >
          <Input
            size="large"
            showCount
            maxLength={FLOOR_NAME_MAX_LENGTH}
            placeholder="Enter floor name"
            className="!text-sm"
          />
        </Form.Item>

        <Form.Item<FormType>
          label="Floor Number"
          name="number"
          rules={[
            { required: true, message: 'Please input price' },
            {
              pattern: /^\d+$/,
              message: 'Invalid number!',
            },
          ]}
          getValueFromEvent={inputNumberValidation}
          className="!mb-3"
        >
          <Input size="large" placeholder="Enter floor number" className="!text-sm" />
        </Form.Item>
      </Form>
    </Drawer>
  )
}
