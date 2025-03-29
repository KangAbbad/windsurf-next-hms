'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Col, Drawer, Flex, Form, Input, Row, Select, Typography, Upload, UploadFile } from 'antd'
import { AxiosError } from 'axios'
import { useEffect } from 'react'
import { FiPlus } from 'react-icons/fi'
import { HiMinusCircle, HiPlus } from 'react-icons/hi'
import { IoClose } from 'react-icons/io5'
import { LuRefreshCcw } from 'react-icons/lu'
import { TbArrowRight } from 'react-icons/tb'

import { queryKey as queryKeyBedTypeList } from '../../bed-types/lib/constants'
import { getAll as getBedTypes } from '../../bed-types/services/get'
import { queryKey as queryKeyFeatureList } from '../../features/lib/constants'
import { getAll as getFeatures } from '../../features/services/get'
import { queryKey } from '../lib/constants'
import { roomClassDetailStore } from '../lib/state'
import { createItem } from '../services/post'
import { updateItem } from '../services/put'

import { CreateRoomClassBody, ROOM_CLASS_NAME_MAX_LENGTH, UpdateRoomClassBody } from '@/app/api/room-classes/types'
import { ImageFallback } from '@/components/ImageFallback'
import { useUploadImage } from '@/hooks/api/useUploadImage'
import { useAntdContextHolder } from '@/lib/context/AntdContextHolder'
import { ApiResponse } from '@/services/apiResponse'
import { inputNumberValidation } from '@/utils/inputNumberValidation'
import { normFile } from '@/utils/normFile'

