import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Popconfirm, Space, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { FaPenToSquare, FaTrashCan } from 'react-icons/fa6'

import { queryKey } from './constants'
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
        title: 'Name',
        dataIndex: 'payment_status_name',
        key: 'payment_status_name',
        width: '60%',
        sorter: (a, b) => a.payment_status_name.localeCompare(b.payment_status_name),
        render: (_, record) => {
          const statusColor: { [key: number]: string } = {
            1: 'green',
            2: 'orange',
            3: 'red',
            4: 'blue',
          }
          return <Tag color={statusColor[record.payment_status_number] ?? 'default'}>{record.payment_status_name}</Tag>
        },
      },
      {
        title: 'Created At',
        dataIndex: 'created_at',
        key: 'created_at',
        width: '30%',
        sorter: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        render: (date) => {
          return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })
        },
      },
      {
        title: 'Actions',
        key: 'actions',
        width: '10%',
        align: 'center',
        render: (_, record) => (
          <Space>
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
          </Space>
        ),
      },
    ]
  }
}
