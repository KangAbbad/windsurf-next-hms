import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'

import { createUrlSearchParams, Params } from './createUrlSearchParams'

type Props = {
  router: AppRouterInstance
  url: string
  pageParams: Params
}

const changeTableFilterHoc = () => {
  return (props: Props) => {
    const { router, url, pageParams } = props

    const newPageParams: Record<string, any> = {}

    // Step 1: Process and transform parameters
    Object.entries(pageParams).forEach(([key, value]) => {
      const nestedMatch = key.match(/^(\w+)\[(\w+)\]$/)
      if (nestedMatch) {
        const [, parentKey, childKey] = nestedMatch
        if (!newPageParams[parentKey]) {
          newPageParams[parentKey] = {}
        }

        newPageParams[parentKey][childKey] = value
      } else {
        newPageParams[key] = value
      }
    })

    // Step 2: Remove undefined or null values
    Object.keys(newPageParams).forEach((key) => {
      if (newPageParams[key] === undefined || newPageParams[key] === null) {
        delete newPageParams[key]
      } else if (typeof newPageParams[key] === 'object' && newPageParams[key] !== null) {
        // Handle nested objects
        Object.keys(newPageParams[key]).forEach((nestedKey) => {
          if (newPageParams[key][nestedKey] === undefined || newPageParams[key][nestedKey] === null) {
            delete newPageParams[key][nestedKey]
          }
        })

        // Remove empty objects
        if (Object.keys(newPageParams[key]).length === 0) {
          delete newPageParams[key]
        }
      }
    })

    router.replace(`${url}?${createUrlSearchParams(newPageParams)}`)
  }
}

export const changeTableFilter = changeTableFilterHoc()

type SearchByTableColumnProps<T> = {
  router: AppRouterInstance
  url: string
  pageParams: T
  dataIndex: string
  value?: string
}

export const searchByTableColumn = <T extends Params>(props: SearchByTableColumnProps<T>) => {
  const { router, url, pageParams, dataIndex, value } = props
  const newPageParams: T = {
    ...pageParams,
    [dataIndex]: value,
  }
  changeTableFilter({ router, url, pageParams: newPageParams })
}