type FormType = {
  uploadList: UploadFile[]
  name: string
  price: number
  bed_types: {
    id: string
    num_beds: number
  }[]
  feature_ids: string[]
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
  const watchUploadList = Form.useWatch('uploadList', form) ?? []

  const { data: roomClassDetailState, resetData: resetRoomClassDetail } = roomClassDetailStore()
  const imagePreviewUrl = roomClassDetailState?.image_url?.includes('http')
    ? roomClassDetailState?.image_url
    : require('@/assets/images/empty-placeholder.png')

  const { data: bedTypeListResponse, isPending: isBedTypeListLoading } = useQuery({
    queryKey: [queryKeyBedTypeList.RES_BED_TYPE_LIST, { limit: 10 }],
    queryFn: () => getBedTypes({ page: 1, limit: 10 }),
    enabled: isVisible,
  })
  const bedTypeList = bedTypeListResponse?.data?.items ?? []

  const { data: featureListResponse, isFetching: isFeatureListLoading } = useQuery({
    queryKey: [queryKeyFeatureList.RES_FEATURE_LIST, { limit: 10 }],
    queryFn: () => getFeatures({ page: 1, limit: 10 }),
  })
  const featureList = featureListResponse?.data?.items ?? []

  const hideDrawer = () => {
    form.resetFields()
    resetRoomClassDetail()
    onCancel()
  }

  const { mutate: createMutation, isPending: isCreateLoading } = useMutation({
    mutationFn: createItem,
    onSuccess: (res) => {
      antdMessage?.success(res?.message ?? 'Room class created successfully')
      queryClient.invalidateQueries({ queryKey: [queryKey.RES_ROOM_CLASS_LIST] })
      hideDrawer()
    },
    onError: (res: AxiosError<ApiResponse>) => {
      const errors = res.response?.data?.errors ?? []
      const errorMessages = errors.length ? errors.join(', ') : 'Failed to create room class'
      antdMessage?.error(errorMessages)
    },
  })

  const { mutate: updateMutation, isPending: isUpdateLoading } = useMutation({
    mutationFn: updateItem,
    onSuccess: (res) => {
      antdMessage?.success(res?.message ?? 'Room class updated successfully')
      queryClient.invalidateQueries({ queryKey: [queryKey.RES_ROOM_CLASS_LIST] })
      hideDrawer()
    },
    onError: (res: AxiosError<ApiResponse>) => {
      const errors = res.response?.data?.errors ?? []
      const errorMessages = errors.length ? errors.join(', ') : 'Failed to update room class'
      antdMessage?.error(errorMessages)
    },
  })

  const { mutate: uploadImage, isPending: isUploadImageLoading } = useUploadImage({
    options: {
      onSuccess: (res) => {
        const imageUrl = res.data?.image_url ?? ''
        if (roomClassDetailState?.id ?? '') handleUpdate(imageUrl)
        else handleCreate(imageUrl)
      },
    },
  })

  const handleCreate = (imageUrl: string) => {
    const { uploadList, ...restValues } = form.getFieldsValue()
    const payload: CreateRoomClassBody = {
      ...restValues,
      image_url: imageUrl,
      price: Number(restValues.price),
    }
    createMutation(payload)
  }

  const handleUpdate = (imageUrl: string) => {
    const { uploadList, ...restValues } = form.getFieldsValue()
    const payload: UpdateRoomClassBody = {
      ...restValues,
      id: roomClassDetailState?.id ?? '',
      image_url: imageUrl,
      price: Number(restValues.price),
    }
    updateMutation(payload)
  }

  const isFormLoading = isCreateLoading || isUpdateLoading || isUploadImageLoading

  const onEdit = () => {
    if (isFormLoading) return
    const values = form.getFieldsValue()
    if (values.uploadList?.length) {
      uploadImage({
        folder: 'room-class',
        file: values.uploadList[0].originFileObj as File,
      })
      return
    }
    handleUpdate(roomClassDetailState?.image_url ?? '')
  }

  const onCreate = () => {
    const values = form.getFieldsValue()
    if (!values.uploadList?.length) return
    uploadImage({
      folder: 'room-class',
      file: values.uploadList[0].originFileObj as File,
    })
  }

  const onSubmit = () => {
    if (isFormLoading) return
    if (roomClassDetailState?.id) onEdit()
    else onCreate()
  }

  useEffect(() => {
    if (!isVisible) return
    if (roomClassDetailState) {
      form.setFieldsValue({
        name: roomClassDetailState.name,
        price: roomClassDetailState.price,
        bed_types: roomClassDetailState.bed_types.map((bt) => ({
          id: bt.bed_type_id,
          num_beds: bt.num_beds,
        })),
        feature_ids: roomClassDetailState.features.map((f) => f.id),
      })
    } else {
      form.resetFields()
    }
  }, [isVisible])

  return (
    <Drawer
      title={roomClassDetailState ? 'Edit Room Class' : 'Add Room Class'}
      open={isVisible}
      placement="right"
      width={520}
      maskClosable={false}
      closeIcon={<IoClose className="text-black dark:text-white text-2xl" />}
      extra={
        <Button type="primary" loading={isFormLoading} onClick={form.submit}>
          {roomClassDetailState ? 'Update' : 'Create'}
        </Button>
      }
      onClose={hideDrawer}
    >
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <Flex gap={16} align="center">
          {roomClassDetailState?.image_url && (
            <>
              <Flex gap={8} vertical className="!mb-3">
                <Typography.Paragraph className="!mb-0">Old Image</Typography.Paragraph>
                <div className="rounded-lg border border-[#D9D9D9] border-dashed bg-[rgba(0,0,0,0.02)] h-[100px] w-[100px] overflow-hidden p-2">
                  <ImageFallback
                    src={imagePreviewUrl}
                    alt={roomClassDetailState?.name ?? 'Image Preview'}
                    priority
                    height={100}
                    width={100}
                    className="!h-full !w-full !object-contain"
                  />
                </div>
              </Flex>
              <TbArrowRight size={30} className="mt-5" />
            </>
          )}
          <Form.Item<FormType>
            name="uploadList"
            label={roomClassDetailState?.image_url ? 'New Image' : 'Upload Image'}
            valuePropName="fileList"
            getValueFromEvent={normFile}
            rules={[
              {
                required: !roomClassDetailState?.image_url,
                message: 'Please select an image!',
              },
            ]}
            className="!mb-3"
          >
            <Upload
              name="uploadList"
              listType="picture-card"
              maxCount={1}
              showUploadList={{ showPreviewIcon: false }}
              beforeUpload={() => false}
            >
              <Flex vertical align="center" justify="center">
                {watchUploadList.length ? (
                  <>
                    <LuRefreshCcw fontSize="24px" />
                    <Typography.Text className="text-sm mt-2">Change Image</Typography.Text>
                  </>
                ) : (
                  <>
                    <FiPlus fontSize="24px" />
                    <Typography.Text className="text-sm mt-2">Upload Image</Typography.Text>
                  </>
                )}
              </Flex>
            </Upload>
          </Form.Item>
        </Flex>

        <Form.Item<FormType>
          label="Name"
          name="name"
          rules={[
            { required: true, message: 'Please enter name' },
            { max: ROOM_CLASS_NAME_MAX_LENGTH, message: `Maximum length is ${ROOM_CLASS_NAME_MAX_LENGTH} characters` },
          ]}
          className="!mb-3"
        >
          <Input
            size="large"
            showCount
            maxLength={ROOM_CLASS_NAME_MAX_LENGTH}
            className="!text-sm"
            placeholder="Enter name"
          />
        </Form.Item>

        <Form.Item<FormType>
          label="Price"
          name="price"
          rules={[
            { required: true, message: 'Please enter price' },
            {
              pattern: /^\d+$/,
              message: 'Invalid number!',
            },
          ]}
          getValueFromEvent={inputNumberValidation}
        >
          <Input
            size="large"
            addonBefore={<Typography.Text className="!text-sm">Rp</Typography.Text>}
            placeholder="Enter price"
            classNames={{ input: '!text-sm' }}
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
              {fields.map(({ key, name, ...restField }) => (
                <Row key={key} gutter={[8, 8]} className="!items-center mb-2">
                  <Col span={fields.length > 1 ? 16 : 18}>
                    <Form.Item
                      {...restField}
                      name={[name, 'id']}
                      rules={[{ required: true, message: 'Missing bed type' }]}
                      className="!mb-0"
                    >
                      <Select
                        allowClear
                        showSearch
                        loading={isBedTypeListLoading}
                        placeholder="Select bed type"
                        filterOption={(input, option) => {
                          return (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }}
                        options={bedTypeList.map((bedType) => {
                          const { id, name, ...restBt } = bedType
                          return { label: name, value: id, ...restBt }
                        })}
                        optionRender={(option) => {
                          const { label, image_url, material, length, width, height } = option.data
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
                                <Typography.Paragraph className="!text-gray-400 !mb-0">{material}</Typography.Paragraph>
                                <Typography.Paragraph className="!text-gray-400 !mb-0">
                                  {length}x{width}x{height}
                                </Typography.Paragraph>
                              </div>
                            </Flex>
                          )
                        }}
                        className="!min-h-9"
                      />
                    </Form.Item>
                  </Col>

                  <Col span={6}>
                    <Form.Item
                      {...restField}
                      name={[name, 'num_beds']}
                      rules={[
                        { required: true, message: 'Missing number' },
                        {
                          pattern: /^\d+$/,
                          message: 'Invalid number!',
                        },
                      ]}
                      getValueFromEvent={inputNumberValidation}
                      className="!w-full !mb-0"
                    >
                      <Input size="large" suffix="bed(s)" className="!text-sm !w-full" />
                    </Form.Item>
                  </Col>

                  {fields.length > 1 && (
                    <Col span={2}>
                      <HiMinusCircle
                        className="text-red-500 text-lg"
                        onClick={() => {
                          remove(name)
                        }}
                      />
                    </Col>
                  )}
                </Row>
              ))}
              <Form.Item className="!mb-3">
                <Button
                  type="dashed"
                  onClick={() => {
                    add()
                  }}
                  block
                  icon={<HiPlus />}
                >
                  Add Bed Type
                </Button>
                <Form.ErrorList errors={errors} />
              </Form.Item>
            </>
          )}
        </Form.List>

        <Form.Item<FormType>
          name="feature_ids"
          label="Features"
          rules={[{ required: true, message: 'Please select at least one feature' }]}
        >
          <Select
            mode="multiple"
            loading={isFeatureListLoading}
            placeholder="Select features"
            options={featureList.map((f) => {
              const { id, name, ...restBt } = f
              return { label: name, value: id, ...restBt }
            })}
            optionRender={(option) => {
              const { label, image_url, price } = option.data
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
                    <Typography.Paragraph className="!text-gray-400 !mb-0">{price}</Typography.Paragraph>
                  </div>
                </Flex>
              )
            }}
          />
        </Form.Item>
      </Form>
    </Drawer>
  )
}
