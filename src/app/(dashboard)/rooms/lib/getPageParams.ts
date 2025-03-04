import { useSearchParams } from 'next/navigation'

import { RoomListPageParams } from '../services/get'

import { parseSearchParamsToNumber } from '@/utils/parseSearchParamsToNumber'

const getPageParamsHoc = () => {
  return () => {
    const searchParams = useSearchParams()
    const page = parseSearchParamsToNumber(searchParams.get('page'), 1)
    const limit = parseSearchParamsToNumber(searchParams.get('limit'), 10)
    const searchNumber = parseSearchParamsToNumber(searchParams.get('search[number'))

    const pageParams: RoomListPageParams = { page, limit }

    if (searchNumber) {
      pageParams.search = {}
      if (searchNumber) pageParams.search.number = searchNumber
    }

    return pageParams
  }
}
export const getPageParams = getPageParamsHoc()
