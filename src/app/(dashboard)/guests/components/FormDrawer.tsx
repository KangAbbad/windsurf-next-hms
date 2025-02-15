'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Checkbox, Col, Drawer, Form, Input, Row } from 'antd'
import { AxiosError } from 'axios'
import { useEffect } from 'react'
import { IoClose } from 'react-icons/io5'

import { idCardTypeOptions, nationalityOptions, queryKey } from '../lib/constants'
import { guestDetailStore } from '../lib/state'
import { createItem } from '../services/post'
import { updateItem } from '../services/put'

import { GUEST_ID_CARD_TYPE, GUEST_NATIONALITY_TYPE } from '@/app/api/guests/types'
import { useAntdContextHolder } from '@/lib/context/AntdContextHolder'
import { ApiResponse } from '@/services/apiResponse'
import { inputNumberValidation } from '@/utils/inputNumberValidation'

type FormType = {
  nationality: GUEST_NATIONALITY_TYPE
  id_card_type: GUEST_ID_CARD_TYPE
  id_card_number: string
  name: string
  email?: string
  phone: string
  address?: string
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
  const watchNationality = Form.useWatch('nationality', form)
  const watchIDCardType = Form.useWatch('id_card_type', form)
  const { data: guestDetailState, resetData: resetGuestDetail } = guestDetailStore()

  const hideDrawer = () => {
    form.resetFields()
    resetGuestDetail()
    onCancel()
  }

  const { mutate: createMutation, isPending: isCreateLoading } = useMutation({
    mutationFn: createItem,
    onSuccess: (res) => {
      antdMessage?.success(res?.message ?? 'Guest created successfully')
      queryClient.invalidateQueries({ queryKey: [queryKey.RES_GUEST_LIST] })
      hideDrawer()
    },
    onError: (res: AxiosError<ApiResponse>) => {
      const errors = res.response?.data?.errors ?? []
      const errorMessages = errors.length ? errors.join(', ') : 'Failed to create addon'
      antdMessage?.error(errorMessages)
    },
  })

  const { mutate: updateMutation, isPending: isUpdateLoading } = useMutation({
    mutationFn: updateItem,
    onSuccess: (res) => {
      antdMessage?.success(res?.message ?? 'Guest updated successfully')
      queryClient.invalidateQueries({ queryKey: [queryKey.RES_GUEST_LIST] })
      hideDrawer()
    },
    onError: (res: AxiosError<ApiResponse>) => {
      const errors = res.response?.data?.errors ?? []
      const errorMessages = errors.length ? errors.join(', ') : 'Failed to update addon'
      antdMessage?.error(errorMessages)
    },
  })

  const isFormLoading = isCreateLoading || isUpdateLoading

  const onSubmit = (values: FormType) => {
    if (isFormLoading) return
    if (guestDetailState?.id) {
      updateMutation({ id: guestDetailState.id, ...values })
    } else {
      createMutation(values)
    }
  }

  useEffect(() => {
    if (!isVisible) return
    if (guestDetailState) {
      form.setFieldsValue({
        nationality: guestDetailState.nationality,
        id_card_type: guestDetailState.id_card_type,
        id_card_number: guestDetailState.id_card_number,
        name: guestDetailState.name,
        email: guestDetailState.email,
        phone: guestDetailState.phone,
        address: guestDetailState.address,
      })
    } else {
      form.resetFields()
    }
  }, [isVisible])

  return (
    <Drawer
      open={isVisible}
      title={guestDetailState ? 'Edit Guest' : 'Add Guest'}
      placement="right"
      width={520}
      maskClosable={false}
      closeIcon={<IoClose className="text-black text-2xl" />}
      extra={
        <Button type="primary" loading={isFormLoading} onClick={form.submit}>
          {guestDetailState ? 'Update' : 'Create'}
        </Button>
      }
      onClose={hideDrawer}
    >
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <Form.Item<FormType>
          name="nationality"
          label="Nationality"
          rules={[{ required: true, message: 'Please select nationality' }]}
          className="!mb-3"
        >
          <Row gutter={[16, 16]}>
            {nationalityOptions.map((nationality) => (
              <Col key={nationality.value} span={12}>
                <Checkbox checked={watchNationality === nationality.value} value={nationality.value}>
                  {nationality.label}
                </Checkbox>
              </Col>
            ))}
          </Row>
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
          name="id_card_type"
          label="ID Card Type"
          rules={[{ required: true, message: 'Please select ID Card type' }]}
          className="!mb-3"
        >
          <Row gutter={[16, 16]}>
            {idCardTypeOptions.map((type) => (
              <Col key={type.value} span={12}>
                <Checkbox checked={watchIDCardType === type.value} value={type.value}>
                  {type.label}
                </Checkbox>
              </Col>
            ))}
          </Row>
        </Form.Item>
        <Form.Item<FormType>
          name="id_card_number"
          label="ID Card Number"
          rules={[{ required: true, message: 'Please enter ID Card number' }]}
          className="!mb-3"
        >
          <Input size="large" placeholder="Enter ID Card number" className="!text-sm" />
        </Form.Item>
        <Form.Item<FormType>
          name="phone"
          label="Phone"
          rules={[
            { required: true, message: 'Please enter phone' },
            {
              pattern: /^\d+$/,
              message: 'Invalid number!',
            },
          ]}
          getValueFromEvent={inputNumberValidation}
          className="!mb-3"
        >
          <Input size="large" placeholder="Enter phone" className="!text-sm" />
        </Form.Item>
        <Form.Item<FormType>
          name="email"
          label="Email"
          rules={[
            {
              type: 'email',
              message: 'Please enter a valid email address',
            },
          ]}
          className="!mb-3"
        >
          <Input size="large" placeholder="Enter email" className="!text-sm" />
        </Form.Item>
        <Form.Item<FormType> name="address" label="Address" className="!mb-3">
          <Input.TextArea rows={4} size="large" placeholder="Enter address" className="!text-sm" />
        </Form.Item>
      </Form>
    </Drawer>
  )
}
