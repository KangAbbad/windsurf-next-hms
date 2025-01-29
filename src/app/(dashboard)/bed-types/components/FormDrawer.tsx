'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Drawer, Form, Input } from 'antd'
import { useEffect } from 'react'

import { queryKey } from '../lib/constants'
import { bedTypeDetailStore } from '../lib/state'
import { createItem } from '../services/post'
import { updateItem } from '../services/put'

import { useAntdContextHolder } from '@/lib/context/AntdContextHolder'

type FormType = {
  name: string
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
  const { data: bedTypeDetailState, resetData: resetBedTypeDetail } = bedTypeDetailStore()

  const hideDrawer = () => {
    form.resetFields()
    resetBedTypeDetail()
    onCancel()
  }

  const { mutate: createMutation, isPending: isCreateLoading } = useMutation({
    mutationFn: createItem,
    onSuccess: (res) => {
      antdMessage?.success(res?.message ?? 'Bed type created successfully')
      queryClient.invalidateQueries({ queryKey: [queryKey.RES_BED_TYPE_LIST] })
      hideDrawer()
    },
    onError: (res) => {
      antdMessage?.error(res?.message ?? 'Failed to create bed type')
    },
  })

  const { mutate: updateMutation, isPending: isUpdateLoading } = useMutation({
    mutationFn: updateItem,
    onSuccess: (res) => {
      antdMessage?.success(res?.message ?? 'Bed type updated successfully')
      hideDrawer()
      queryClient.invalidateQueries({ queryKey: [queryKey.RES_BED_TYPE_LIST] })
    },
    onError: (res) => {
      antdMessage?.error(res?.message ?? 'Failed to update bed type')
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
        name: bedTypeDetailState.name,
      })
    } else {
      form.resetFields()
    }
  }, [isVisible])

  return (
    <Drawer
      title={bedTypeDetailState ? 'Edit Bed Type' : 'Add New Bed Type'}
      open={isVisible}
      onClose={hideDrawer}
      placement="right"
      width={520}
      maskClosable={false}
      footer={
        <div className="flex justify-end gap-2">
          <button className="px-4 py-2 border rounded-md hover:bg-gray-50" onClick={hideDrawer} type="button">
            Cancel
          </button>
          <button
            className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:bg-blue-300"
            onClick={form.submit}
            disabled={isFormLoading}
            type="submit"
          >
            {bedTypeDetailState ? 'Update' : 'Create'}
          </button>
        </div>
      }
    >
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <Form.Item
          label="Bed Type Name"
          name="name"
          rules={[{ required: true, message: 'Please input bed type name' }]}
        >
          <Input className="w-full" placeholder="Enter bed type name" />
        </Form.Item>
      </Form>
    </Drawer>
  )
}
