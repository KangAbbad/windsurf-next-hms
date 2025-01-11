'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Modal, Form, Input, InputNumber } from 'antd'
import { useEffect } from 'react'

import { queryKey } from '../lib/constants'
import { roomStatusDetailStore } from '../lib/state'
import { createItem } from '../services/post'
import { updateItem } from '../services/put'

import { useAntdContextHolder } from '@/lib/context/AntdContextHolder'

type FormType = {
  status_name: string
  status_number: number
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
  const { data: roomStatusDetailState, resetData: resetRoomStatusDetail } = roomStatusDetailStore()

  const hideModal = () => {
    form.resetFields()
    resetRoomStatusDetail()
    onCancel()
  }

  const { mutate: createMutation, isPending: isCreateLoading } = useMutation({
    mutationFn: createItem,
    onSuccess: async () => {
      antdMessage?.success('Room status created successfully')
      await queryClient.invalidateQueries({ queryKey: [queryKey.RES_ROOM_STATUS_LIST] })
      hideModal()
    },
    onError: () => {
      antdMessage?.error('Failed to create room status')
    },
  })

  const { mutate: updateMutation, isPending: isUpdateLoading } = useMutation({
    mutationFn: updateItem,
    onSuccess: async () => {
      antdMessage?.success('Room status updated successfully')
      await queryClient.invalidateQueries({ queryKey: [queryKey.RES_ROOM_STATUS_LIST] })
      hideModal()
    },
    onError: () => {
      antdMessage?.error('Failed to update room status')
    },
  })

  const handleSubmit = () => {
    form
      .validateFields()
      .then((values) => {
        if (roomStatusDetailState) {
          updateMutation({
            id: roomStatusDetailState.id,
            ...values,
          })
          return
        }

        createMutation(values)
      })
      .catch((info) => {
        console.error('Validate Failed:', info)
      })
  }

  useEffect(() => {
    if (roomStatusDetailState) {
      form.setFieldsValue({
        status_name: roomStatusDetailState.status_name,
        status_number: roomStatusDetailState.status_number,
      })
    }
  }, [form, roomStatusDetailState])

  return (
    <Modal
      title={roomStatusDetailState ? 'Edit Room Status' : 'Add Room Status'}
      open={isVisible}
      onOk={handleSubmit}
      okText={roomStatusDetailState ? 'Update' : 'Create'}
      confirmLoading={isCreateLoading || isUpdateLoading}
      onCancel={hideModal}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="status_name"
          label="Status Name"
          rules={[
            {
              required: true,
              message: 'Please input status name',
            },
          ]}
        >
          <Input placeholder="Enter status name" />
        </Form.Item>

        <Form.Item
          name="status_number"
          label="Status Number"
          rules={[
            {
              required: true,
              message: 'Please input status number',
            },
            {
              type: 'number',
              message: 'Please input a valid number',
            },
          ]}
        >
          <InputNumber placeholder="Enter status number" style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Modal>
  )
}
