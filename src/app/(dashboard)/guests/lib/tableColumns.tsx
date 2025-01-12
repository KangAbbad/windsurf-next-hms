import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Popconfirm, Space } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { FaPenToSquare, FaTrashCan } from 'react-icons/fa6'

import { queryKey } from './constants'
import { guestDetailStore } from './state'
import { deleteItem } from '../services/delete'

import { useAntdContextHolder } from '@/lib/context/AntdContextHolder'
import { GuestListItem } from '@/types/guest'

type Props = {
  onEdit: () => void
}

export const tableColumns = (props: Props) => {
  const { onEdit } = props

  return (): ColumnsType<GuestListItem> => {
    const queryClient = useQueryClient()
    const { antdMessage } = useAntdContextHolder()
    const { setData: setGuestDetail } = guestDetailStore()

    const {
      mutate: deleteMutation,
      variables: deleteVariables,
      isPending: isDeleteLoading,
    } = useMutation({
      mutationFn: deleteItem,
      onSuccess: () => {
        antdMessage?.success('Guest deleted successfully')
        queryClient.invalidateQueries({ queryKey: [queryKey.RES_GUEST_LIST] })
      },
      onError: () => {
        antdMessage?.error('Failed to delete guest')
      },
    })

    const onDelete = (id: string) => {
      if (isDeleteLoading) return
      deleteMutation(id)
    }

    return [
      {
        title: 'First Name',
        dataIndex: 'first_name',
        key: 'first_name',
        width: '20%',
        sorter: (a, b) => a.first_name.localeCompare(b.first_name),
      },
      {
        title: 'Last Name',
        dataIndex: 'last_name',
        key: 'last_name',
        width: '20%',
        sorter: (a, b) => a.last_name.localeCompare(b.last_name),
      },
      {
        title: 'Email',
        dataIndex: 'email_address',
        key: 'email_address',
        width: '25%',
        sorter: (a, b) => a.email_address.localeCompare(b.email_address),
      },
      {
        title: 'Phone',
        dataIndex: 'phone_number',
        key: 'phone_number',
        width: '20%',
        sorter: (a, b) => a.phone_number.localeCompare(b.phone_number),
      },
      {
        title: 'Actions',
        key: 'actions',
        width: '15%',
        align: 'center',
        render: (_, record) => (
          <Space>
            <Button
              type="text"
              icon={<FaPenToSquare />}
              onClick={() => {
                setGuestDetail(record)
                onEdit()
              }}
            />
            <Popconfirm
              title="Delete guest"
              description="Are you sure you want to delete this guest?"
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
          </Space>
        ),
      },
    ]
  }
}
