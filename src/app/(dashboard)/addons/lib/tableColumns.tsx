import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Flex, Popconfirm, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { AxiosError } from 'axios'
import dayjs from 'dayjs'
import { usePathname, useRouter } from 'next/navigation'
import { CSSProperties } from 'react'
import { FaPenToSquare, FaTrashCan } from 'react-icons/fa6'

import { queryKey } from './constants'
import { getPageParams } from './getPageParams'
import { addonDetailStore } from './state'
import { deleteItem } from '../services/delete'

import { AddonListItem } from '@/app/api/addons/types'
import { ImageFallback } from '@/components/ImageFallback'
import { useAntdContextHolder } from '@/lib/context/AntdContextHolder'
import { ApiResponse } from '@/services/apiResponse'
import { searchByTableColumn } from '@/utils/changeTableFilter'
import { formatCurrency } from '@/utils/formatCurrency'
import { getColumnSearchProps } from '@/utils/getColumnSearchProps'

type Props = {
  onEdit: () => void
}

export const tableColumns = (props: Props) => {
  const { onEdit } = props

  return (): ColumnsType<AddonListItem> => {
    const router = useRouter()
    const queryClient = useQueryClient()
    const pathname = usePathname()
    const { antdMessage } = useAntdContextHolder()
    const pageParams = getPageParams()
    const { setData: setAddonDetail } = addonDetailStore()

    const {
      mutate: deleteMutation,
      variables: deleteVariables,
      isPending: isDeleteLoading,
    } = useMutation({
      mutationFn: deleteItem,
      onSuccess: () => {
        antdMessage?.success('Addon deleted successfully')
        queryClient.invalidateQueries({ queryKey: [queryKey.RES_ADDON_LIST] })
      },
      onError: (res: AxiosError<ApiResponse>) => {
        const errors = res.response?.data?.errors ?? []
        const errorMessages = errors.length ? errors.join(', ') : 'Failed to delete addon'
        antdMessage?.error(errorMessages)
      },
    })

    const onDelete = (id: string) => {
      if (isDeleteLoading) return
      deleteMutation(id)
    }

    return [
      {
        title: 'Image',
        dataIndex: 'image_url',
        key: 'image_url',
        width: 125,
        render: (_, record) => {
          const image = record?.image_url
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          const isImageAvailable = image?.includes('http') || image?.includes('base64')
          const imageUrl = isImageAvailable ? image : require('@/assets/images/empty-placeholder.png')
          const imagePreviewStyles: CSSProperties = {
            objectFit: isImageAvailable ? 'contain' : 'fill',
          }

          return (
            <div className="border rounded-lg overflow-hidden h-[100px] w-[100px]">
              <ImageFallback
                src={imageUrl}
                alt={record?.name ?? 'Image Preview'}
                priority
                height={100}
                width={100}
                className="h-full w-full"
                style={imagePreviewStyles}
              />
            </div>
          )
        },
      },
      {
        title: 'Name',
        dataIndex: 'name',
        key: 'name',
        width: '25%',
        ...getColumnSearchProps({
          initialValue: pageParams.search?.name,
          placeholder: 'Search by name',
          onSearch: (value) => {
            searchByTableColumn({ router, pathname, pageParams, dataIndex: 'search[name]', value })
          },
        }),
        sorter: (a, b) => a.name.localeCompare(b.name),
      },
      {
        title: 'Price',
        dataIndex: 'price',
        key: 'price',
        width: '25%',
        sorter: (a, b) => a.price - b.price,
        ...getColumnSearchProps({
          initialValue: pageParams.search?.price?.toString(),
          placeholder: 'exp: 25000 or 10000-25000',
          onSearch: (value) => {
            searchByTableColumn({ router, pathname, pageParams, dataIndex: 'search[price]', value })
          },
        }),
        render: (price) => <Typography.Text className="font-medium">{formatCurrency(price)}</Typography.Text>,
      },
      {
        title: 'Time',
        dataIndex: 'created_at',
        key: 'created_at',
        width: '15%',
        sorter: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        render: (_, record) => {
          const createdAt = record.created_at ? dayjs(record.created_at).format('DD MMM YYYY, HH:mm') : '-'
          const updatedAt = record.updated_at ? dayjs(record.updated_at).format('DD MMM YYYY, HH:mm') : '-'
          return (
            <Flex gap={4} vertical>
              <Typography.Paragraph className="font-semibold !mb-0">Created At</Typography.Paragraph>
              <Typography.Paragraph className="!mb-0">{createdAt}</Typography.Paragraph>
              <Typography.Paragraph className="font-semibold !mb-0">Updated At</Typography.Paragraph>
              <Typography.Paragraph className="!mb-0">{updatedAt}</Typography.Paragraph>
            </Flex>
          )
        },
      },
      {
        title: 'Actions',
        key: 'actions',
        align: 'center',
        width: '15%',
        render: (_, record) => (
          <Flex gap={4} align="center" justify="center">
            <Button
              type="text"
              icon={<FaPenToSquare />}
              onClick={() => {
                setAddonDetail(record)
                onEdit()
              }}
            />
            <Popconfirm
              title="Delete addon"
              description="Are you sure you want to delete this addon?"
              placement="leftTop"
              okText="Yes"
              okType="danger"
              cancelText="No"
              onConfirm={() => {
                onDelete(record.id)
              }}
            >
              <Button
                type="text"
                danger
                icon={<FaTrashCan className="text-red-500" />}
                loading={isDeleteLoading && deleteVariables === record.id}
              />
            </Popconfirm>
          </Flex>
        ),
      },
    ]
  }
}
