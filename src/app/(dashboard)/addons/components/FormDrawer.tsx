'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Form, Input, Typography, Drawer, Button, UploadFile, Flex, Upload } from 'antd'
import { useEffect } from 'react'
import { FiPlus } from 'react-icons/fi'
import { IoClose } from 'react-icons/io5'
import { LuRefreshCcw } from 'react-icons/lu'
import { TbArrowRight } from 'react-icons/tb'

import { queryKey } from '../lib/constants'
import { addonDetailStore } from '../lib/state'
import { createItem } from '../services/post'
import { updateItem } from '../services/put'

import { ADDON_NAME_MAX_LENGTH, CreateAddonBody, UpdateAddonBody } from '@/app/api/addons/types'
import { ImageFallback } from '@/components/ImageFallback'
import { useUploadImage } from '@/hooks/api/useUploadImage'
import { useAntdContextHolder } from '@/lib/context/AntdContextHolder'
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
  const { data: addonDetailState, resetData: resetAddonDetail } = addonDetailStore()
  const imagePreviewUrl = addonDetailState?.image_url?.includes('http')
    ? addonDetailState?.image_url
    : require('@/assets/images/empty-placeholder.png')

  const hideDrawer = () => {
    form.resetFields()
    resetAddonDetail()
    onCancel()
  }

  const { mutate: createMutation, isPending: isCreateLoading } = useMutation({
    mutationFn: createItem,
    onSuccess: (res) => {
      antdMessage?.success(res?.message ?? 'Addon created successfully')
      queryClient.invalidateQueries({ queryKey: [queryKey.RES_ADDON_LIST] })
      hideDrawer()
    },
    onError: (res) => {
      antdMessage?.error(res?.message ?? 'Failed to create addon')
    },
  })

  const { mutate: updateMutation, isPending: isUpdateLoading } = useMutation({
    mutationFn: updateItem,
    onSuccess: (res) => {
      antdMessage?.success(res?.message ?? 'Addon updated successfully')
      queryClient.invalidateQueries({ queryKey: [queryKey.RES_ADDON_LIST] })
      hideDrawer()
    },
    onError: (res) => {
      antdMessage?.error(res?.message ?? 'Failed to update addon')
    },
  })

  const { mutate: uploadImage, isPending: isUploadImageLoading } = useUploadImage({
    options: {
      onSuccess: (res) => {
        const imageUrl = res.data?.image_url ?? ''
        if (addonDetailState?.id ?? '') handleUpdate(imageUrl)
        else handleCreate(imageUrl)
      },
    },
  })

  const handleCreate = (imageUrl: string) => {
    const { uploadList, ...restValues } = form.getFieldsValue()
    const payload: CreateAddonBody = {
      ...restValues,
      image_url: imageUrl,
      price: Number(restValues.price),
    }
    createMutation(payload)
  }

  const handleUpdate = (imageUrl: string) => {
    const { uploadList, ...restValues } = form.getFieldsValue()
    const payload: UpdateAddonBody = {
      ...restValues,
      id: addonDetailState?.id ?? '',
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
      uploadImage({ file: values.uploadList[0].originFileObj as File })
      return
    }
    handleUpdate(addonDetailState?.image_url ?? '')
  }

  const onCreate = () => {
    const values = form.getFieldsValue()
    if (!values.uploadList?.length) return
    uploadImage({ file: values.uploadList[0].originFileObj as File })
  }

  const onSubmit = () => {
    if (isFormLoading) return
    if (addonDetailState?.id) onEdit()
    else onCreate()
  }

  useEffect(() => {
    if (!isVisible) return
    if (addonDetailState) {
      form.setFieldsValue({
        name: addonDetailState.name,
        price: addonDetailState.price,
      })
    } else {
      form.resetFields()
    }
  }, [isVisible])

  return (
    <Drawer
      title={addonDetailState ? 'Edit Addon' : 'Add Addon'}
      open={isVisible}
      placement="right"
      width={520}
      maskClosable={false}
      closeIcon={<IoClose className="text-black text-2xl" />}
      extra={
        <Button type="primary" loading={isFormLoading} onClick={form.submit}>
          {addonDetailState ? 'Update' : 'Create'}
        </Button>
      }
      onClose={hideDrawer}
    >
      <Form form={form} layout="vertical" onFinish={onSubmit} className="!mt-4">
        <Flex gap={16} align="center">
          {addonDetailState?.image_url && (
            <>
              <Flex gap={8} vertical className="!mb-3">
                <Typography.Paragraph className="!mb-0">Old Image</Typography.Paragraph>
                <div className="rounded-lg border border-[#D9D9D9] border-dashed bg-[rgba(0,0,0,0.02)] h-[100px] w-[100px] overflow-hidden p-2">
                  <ImageFallback
                    src={imagePreviewUrl}
                    alt={addonDetailState?.name ?? 'Image Preview'}
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
            label={addonDetailState?.image_url ? 'New Image' : 'Upload Image'}
            valuePropName="fileList"
            getValueFromEvent={normFile}
            rules={[
              {
                required: !addonDetailState?.image_url,
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
          name="name"
          label="Name"
          rules={[{ required: true, message: 'Please enter name' }]}
          className="!mb-3"
        >
          <Input
            size="large"
            showCount
            maxLength={ADDON_NAME_MAX_LENGTH}
            className="!text-sm"
            placeholder="Enter name"
          />
        </Form.Item>

        <Form.Item<FormType>
          name="price"
          label="Price"
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
