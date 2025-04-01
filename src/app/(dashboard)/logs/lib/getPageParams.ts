import { useSearchParams } from 'next/navigation'

import { LogListPageParams } from '../services/get'

import { parseSearchParamsToNumber } from '@/utils/parseSearchParamsToNumber'

const getPageParamsHoc = () => {
  return () => {
    const searchParams = useSearchParams()
    const page = parseSearchParamsToNumber(searchParams.get('page'), 1)
    const limit = parseSearchParamsToNumber(searchParams.get('limit'), 10)
    const searchActionType = searchParams.get('search[action_type]')
    const searchResourceType = searchParams.get('search[resource_type]')

    const pageParams: LogListPageParams = { page, limit }

    if (searchActionType || searchResourceType) {
      pageParams.search = {}
      if (searchActionType) pageParams.search.action_type = searchActionType
      if (searchResourceType) pageParams.search.resource_type = searchResourceType
    }

    return pageParams
  }
}

export const getPageParams = getPageParamsHoc()
