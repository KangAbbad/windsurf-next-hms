import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Flex, Popconfirm, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { FaPenToSquare, FaTrashCan } from 'react-icons/fa6'

import { paymentStatusTagColor, queryKey } from './constants'
import { paymentStatusDetailStore } from './state'
import { deleteItem } from '../services/delete'

import { PaymentStatusListItem } from '@/app/api/payment-statuses/types'
import { useAntdContextHolder } from '@/lib/context/AntdContextHolder'

type Props = {
  onEdit: () => void
}

export const tableColumns = (props: Props) => {
  const { onEdit } = props

  return (): ColumnsType<PaymentStatusListItem> => {
    const queryClient = useQueryClient()
    const { antdMessage } = useAntdContextHolder()
    const { setData: setPaymentStatusDetail } = paymentStatusDetailStore()

    const {
      mutate: deleteMutation,
      variables: deleteVariables,
      isPending: isDeleteLoading,
    } = useMutation({
      mutationFn: deleteItem,
      onSuccess: () => {
        antdMessage?.success('Payment status deleted successfully')
        queryClient.invalidateQueries({ queryKey: [queryKey.RES_PAYMENT_STATUS_LIST] })
      },
      onError: () => {
        antdMessage?.error('Failed to delete payment status')
      },
    })

    const onDelete = (id: string) => {
      if (isDeleteLoading) return
      deleteMutation(id)
    }

    return [
      {
        title: 'Number',
        dataIndex: 'number',
        key: 'number',
        width: '30%',
        sorter: (a, b) => a.number - b.number,
      },
      {
        title: 'Name',
        dataIndex: 'name',
        key: 'name',
        width: '30%',
        sorter: (a, b) => a.name.localeCompare(b.name),
        render: (_, record) => {
          return <Tag color={paymentStatusTagColor[record.name] ?? 'default'}>{record.name}</Tag>
        },
      },
      {
        title: 'Time',
        dataIndex: 'created_at',
        key: 'created_at',
        width: '20%',
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
        render: (_, record) => (
          <Flex gap={4} align="center" justify="center">
            <Button
              type="text"
              icon={<FaPenToSquare />}
              onClick={() => {
                setPaymentStatusDetail(record)
                onEdit()
              }}
            />
            <Popconfirm
              title="Delete payment status"
              description="Are you sure you want to delete this payment status?"
              placement="leftTop"
              okText="Yes"
              okType="danger"
              cancelText="No"
              onConfirm={() => {
                onDelete(record.id)
              }}
              disabled={isDeleteLoading && deleteVariables === record.id}
            >
              <Button
                type="text"
                danger
                icon={<FaTrashCan />}
                loading={isDeleteLoading && deleteVariables === record.id}
              />
            </Popconfirm>
          </Flex>
        ),
      },
    ]
  }
}
