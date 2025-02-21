'use client'

import { useQuery } from '@tanstack/react-query'
import { Button, Table, Input, DatePicker, Flex } from 'antd'
import type { RangePickerProps } from 'antd/es/date-picker'
import dayjs from 'dayjs'
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { FaPlus } from 'react-icons/fa6'
import { IoSearch } from 'react-icons/io5'

import { defaultPageSize, queryKey } from './lib/constants'
import { bookingDetailStore } from './lib/state'
import { tableColumns } from './lib/tableColumns'
import { type BookingListPageParams, getAll } from './services/get'

const FormDrawer = dynamic(() => import('./components/FormDrawer'), {
  ssr: false,
})

const { RangePicker } = DatePicker

export default function BookingsPage() {
  const [isFormVisible, setFormVisible] = useState<boolean>(false)
  const [keyword, setKeyword] = useState<string>('')
  const [dates, setDates] = useState<[string?, string?]>([undefined, undefined])
  const [pageParams, setPageParams] = useState<BookingListPageParams>({
    page: 1,
    limit: defaultPageSize,
    search: undefined,
    startDate: undefined,
    endDate: undefined,
  })

  const { resetData: resetBookingDetail } = bookingDetailStore()

  const { data: dataSourceResponse, isFetching: isDataSourceFetching } = useQuery({
    queryKey: [queryKey.RES_BOOKING_LIST, pageParams],
    queryFn: () => getAll(pageParams),
  })
  const { data: dataSourceData } = dataSourceResponse ?? {}
  const { items: dataSource = [], meta: dataSourceMeta } = dataSourceData ?? {}
  const { total } = dataSourceMeta ?? {}

  const showAddModal = () => {
    resetBookingDetail()
    setFormVisible(true)
  }

  const columns = tableColumns({
    onEdit: () => {
      setFormVisible(true)
    },
  })()

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setPageParams((prev) => ({
        ...prev,
        search: keyword,
        startDate: dates[0],
        endDate: dates[1],
      }))
    }, 500)

    return () => {
      clearTimeout(delayDebounceFn)
    }
  }, [keyword, dates])

  const disabledDate: RangePickerProps['disabledDate'] = (current) => {
    return current && current < dayjs().startOf('day')
  }

  return (
    <main className="p-4">
      <div className="bg-white pb-0 rounded-lg">
        <div className="flex justify-between items-center p-4 pb-0 mb-4">
          <h1 className="text-2xl font-semibold m-0">Bookings Management</h1>
          <Button type="primary" icon={<FaPlus />} onClick={showAddModal}>
            Add New
          </Button>
        </div>
        <Flex gap={8} className="px-4 mb-4">
          <Input
            allowClear
            placeholder="Search by guest name or email..."
            size="middle"
            prefix={<IoSearch />}
            className="max-w-md"
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value)
            }}
          />
          <RangePicker
            allowClear
            format="YYYY-MM-DD"
            disabledDate={disabledDate}
            onChange={(_, dateStrings) => {
              setDates(dateStrings)
            }}
          />
        </Flex>
        <Table
          columns={columns}
          dataSource={dataSource}
          loading={isDataSourceFetching}
          rowKey="id"
          scroll={{ x: 1300 }}
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
