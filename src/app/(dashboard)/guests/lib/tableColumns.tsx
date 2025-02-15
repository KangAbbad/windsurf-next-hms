import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Flex, Popconfirm, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { FaPenToSquare, FaTrashCan } from 'react-icons/fa6'

import { queryKey } from './constants'
import { guestDetailStore } from './state'
import { deleteItem } from '../services/delete'

import { GuestListItem } from '@/app/api/guests/types'
import { useAntdContextHolder } from '@/lib/context/AntdContextHolder'

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
        title: 'Name',
        dataIndex: 'name',
        key: 'name',
        width: 225,
        fixed: 'left',
        sorter: (a, b) => a.name.localeCompare(b.name),
      },
      {
        title: 'ID Card Number',
        dataIndex: 'id_card_number',
        key: 'id_card_number',
        width: 225,
        sorter: (a, b) => a.id_card_number.localeCompare(b.id_card_number),
      },
      {
        title: 'ID Card Type',
        dataIndex: 'id_card_type',
        key: 'id_card_type',
        width: 260,
        sorter: (a, b) => a.id_card_type.localeCompare(b.id_card_type),
        render: (_, record) => {
          const idCardType = record.id_card_type.replace(/_/g, ' ')
          const tagsColor = {
            NATIONAL_IDENTITY_CARD: 'blue',
            PASSPORT: 'green',
            PERMANENT_RESIDENCE_PERMIT: 'purple',
            TEMPORARY_STAY_PERMIT: 'purple',
            DRIVING_LICENSE: 'orange',
          }
          return <Tag color={tagsColor[record.id_card_type]}>{idCardType}</Tag>
        },
      },
      {
        title: 'Nationality',
        dataIndex: 'nationality',
        key: 'nationality',
        width: 225,
        sorter: (a, b) => a.nationality.localeCompare(b.nationality),
        render: (_, record) => {
          const nationality = record.nationality.replace(/_/g, ' ')
          const tagsColor = {
            INDONESIAN_CITIZEN: 'blue',
            FOREIGNER: 'green',
          }
          return <Tag color={tagsColor[record.nationality]}>{nationality}</Tag>
        },
      },
      {
        title: 'Email',
        dataIndex: 'email',
        key: 'email',
        width: 225,
        sorter: (a, b) => a.email.localeCompare(b.email),
        render: (_, record) => record.email || '-',
      },
      {
        title: 'Phone',
        dataIndex: 'phone',
        key: 'phone',
        width: 175,
        sorter: (a, b) => a.phone.localeCompare(b.phone),
      },
      {
        title: 'Address',
        dataIndex: 'address',
        key: 'address',
        width: 250,
        sorter: (a, b) => a.address.localeCompare(b.address),
        render: (_, record) => record.address || '-',
      },
      {
        title: 'Actions',
        key: 'actions',
        width: 125,
        align: 'center',
        fixed: 'right',
        render: (_, record) => (
          <Flex gap={4} align="center" justify="center">
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
          </Flex>
        ),
      },
    ]
  }
}
