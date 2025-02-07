'use client'

import { useQuery } from '@tanstack/react-query'
import { Button, Table, Input } from 'antd'
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { FaPlus } from 'react-icons/fa6'
import { IoSearch } from 'react-icons/io5'

import { queryKey } from './lib/constants'
import { floorDetailStore } from './lib/state'
import { tableColumns } from './lib/tableColumns'
import { type FloorListPageParams, getAll } from './services/get'

const FormDrawer = dynamic(() => import('./components/FormDrawer'), {
  ssr: false,
})

export default function FloorsPage() {
  const [isFormVisible, setFormVisible] = useState<boolean>(false)
  const [keyword, setKeyword] = useState<string>('')
  const [pageParams, setPageParams] = useState<FloorListPageParams>({
    page: 1,
    limit: 10,
    search: undefined,
  })

  const { resetData: resetFloorDetail } = floorDetailStore()

  const { data: dataSourceResponse, isFetching: isDataSourceFetching } = useQuery({
    queryKey: [queryKey.RES_FLOOR_LIST, pageParams],
    queryFn: () => getAll(pageParams),
  })
  const { data: dataSourceData } = dataSourceResponse ?? {}
  const { items: dataSource = [], meta: dataSourceMeta } = dataSourceData ?? {}
  const { total } = dataSourceMeta ?? {}

  const showAddModal = () => {
    resetFloorDetail()
    setFormVisible(true)
  }

  const columns = tableColumns({
    onEdit: () => {
      setFormVisible(true)
    },
  })()

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setPageParams((prev) => ({ ...prev, search: keyword }))
    }, 500)

    return () => {
      clearTimeout(delayDebounceFn)
    }
  }, [keyword])

  return (
    <main className="p-4">
      <div className="bg-white pb-0 rounded-lg">
        <div className="flex justify-between items-center p-4 pb-0 mb-4">
          <h1 className="text-2xl font-semibold m-0">Floors Management</h1>
          <Button type="primary" icon={<FaPlus />} onClick={showAddModal}>
            Add New
          </Button>
        </div>
        <div className="px-4 mb-4">
          <Input
            allowClear
            placeholder="Search floors..."
            size="middle"
            prefix={<IoSearch />}
            className="max-w-md"
            onChange={(e) => {
              setKeyword(e.target.value)
            }}
          />
        </div>
        <Table
          columns={columns}
          dataSource={dataSource}
          loading={isDataSourceFetching}
          rowKey="id"
          size="middle"
          pagination={{
            current: pageParams.page,
            pageSize: pageParams.limit,
            total,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} items`,
            className: '!px-4',
            onChange: (page, pageSize) => {
              setPageParams((prev) => ({ ...prev, page, limit: pageSize }))
            },
          }}
        />
      </div>

      <FormDrawer
        isVisible={isFormVisible}
        onCancel={() => {
          setFormVisible(false)
        }}
      />
    </main>
  )
}
