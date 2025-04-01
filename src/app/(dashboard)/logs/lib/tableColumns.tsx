import { Flex, Typography } from 'antd'
import { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { usePathname, useRouter } from 'next/navigation'
import { JsonView, allExpanded, darkStyles, defaultStyles } from 'react-json-view-lite'

import { getPageParams } from './getPageParams'

import { LogListItem } from '@/app/api/logs/types'
import { darkModeState } from '@/lib/state/darkMode'
import { searchByTableColumn } from '@/utils/changeTableFilter'
import { getColumnSearchProps } from '@/utils/getColumnSearchProps'

import 'react-json-view-lite/dist/index.css'

export const tableColumns = () => {
  return (): ColumnsType<LogListItem> => {
    const router = useRouter()
    const pathname = usePathname()
    const pageParams = getPageParams()
    const { data: isDarkMode } = darkModeState()

    const jsonViewStyle = isDarkMode ? darkStyles : defaultStyles

    return [
      {
        title: 'Action Type',
        dataIndex: 'action_type',
        key: 'action_type',
        width: '25%',
        fixed: 'left',
        ...getColumnSearchProps({
          initialValue: pageParams.search?.action_type,
          placeholder: 'Search by action type',
          onSearch: (value) => {
            searchByTableColumn({ router, pathname, pageParams, dataIndex: 'search[action_type]', value })
          },
        }),
        sorter: (a, b) => a.action_type.localeCompare(b.action_type),
      },
      {
        title: 'Resource Type',
        dataIndex: 'resource_type',
        key: 'resource_type',
        width: '25%',
        ...getColumnSearchProps({
          initialValue: pageParams.search?.resource_type,
          placeholder: 'Search by resource type',
          onSearch: (value) => {
            searchByTableColumn({ router, pathname, pageParams, dataIndex: 'search[resource_type]', value })
          },
        }),
        sorter: (a, b) => a.resource_type.localeCompare(b.resource_type),
      },
      {
        title: 'Changes',
        dataIndex: 'changes',
        key: 'changes',
        width: '25%',
        render: (_, record) => {
          const changes = record?.changes || {}
          return <JsonView data={changes} shouldExpandNode={allExpanded} style={jsonViewStyle} />
        },
      },
      {
        title: 'Metadata',
        dataIndex: 'metadata',
        key: 'metadata',
        width: '25%',
        render: (_, record) => {
          const metadata = record?.metadata || {}
          return <JsonView data={metadata} shouldExpandNode={allExpanded} style={jsonViewStyle} />
        },
      },
      {
        title: 'Time',
        dataIndex: 'created_at',
        key: 'created_at',
        width: '15%',
        fixed: 'right',
        sorter: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        render: (_, record) => {
          const createdAt = record.created_at ? dayjs(record.created_at).format('DD MMM YYYY, HH:mm') : '-'
          return (
            <Flex gap={4} vertical>
              <Typography.Paragraph className="font-semibold !mb-0">Created At</Typography.Paragraph>
              <Typography.Paragraph className="!mb-0">{createdAt}</Typography.Paragraph>
            </Flex>
          )
        },
      },
    ]
  }
}
