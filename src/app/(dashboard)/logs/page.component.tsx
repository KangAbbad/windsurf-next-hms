'use client'

import { useQuery } from '@tanstack/react-query'
import { Table } from 'antd'
import { usePathname, useRouter } from 'next/navigation'

import { queryKey } from './lib/constants'
import { getPageParams } from './lib/getPageParams'
import { tableColumns } from './lib/tableColumns'
import { getAll } from './services/get'

import { changePagination } from '@/utils/changeTableFilter'

export default function AddonsPage() {
  const router = useRouter()
  const pathname = usePathname()
  const pageParams = getPageParams()

  const { data: dataSourceResponse, isFetching: isDataSourceFetching } = useQuery({
    queryKey: [queryKey.RES_LOG_LIST, pageParams],
    queryFn: () => getAll(pageParams),
  })
  const { data: dataSourceData } = dataSourceResponse ?? {}
  const { items: dataSource = [], meta: dataSourceMeta } = dataSourceData ?? {}
  const { total } = dataSourceMeta ?? {}

  const columns = tableColumns()()

  return (
    <main className="p-4">
      <div className="pb-0 rounded-lg bg-ant-color-container">
        <div className="p-4 pb-0 mb-4">
          <h1 className="text-2xl font-semibold m-0">Activity Logs</h1>
        </div>
        <Table
          columns={columns}
          dataSource={dataSource}
          loading={isDataSourceFetching}
          rowKey="id"
          size="middle"
          rowClassName="align-top"
          scroll={{ x: 1300 }}
          pagination={{
            current: pageParams.page,
            pageSize: pageParams.limit,
            total,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} items`,
            className: '!px-4',
            onChange: (page, limit) => {
              changePagination({ router, pathname, pageParams, page, limit })
            },
          }}
        />
      </div>
    </main>
  )
}
