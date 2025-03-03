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
import { bedTypeDetailStore } from './state'
import { deleteItem } from '../services/delete'

import { BedTypeListItem } from '@/app/api/bed-types/types'
import { ImageFallback } from '@/components/ImageFallback'
import { useAntdContextHolder } from '@/lib/context/AntdContextHolder'
import { ApiResponse } from '@/services/apiResponse'
import { searchByTableColumn } from '@/utils/changeTableFilter'
import { getColumnSearchProps } from '@/utils/getColumnSearchProps'

type Props = {
  onEdit: () => void
}

export const tableColumns = (props: Props) => {
  const { onEdit } = props

  return (): ColumnsType<BedTypeListItem> => {
    const router = useRouter()
    const pathname = usePathname()
    const queryClient = useQueryClient()
    const { antdMessage } = useAntdContextHolder()
    const pageParams = getPageParams()
    const { setData: setBedTypeDetail } = bedTypeDetailStore()

    // Remove the local onSearch function and use the utility directly

    const {
      mutate: deleteMutation,
      variables: deleteVariables,
      isPending: isDeleteLoading,
    } = useMutation({
      mutationFn: deleteItem,
      onSuccess: () => {
        antdMessage?.success('Bed type deleted successfully')
        queryClient.invalidateQueries({ queryKey: [queryKey.RES_BED_TYPE_LIST] })
      },
      onError: (res: AxiosError<ApiResponse>) => {
        const errors = res.response?.data?.errors ?? []
        const errorMessages = errors.length ? errors.join(', ') : 'Failed to delete bed type'
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
        fixed: 'left',
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
        width: '20%',
        sorter: (a, b) => a.name.localeCompare(b.name),
        ...getColumnSearchProps({
          initialValue: pageParams.search?.name,
          placeholder: 'Search by name',
          onSearch: (value) => {
            searchByTableColumn({ router, pathname, pageParams, dataIndex: 'search[name]', value })
          },
        }),
      },
      {
        title: 'Length (cm) x Width (cm) x Height (cm)',
        dataIndex: 'length',
        key: 'length',
        width: '30%',
        ...getColumnSearchProps({
          initialValue: pageParams.search?.dimension,
          placeholder: 'exp: length x width x height',
          onSearch: (value) => {
            searchByTableColumn({ router, pathname, pageParams, dataIndex: 'search[dimension]', value })
          },
        }),
        sorter: (a, b) => {
          // Calculate total volume for comparison
          const volumeA = (a.length || 0) * (a.width || 0) * (a.height || 0)
          const volumeB = (b.length || 0) * (b.width || 0) * (b.height || 0)
          return volumeA - volumeB
        },
        render: (_, record) => {
          const length = typeof record.length === 'number' ? record.length : '-'
          const width = typeof record.width === 'number' ? record.width : '-'
          const height = typeof record.height === 'number' ? record.height : '-'

          if (length === '-' && width === '-' && height === '-') return '-'
          return `${length} x ${width} x ${height}`
        },
      },
      {
        title: 'Material',
        dataIndex: 'material',
        key: 'material',
        width: '15%',
        sorter: (a, b) => a.material.localeCompare(b.material),
        ...getColumnSearchProps({
          initialValue: pageParams.search?.material,
          placeholder: 'Search by material',
          onSearch: (value) => {
            searchByTableColumn({ router, pathname, pageParams, dataIndex: 'search[material]', value })
          },
        }),
        render: (_, record) => {
          const material = record.material || '-'
          return <Typography.Paragraph className="!mb-0">{material}</Typography.Paragraph>
        },
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
        width: '10%',
        fixed: 'right',
        render: (_, record) => {
          return (
            <Flex gap={4} align="center" justify="center">
              <Button
                type="text"
                icon={<FaPenToSquare />}
                onClick={() => {
                  setBedTypeDetail(record)
                  onEdit()
                }}
              />
              <Popconfirm
                title="Delete Bed Type"
                description="Are you sure to delete this bed type?"
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
          )
        },
      },
    ]
  }
}
