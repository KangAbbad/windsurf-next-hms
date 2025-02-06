'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Drawer, Form, Input, Select } from 'antd'
import { AxiosError } from 'axios'
import { useEffect } from 'react'
import { IoClose } from 'react-icons/io5'

import { queryKey } from '../lib/constants'
import { roomStatusDetailStore } from '../lib/state'
import { createItem } from '../services/post'
import { updateItem } from '../services/put'

import { tagColorOptions } from '@/lib/constants'
import { useAntdContextHolder } from '@/lib/context/AntdContextHolder'
import { ApiResponse } from '@/services/apiResponse'

type FormType = {
  name: string
  number: number
  color: string
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
  const { data: roomStatusDetailState } = roomStatusDetailStore()

  const hideDrawer = () => {
    form.resetFields()
    onCancel()
  }

  const { mutate: createMutation, isPending: isCreateLoading } = useMutation({
    mutationFn: createItem,
    onSuccess: (res) => {
      antdMessage?.success(res?.message ?? 'Room status created successfully')
      queryClient.invalidateQueries({ queryKey: [queryKey.RES_ROOM_STATUS_LIST] })
      hideDrawer()
    },
    onError: (res: AxiosError<ApiResponse>) => {
      const errors = res.response?.data?.errors ?? []
      const errorMessages = errors.length ? errors.join(', ') : 'Failed to create room status'
      antdMessage?.error(errorMessages)
    },
  })

  const { mutate: updateMutation, isPending: isUpdateLoading } = useMutation({
    mutationFn: updateItem,
    onSuccess: (res) => {
      antdMessage?.success(res?.message ?? 'Room status updated successfully')
      queryClient.invalidateQueries({ queryKey: [queryKey.RES_ROOM_STATUS_LIST] })
      hideDrawer()
    },
    onError: (res: AxiosError<ApiResponse>) => {
      const errors = res.response?.data?.errors ?? []
      const errorMessages = errors.length ? errors.join(', ') : 'Failed to update room status'
      antdMessage?.error(errorMessages)
    },
  })

  const isFormLoading = isCreateLoading || isUpdateLoading

  const onSubmit = (values: FormType) => {
    if (isFormLoading) return
    if (roomStatusDetailState) {
      updateMutation({ id: roomStatusDetailState.id, ...values })
    } else {
      createMutation(values)
    }
  }

  useEffect(() => {
    if (!isVisible) return
    if (roomStatusDetailState) {
      form.setFieldsValue({
        name: roomStatusDetailState.name,
        number: roomStatusDetailState.number,
        color: roomStatusDetailState.color,
      })
    } else {
      form.resetFields()
    }
  }, [isVisible])

  return (
    <Drawer
      title={roomStatusDetailState ? 'Edit Room Status' : 'Add Room Status'}
      open={isVisible}
      placement="right"
      width={520}
      maskClosable={false}
      closeIcon={<IoClose className="text-black text-2xl" />}
      extra={
        <Button type="primary" loading={isFormLoading} onClick={form.submit}>
          {roomStatusDetailState ? 'Update' : 'Create'}
        </Button>
      }
      onClose={hideDrawer}
    >
      <Form form={form} layout="vertical" onFinish={onSubmit}>
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

        <Form.Item<FormType>
          name="color"
          label="Color"
          rules={[{ required: true, message: 'Please select color' }]}
          className="!mb-3"
        >
          <Select allowClear placeholder="Select color" options={tagColorOptions} className="!h-9" />
        </Form.Item>
      </Form>
    </Drawer>
  )
}
