'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Checkbox, Col, Drawer, Flex, Form, Input, Row, Select, Tag, Typography } from 'antd'
import { AxiosError } from 'axios'
import { useEffect } from 'react'
import { IoClose } from 'react-icons/io5'

import { queryKey as queryKeyFloorList } from '../../floors/lib/constants'
import { queryKey as queryKeyRoomClassList } from '../../room-classes/lib/constants'
import { queryKey as queryKeyRoomStatusList } from '../../room-statuses/lib/constants'
import { queryKey } from '../lib/constants'
import { roomDetailStore } from '../lib/state'
import { createItem } from '../services/post'
import { updateItem } from '../services/put'

import { getAll as getFloors } from '@/app/(dashboard)/floors/services/get'
import { getAll as getRoomClasses } from '@/app/(dashboard)/room-classes/services/get'
import { getAll as getRoomStatuses } from '@/app/(dashboard)/room-statuses/services/get'
import { ImageFallback } from '@/components/ImageFallback'
import { useAntdContextHolder } from '@/lib/context/AntdContextHolder'
import { ApiResponse } from '@/services/apiResponse'
import { formatCurrency } from '@/utils/formatCurrency'
import { inputNumberValidation } from '@/utils/inputNumberValidation'

type FormType = {
  number: number
  floor_id: string
  room_class_id: string
  room_status_id: string
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
  const watchRoomStatus = Form.useWatch('room_status_id', form)
  const { data: roomDetailState } = roomDetailStore()

  const { data: roomClassListResponse, isFetching: isRoomClassListLoading } = useQuery({
    queryKey: [queryKeyRoomClassList.RES_ROOM_CLASS_LIST],
    queryFn: () => getRoomClasses({ page: 1, limit: 100 }),
  })
  const roomClasses = roomClassListResponse?.data?.items ?? []

  const { data: roomStatusListResponse } = useQuery({
    queryKey: [queryKeyRoomStatusList.RES_ROOM_STATUS_LIST],
    queryFn: () => getRoomStatuses({ page: 1, limit: 100 }),
  })
  const roomStatuses = roomStatusListResponse?.data?.items ?? []

  const { data: floorListResponse, isFetching: isLoadingFloors } = useQuery({
    queryKey: [queryKeyFloorList.RES_FLOOR_LIST],
    queryFn: () => getFloors({ page: 1, limit: 100 }),
  })
  const floors = floorListResponse?.data?.items ?? []

  const hideDrawer = () => {
    form.resetFields()
    onCancel()
  }

  const { mutate: createMutation, isPending: isCreateLoading } = useMutation({
    mutationFn: createItem,
    onSuccess: (res) => {
      antdMessage?.success(res?.message ?? 'Room created successfully')
      queryClient.invalidateQueries({ queryKey: [queryKey.RES_ROOM_LIST] })
      hideDrawer()
    },
    onError: (res: AxiosError<ApiResponse>) => {
      const errors = res.response?.data?.errors ?? []
      const errorMessages = errors.length ? errors.join(', ') : 'Failed to create room'
      antdMessage?.error(errorMessages)
    },
  })

  const { mutate: updateMutation, isPending: isUpdateLoading } = useMutation({
    mutationFn: updateItem,
    onSuccess: (res) => {
      antdMessage?.success(res?.message ?? 'Room updated successfully')
      queryClient.invalidateQueries({ queryKey: [queryKey.RES_ROOM_LIST] })
      hideDrawer()
    },
    onError: (res: AxiosError<ApiResponse>) => {
      const errors = res.response?.data?.errors ?? []
      const errorMessages = errors.length ? errors.join(', ') : 'Failed to update room'
      antdMessage?.error(errorMessages)
    },
  })

  const isFormLoading = isCreateLoading || isUpdateLoading

  const onSubmit = (values: FormType) => {
    if (isFormLoading) return
    if (roomDetailState) {
      updateMutation({ id: roomDetailState.id, ...values, number: Number(values.number) })
    } else {
      createMutation({ ...values, number: Number(values.number) })
    }
  }

  useEffect(() => {
    if (!isVisible) return
    if (roomDetailState) {
      form.setFieldsValue({
        number: roomDetailState.number,
        floor_id: roomDetailState.floor_id,
        room_class_id: roomDetailState.room_class_id,
        room_status_id: roomDetailState.room_status_id,
      })
    } else {
      form.resetFields()
    }
  }, [isVisible])

  return (
    <Drawer
      title={roomDetailState ? 'Edit Room' : 'Add Room'}
      open={isVisible}
      placement="right"
      width={520}
      maskClosable={false}
      closeIcon={<IoClose className="text-black dark:text-white text-2xl" />}
      extra={
        <Button type="primary" loading={isFormLoading} onClick={form.submit}>
          {roomDetailState ? 'Update' : 'Create'}
        </Button>
      }
      onClose={hideDrawer}
    >
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <Form.Item<FormType>
          name="floor_id"
          label="Floor"
          rules={[{ required: true, message: 'Please select floor' }]}
          className="!mb-3"
        >
          <Select
            allowClear
            showSearch
            loading={isLoadingFloors}
            placeholder="Select floor"
            filterOption={(input, option) => {
              return (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }}
            options={floors.map((floor) => ({
              value: floor.id,
              label: `${floor.number} (${floor.name})`,
            }))}
            className="!h-9"
          />
        </Form.Item>
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
          getValueFromEvent={inputNumberValidation}
          className="!mb-3"
        >
          <Input size="large" placeholder="Enter number" className="!text-sm" />
        </Form.Item>
        <Form.Item<FormType>
          name="room_class_id"
          label="Class"
          rules={[{ required: true, message: 'Please select class' }]}
          className="!mb-3"
        >
          <Select
            allowClear
            showSearch
            loading={isRoomClassListLoading}
            placeholder="Select class"
            filterOption={(input, option) => {
              return (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }}
            options={roomClasses.map((roomClass) => {
              const { id, name, ...restRoomClass } = roomClass
              return {
                value: id,
                label: name,
                ...restRoomClass,
              }
            })}
            optionRender={(option) => {
              const { image_url, label, bed_types, price } = option.data
              const { bed_type } = (bed_types ?? [])[0]
              return (
                <Flex gap={8}>
                  <div className="rounded-lg border border-[#D9D9D9] bg-[rgba(0,0,0,0.02)] h-[100px] w-[100px] overflow-hidden">
                    <ImageFallback
                      src={image_url ?? require('@/assets/images/empty-placeholder.png')}
                      alt={label}
                      height={100}
                      width={100}
                      className="!h-full !w-full !object-contain"
                    />
                  </div>
                  <div>
                    <Typography.Paragraph className="!mb-0">{label}</Typography.Paragraph>
                    <Typography.Paragraph className="!text-gray-400 !mb-0">{bed_type.material}</Typography.Paragraph>
                    <Typography.Paragraph className="!text-gray-400 !mb-0">
                      {bed_type.length}x{bed_type.width}x{bed_type.height}
                    </Typography.Paragraph>
                    <Typography.Paragraph className="!mt-2 !mb-0">{formatCurrency(price)}</Typography.Paragraph>
                  </div>
                </Flex>
              )
            }}
            className="!h-9"
          />
        </Form.Item>
        <Form.Item<FormType>
          name="room_status_id"
          label="Status"
          rules={[{ required: true, message: 'Please select status' }]}
          className="!mb-3"
        >
          <Row gutter={[16, 16]}>
            {roomStatuses.map((roomStatus) => {
              return (
                <Col key={roomStatus.id} span={12}>
                  <Checkbox checked={watchRoomStatus === roomStatus.id} value={roomStatus.id}>
                    <Tag color={roomStatus.color ?? 'default'}>{roomStatus.name}</Tag>
                  </Checkbox>
                </Col>
              )
            })}
          </Row>
        </Form.Item>
      </Form>
    </Drawer>
  )
}
