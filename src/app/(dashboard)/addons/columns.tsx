import { DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { Button, Popconfirm, Space } from 'antd'
import type { ColumnsType } from 'antd/es/table'

import { type Addon } from '@/app/(dashboard)/addons/services/addons'

interface ColumnProps {
  handleEdit: (record: Addon) => void
  handleDelete: (id: string) => void
  isDeleting: boolean
}

export const columns = ({ handleEdit, handleDelete, isDeleting }: ColumnProps): ColumnsType<Addon> => [
  {
    title: 'Name',
    dataIndex: 'addon_name',
    key: 'addon_name',
    sorter: (a, b) => a.addon_name.localeCompare(b.addon_name),
    width: '30%',
  },
  {
    title: 'Price',
    dataIndex: 'price',
    key: 'price',
    render: (price) => (
      <span className="font-medium">
        ${Number(price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
    ),
    sorter: (a, b) => a.price - b.price,
    width: '30%',
  },
  {
    title: 'Created At',
    dataIndex: 'created_at',
    key: 'created_at',
    render: (date) => {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    },
    sorter: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    width: '30%',
  },
  {
    title: 'Actions',
    key: 'actions',
    render: (_, record) => (
      <Space>
        <Button
          type="text"
          icon={<EditOutlined />}
          onClick={() => {
            handleEdit(record)
          }}
        />
        <Popconfirm
          title="Delete addon"
          description="Are you sure you want to delete this addon?"
          onConfirm={() => {
            handleDelete(record.id)
          }}
          okText="Yes"
          cancelText="No"
        >
          <Button type="text" danger icon={<DeleteOutlined />} loading={isDeleting} />
        </Popconfirm>
      </Space>
    ),
    width: '10%',
    align: 'center' as const,
  },
]
