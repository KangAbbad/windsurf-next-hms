'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Drawer, Flex, Form, Input, Typography, Upload, UploadFile } from 'antd'
import { AxiosError } from 'axios'
import { useEffect } from 'react'
import { FiPlus } from 'react-icons/fi'
import { IoClose } from 'react-icons/io5'
import { LuRefreshCcw } from 'react-icons/lu'
import { TbArrowRight } from 'react-icons/tb'

import { queryKey } from '../lib/constants'
import { featureDetailStore } from '../lib/state'
import { createItem } from '../services/post'
import { updateItem } from '../services/put'

import { CreateFeatureBody, FEATURE_NAME_MAX_LENGTH, UpdateFeatureBody } from '@/app/api/features/types'
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
  const { data: featureDetailState, resetData: resetFeatureDetail } = featureDetailStore()
  const imagePreviewUrl = featureDetailState?.image_url?.includes('http')
    ? featureDetailState?.image_url
    : require('@/assets/images/empty-placeholder.png')

  const hideDrawer = () => {
    form.resetFields()
    resetFeatureDetail()
    onCancel()
  }

  const { mutate: createMutation, isPending: isCreateLoading } = useMutation({
    mutationFn: createItem,
    onSuccess: (res) => {
      antdMessage?.success(res?.message ?? 'Feature created successfully')
      queryClient.invalidateQueries({ queryKey: [queryKey.RES_FEATURE_LIST] })
      hideDrawer()
    },
    onError: (res: AxiosError<ApiResponse>) => {
      const errors = res.response?.data?.errors ?? []
      const errorMessages = errors.length ? errors.join(', ') : 'Failed to create feature'
      antdMessage?.error(errorMessages)
    },
  })

  const { mutate: updateMutation, isPending: isUpdateLoading } = useMutation({
    mutationFn: updateItem,
    onSuccess: (res) => {
      antdMessage?.success(res?.message ?? 'Feature updated successfully')
      queryClient.invalidateQueries({ queryKey: [queryKey.RES_FEATURE_LIST] })
      hideDrawer()
    },
    onError: (res: AxiosError<ApiResponse>) => {
      const errors = res.response?.data?.errors ?? []
      const errorMessages = errors.length ? errors.join(', ') : 'Failed to update feature'
      antdMessage?.error(errorMessages)
    },
  })

  const { mutate: uploadImage, isPending: isUploadImageLoading } = useUploadImage({
    options: {
      onSuccess: (res) => {
        const imageUrl = res.data?.image_url ?? ''
        if (featureDetailState?.id ?? '') handleUpdate(imageUrl)
        else handleCreate(imageUrl)
      },
    },
  })

  const handleCreate = (imageUrl: string) => {
    const { uploadList, ...restValues } = form.getFieldsValue()
    const payload: CreateFeatureBody = {
      ...restValues,
      image_url: imageUrl,
      price: Number(restValues.price),
    }
    createMutation(payload)
  }

  const handleUpdate = (imageUrl: string) => {
    const { uploadList, ...restValues } = form.getFieldsValue()
    const payload: UpdateFeatureBody = {
      ...restValues,
      id: featureDetailState?.id ?? '',
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
        folder: 'feature',
        file: values.uploadList[0].originFileObj as File,
      })
      return
    }
    handleUpdate(featureDetailState?.image_url ?? '')
  }

  const onCreate = () => {
    const values = form.getFieldsValue()
    if (!values.uploadList?.length) return
    uploadImage({
      folder: 'feature',
      file: values.uploadList[0].originFileObj as File,
    })
  }

  const onSubmit = () => {
    if (isFormLoading) return
    if (featureDetailState?.id) onEdit()
    else onCreate()
  }

  useEffect(() => {
    if (!isVisible) return
    if (featureDetailState) {
      form.setFieldsValue({
        name: featureDetailState.name,
        price: featureDetailState.price,
      })
    } else {
      form.resetFields()
    }
  }, [isVisible])

  return (
    <Drawer
      title={featureDetailState ? 'Edit Feature' : 'Add Feature'}
      open={isVisible}
      placement="right"
      width={520}
      maskClosable={false}
      closeIcon={<IoClose className="text-black dark:text-white text-2xl" />}
      extra={
        <Button type="primary" loading={isFormLoading} onClick={form.submit}>
          {featureDetailState ? 'Update' : 'Create'}
        </Button>
      }
      onClose={hideDrawer}
    >
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <Flex gap={16} align="center">
          {featureDetailState?.image_url && (
            <>
              <Flex gap={8} vertical className="!mb-3">
                <Typography.Paragraph className="!mb-0">Old Image</Typography.Paragraph>
                <div className="rounded-lg border border-[#D9D9D9] border-dashed bg-[rgba(0,0,0,0.02)] h-[100px] w-[100px] overflow-hidden p-2">
                  <ImageFallback
                    src={imagePreviewUrl}
                    alt={featureDetailState?.name ?? 'Image Preview'}
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
            label={featureDetailState?.image_url ? 'New Image' : 'Upload Image'}
            valuePropName="fileList"
            getValueFromEvent={normFile}
            rules={[
              {
                required: !featureDetailState?.image_url,
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
            { max: FEATURE_NAME_MAX_LENGTH, message: `Maximum length is ${FEATURE_NAME_MAX_LENGTH} characters` },
          ]}
          className="!mb-3"
        >
          <Input
            size="large"
            showCount
            maxLength={FEATURE_NAME_MAX_LENGTH}
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
          className="!mb-3"
        >
          <Input
            size="large"
            addonBefore={<Typography.Text className="!text-sm">Rp</Typography.Text>}
            placeholder="Enter price"
            classNames={{ input: '!text-sm' }}
          />
        </Form.Item>
      </Form>
    </Drawer>
  )
}
