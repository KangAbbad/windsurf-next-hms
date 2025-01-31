'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Drawer, Flex, Form, Input, Typography, Upload, UploadFile } from 'antd'
import { useEffect } from 'react'
import { FiPlus } from 'react-icons/fi'
import { IoClose } from 'react-icons/io5'
import { LuRefreshCcw } from 'react-icons/lu'
import { TbArrowRight } from 'react-icons/tb'

import { queryKey } from '../lib/constants'
import { bedTypeDetailStore } from '../lib/state'
import { createItem } from '../services/post'
import { updateItem } from '../services/put'

import { CreateBedTypeBody, UpdateBedTypeBody } from '@/app/api/bed-types/types'
import { ImageFallback } from '@/components/ImageFallback'
import { useUploadImage } from '@/hooks/api/useUploadImage'
import { useAntdContextHolder } from '@/lib/context/AntdContextHolder'
import { inputNumberValidation } from '@/utils/inputNumberValidation'
import { normFile } from '@/utils/normFile'

type FormType = {
  uploadList: UploadFile[]
  name: string
  length: number
  width: number
  height: number
  material: string
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
  const { data: bedTypeDetailState, resetData: resetBedTypeDetail } = bedTypeDetailStore()
  const imagePreviewUrl = bedTypeDetailState?.image_url?.includes('http')
    ? bedTypeDetailState?.image_url
    : require('@/assets/images/empty-placeholder.png')

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

  const { mutate: uploadImage, isPending: isUploadImageLoading } = useUploadImage({
    options: {
      onSuccess: (res) => {
        const imageUrl = res.data?.image_url ?? ''
        if (bedTypeDetailState?.id ?? '') handleUpdate(imageUrl)
        else handleCreate(imageUrl)
      },
    },
  })

  const handleCreate = (imageUrl: string) => {
    const { uploadList, ...restValues } = form.getFieldsValue()
    const payload: CreateBedTypeBody = {
      ...restValues,
      image_url: imageUrl,
    }
    createMutation(payload)
  }

  const handleUpdate = (imageUrl: string) => {
    const { uploadList, ...restValues } = form.getFieldsValue()
    const payload: UpdateBedTypeBody = {
      ...restValues,
      id: bedTypeDetailState?.id ?? '',
      image_url: imageUrl,
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
    handleUpdate(bedTypeDetailState?.image_url ?? '')
  }

  const onCreate = () => {
    const values = form.getFieldsValue()
    if (!values.uploadList?.length) return
    uploadImage({ file: values.uploadList[0].originFileObj as File })
  }

  const onSubmit = () => {
    if (isFormLoading) return
    if (bedTypeDetailState?.id) onEdit()
    else onCreate()
  }

  useEffect(() => {
    if (!isVisible) return
    if (bedTypeDetailState) {
      form.setFieldsValue({
        name: bedTypeDetailState.name,
        length: bedTypeDetailState.length,
        width: bedTypeDetailState.width,
        height: bedTypeDetailState.height,
        material: bedTypeDetailState.material,
      })
    } else {
      form.resetFields()
    }
  }, [isVisible])

  return (
    <Drawer
      title={bedTypeDetailState ? 'Edit Bed Type' : 'Add Bed Type'}
      open={isVisible}
      onClose={hideDrawer}
      placement="right"
      width={520}
      maskClosable={false}
      closeIcon={<IoClose className="text-black text-2xl" />}
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
        <Flex gap={16} align="center">
          {bedTypeDetailState?.image_url && (
            <>
              <Flex gap={8} vertical className="!mb-3">
                <Typography.Paragraph className="!mb-0">Old Image</Typography.Paragraph>
                <div className="rounded-lg border border-[#D9D9D9] border-dashed bg-[rgba(0,0,0,0.02)] h-[100px] w-[100px] overflow-hidden p-2">
                  <ImageFallback
                    src={imagePreviewUrl}
                    alt={bedTypeDetailState?.name ?? 'Image Preview'}
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
            label={bedTypeDetailState?.image_url ? 'New Image' : 'Upload Image'}
            valuePropName="fileList"
            getValueFromEvent={normFile}
            rules={[
              {
                required: !bedTypeDetailState?.image_url,
                message: 'Please select an image!',
              },
            ]}
            data-testid="form-modal-select-image"
            className="!mb-3"
          >
            <Upload
              name="uploadList"
              listType="picture-card"
              maxCount={1}
              showUploadList={{ showPreviewIcon: false }}
              beforeUpload={() => false}
              data-testid="form-modal-select-image"
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

        <Form.Item
          label="Bed Type Name"
          name="name"
          rules={[{ required: true, message: 'Please input bed type name' }]}
          className="!mb-3"
        >
          <Input size="large" placeholder="Enter bed type name" className="!text-sm" />
        </Form.Item>

        <Form.Item
          label="Length (cm)"
          name="length"
          rules={[
            { required: true, message: 'Please input bed length' },
            {
              pattern: /^\d+$/,
              message: 'Invalid number!',
            },
          ]}
          getValueFromEvent={inputNumberValidation}
          className="!mb-3"
        >
          <Input size="large" placeholder="Enter bed length" className="!text-sm" />
        </Form.Item>

        <Form.Item
          label="Width (cm)"
          name="width"
          rules={[
            { required: true, message: 'Please input bed width' },
            {
              pattern: /^\d+$/,
              message: 'Invalid number!',
            },
          ]}
          getValueFromEvent={inputNumberValidation}
          className="!mb-3"
        >
          <Input size="large" type="number" placeholder="Enter bed width" className="!text-sm" />
        </Form.Item>

        <Form.Item
          label="Height (cm)"
          name="height"
          rules={[
            { required: true, message: 'Please input bed height' },
            {
              pattern: /^\d+$/,
              message: 'Invalid number!',
            },
          ]}
          getValueFromEvent={inputNumberValidation}
          className="!mb-3"
        >
          <Input size="large" type="number" placeholder="Enter bed height" className="!text-sm" />
        </Form.Item>

        <Form.Item
          label="Material"
          name="material"
          rules={[{ required: true, message: 'Please input bed material' }]}
          className="!mb-3"
        >
          <Input size="large" placeholder="Enter bed material" className="!text-sm" />
        </Form.Item>
      </Form>
    </Drawer>
  )
}
