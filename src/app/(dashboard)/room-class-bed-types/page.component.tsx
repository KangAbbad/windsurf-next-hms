'use client'

import { useQuery } from '@tanstack/react-query'
import { Button, Table, Select } from 'antd'
import dynamic from 'next/dynamic'
import { useState } from 'react'
import { FaPlus } from 'react-icons/fa6'

import { queryKey } from './lib/constants'
import { roomClassBedTypeDetailStore } from './lib/state'
import { tableColumns } from './lib/tableColumns'
import { type RoomClassBedTypeListPageParams, getAll } from './services/get'
import { getAllRoomClasses } from './services/getRoomClasses'

const FormModal = dynamic(() => import('./components/FormModal'), {
  ssr: false,
})

export function PageComponent() {
  const [isFormVisible, setFormVisible] = useState<boolean>(false)
  const [pageParams, setPageParams] = useState<RoomClassBedTypeListPageParams>({
    page: 1,
    limit: 10,
    room_class_id: undefined,
  })

  const { resetData: resetRoomClassBedTypeDetail } = roomClassBedTypeDetailStore()

  const { data: roomClassesResponse } = useQuery({
    queryKey: [queryKey.RES_ROOM_CLASS_LIST],
    queryFn: getAllRoomClasses,
  })
  const { data: roomClassesData } = roomClassesResponse ?? {}
  const { items: roomClasses = [] } = roomClassesData ?? {}

  const { data: dataSourceResponse, isFetching: isDataSourceFetching } = useQuery({
    queryKey: [queryKey.RES_ROOM_CLASS_BED_TYPE_LIST, pageParams],
    queryFn: () => getAll(pageParams),
  })
  const { data: dataSourceData } = dataSourceResponse ?? {}
  const { items: dataSource = [], meta: dataSourceMeta } = dataSourceData ?? {}
  const { total } = dataSourceMeta ?? {}

  const showAddModal = () => {
    resetRoomClassBedTypeDetail()
    setFormVisible(true)
  }

  const columns = tableColumns({
    onEdit: () => {
      setFormVisible(true)
    },
  })()

  return (
    <main className="p-4">
      <div className="bg-white p-4 pb-0 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-semibold m-0">Room Class Bed Types Management</h1>
          <Button type="primary" icon={<FaPlus />} onClick={showAddModal}>
            Add New
          </Button>
        </div>
        <div className="mb-4">
          <Select
            allowClear
            placeholder="Filter by room class..."
            className="w-72"
            options={roomClasses.map((roomClass) => ({
              label: roomClass.class_name,
              value: roomClass.id,
            }))}
            onChange={(value) => {
              setPageParams((prev) => ({ ...prev, room_class_id: value }))
            }}
          />
        </div>
        <Table
          columns={columns}
          dataSource={dataSource}
          loading={isDataSourceFetching}
          rowKey={(record) => `${record.bed_type_id}-${record.room_class_id}`}
          pagination={{
            current: pageParams.page,
            pageSize: pageParams.limit,
            total,
            onChange: (page, pageSize) => {
              setPageParams((prev) => ({ ...prev, page, limit: pageSize }))
            },
          }}
        />
      </div>

      <FormModal
        isVisible={isFormVisible}
        onCancel={() => {
          setFormVisible(false)
        }}
      />
    </main>
  )
}
