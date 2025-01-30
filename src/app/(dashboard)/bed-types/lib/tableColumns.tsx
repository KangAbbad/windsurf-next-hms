import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Flex, Popconfirm, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { CSSProperties } from 'react'
import { FaPenToSquare, FaTrashCan } from 'react-icons/fa6'

import styles from '../page.module.css'
import { queryKey } from './constants'
import { bedTypeDetailStore } from './state'
import { deleteItem } from '../services/delete'

import { ImageFallback } from '@/components/ImageFallback'
import { useAntdContextHolder } from '@/lib/context/AntdContextHolder'
import { BedTypeListItem } from '@/types/bed-type'

type Props = {
  onEdit: () => void
}

export const tableColumns = (props: Props) => {
  const { onEdit } = props

  return (): ColumnsType<BedTypeListItem> => {
    const queryClient = useQueryClient()
    const { antdMessage } = useAntdContextHolder()
    const { setData: setBedTypeDetail } = bedTypeDetailStore()

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
      onError: () => {
        antdMessage?.error('Failed to delete bed type')
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
            <div className={styles.imagePreviewWrapper}>
              <ImageFallback
                src={imageUrl}
                alt={record?.name ?? 'Image Preview'}
                priority
                height={100}
                width={100}
                className={styles.imagePreview}
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
      },
      {
        title: 'Length (cm) x Width (cm) x Height (cm)',
        dataIndex: 'length',
        key: 'length',
        width: '30%',
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
        width: '10%',
        render: (_, record) => {
          return (
            <Flex gap={4}>
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
