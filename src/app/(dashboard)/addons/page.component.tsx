'use client'

import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Table, message, Input } from 'antd'
import { useEffect, useState } from 'react'

import { columns } from './columns'
import AddonsForm from './components/AddonsForm'
import { addonsService, type Addon, type PageParams } from './services/addons'

export default function AddonsPage() {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedAddon, setSelectedAddon] = useState<Addon | null>(null)
  const [searchText, setSearchText] = useState('')
  const [pageParams, setPageParams] = useState<PageParams>({
    page: 1,
    limit: 10,
    search: '',
  })

  const { data, isLoading } = useQuery({
    queryKey: ['addons', pageParams],
    queryFn: () => addonsService.getAll(pageParams),
    // keepPreviousData: true,
  })

  const createMutation = useMutation({
    mutationFn: (addon: Omit<Addon, 'id' | 'created_at' | 'updated_at'>) => addonsService.create(addon),
    onSuccess: async () => {
      message.success('Addon created successfully')
      await queryClient.invalidateQueries({ queryKey: ['addons'] })
      setIsModalOpen(false)
    },
    onError: () => {
      message.error('Failed to create addon')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, addon }: { id: string; addon: Partial<Addon> }) => addonsService.update(id, addon),
    onSuccess: () => {
      message.success('Addon updated successfully')
      queryClient.invalidateQueries({ queryKey: ['addons'] })
      setIsModalOpen(false)
    },
    onError: () => {
      message.error('Failed to update addon')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => addonsService.delete(id),
    onSuccess: () => {
      message.success('Addon deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['addons'] })
    },
    onError: () => {
      message.error('Failed to delete addon')
    },
  })

  const handleAdd = () => {
    setSelectedAddon(null)
    setIsModalOpen(true)
  }

  const handleEdit = (record: Addon) => {
    setSelectedAddon(record)
    setIsModalOpen(true)
  }

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id)
  }

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setPageParams((prev) => ({ ...prev, search: searchText }))
    }, 500)

    return () => {
      clearTimeout(delayDebounceFn)
    }
  }, [searchText])

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold m-0">Addons Management</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} loading={createMutation.isPending}>
          Add New
        </Button>
      </div>

      <div className="mb-6">
        <Input
          placeholder="Search addons..."
          prefix={<SearchOutlined className="text-gray-400" />}
          onChange={(e) => {
            setSearchText(e.target.value)
          }}
          className="max-w-md"
          allowClear
        />
      </div>

      <Table
        columns={columns({
          handleEdit,
          handleDelete,
          isDeleting: deleteMutation.isPending,
        })}
        dataSource={data?.addons.map((addon) => ({
          ...addon,
          name: addon.addon_name, // Map addon_name to name for table display
        }))}
        loading={isLoading || deleteMutation.isPending}
        rowKey="id"
        pagination={{
          current: pageParams.page,
          pageSize: pageParams.limit,
          total: data?.pagination.total,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} items`,
          onChange: (page, pageSize) => {
            setPageParams((prev) => ({ ...prev, page, limit: pageSize }))
          },
        }}
      />

      <AddonsForm
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false)
        }}
        onSubmit={(values) => {
          if (selectedAddon) {
            updateMutation.mutate({
              id: selectedAddon.id,
              addon: values,
            })
          } else {
            createMutation.mutate(values)
          }
        }}
        initialValues={selectedAddon}
        loading={createMutation.isPending || updateMutation.isPending}
      />
    </>
  )
}
