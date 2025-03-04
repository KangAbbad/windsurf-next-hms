'use client'

import { useQuery } from '@tanstack/react-query'
import { Button, Table, theme } from 'antd'
import dynamic from 'next/dynamic'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { FaPlus } from 'react-icons/fa6'

import { queryKey } from './lib/constants'
import { getPageParams } from './lib/getPageParams'
import { bedTypeDetailStore } from './lib/state'
import { tableColumns } from './lib/tableColumns'
import { getAll } from './services/get'

import { changePagination } from '@/utils/changeTableFilter'

const FormDrawer = dynamic(() => import('./components/FormDrawer'), {
  ssr: false,
})

export default function BedTypesPage() {
  const router = useRouter()
  const pathname = usePathname()
  const { token } = theme.useToken()
  const { colorBgContainer } = token
  const pageParams = getPageParams()

  const [isFormVisible, setFormVisible] = useState<boolean>(false)

  const { resetData: resetBedTypeDetail } = bedTypeDetailStore()

  const { data: dataSourceResponse, isFetching: isDataSourceFetching } = useQuery({
    queryKey: [queryKey.RES_BED_TYPE_LIST, pageParams],
    queryFn: () => getAll(pageParams),
  })
  const { data: dataSourceData } = dataSourceResponse ?? {}
  const { items: dataSource = [], meta: dataSourceMeta } = dataSourceData ?? {}
  const { total } = dataSourceMeta ?? {}

  const showAddModal = () => {
    resetBedTypeDetail()
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
          <h1 className="text-2xl font-semibold m-0">Bed Types Management</h1>
          <Button type="primary" icon={<FaPlus />} onClick={showAddModal}>
            Add Bed Type
          </Button>
        </div>
        <Table
          columns={columns}
          dataSource={dataSource}
          loading={isDataSourceFetching}
          rowKey="id"
          size="middle"
          sticky
          rowClassName="align-top"
          scroll={{ x: 998 }}
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

      <FormDrawer
        isVisible={isFormVisible}
        onCancel={() => {
          setFormVisible(false)
        }}
      />
    </main>
  )
}
