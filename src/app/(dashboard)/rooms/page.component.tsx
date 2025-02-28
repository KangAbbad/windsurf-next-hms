'use client'

import { useQuery } from '@tanstack/react-query'
import { Button, Table, theme } from 'antd'
import dynamic from 'next/dynamic'
import { useState } from 'react'
import { FaPlus } from 'react-icons/fa6'

import { queryKey } from './lib/constants'
import { roomDetailStore } from './lib/state'
import { tableColumns } from './lib/tableColumns'
import { type RoomListPageParams, getAll } from './services/get'

const FormDrawer = dynamic(() => import('./components/FormDrawer'), {
  ssr: false,
})

export default function RoomsPage() {
  const { token } = theme.useToken()
  const { colorBgContainer } = token
  const [isFormVisible, setFormVisible] = useState<boolean>(false)
  const [pageParams, setPageParams] = useState<RoomListPageParams>({
    page: 1,
    limit: 10,
    search: undefined,
  })

  const { resetData: resetRoomDetail } = roomDetailStore()

  const { data: dataSourceResponse, isFetching: isDataSourceFetching } = useQuery({
    queryKey: [queryKey.RES_ROOM_LIST, pageParams],
    queryFn: () => getAll(pageParams),
  })
  const { data: dataSourceData } = dataSourceResponse ?? {}
  const { items: dataSource = [], meta: dataSourceMeta } = dataSourceData ?? {}
  const { total } = dataSourceMeta ?? {}

  const showAddModal = () => {
    resetRoomDetail()
    setFormVisible(true)
  }

  const columns = tableColumns({
    onEdit: () => {
      setFormVisible(true)
    },
  })()

  return (
    <main className="p-4">
      <div className="pb-0 rounded-lg" style={{ backgroundColor: colorBgContainer }}>
        <div className="flex justify-between items-center p-4 pb-0 mb-4">
          <h1 className="text-2xl font-semibold m-0">Rooms Management</h1>
          <Button type="primary" icon={<FaPlus />} onClick={showAddModal}>
            Add New
          </Button>
        </div>
        <Table
          columns={columns}
          dataSource={dataSource}
          loading={isDataSourceFetching}
          rowKey="id"
          size="middle"
          rowClassName="align-top"
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
        <FormDrawer
          isVisible={isFormVisible}
          onCancel={() => {
            setFormVisible(false)
          }}
        />
      </div>
    </main>
  )
}
