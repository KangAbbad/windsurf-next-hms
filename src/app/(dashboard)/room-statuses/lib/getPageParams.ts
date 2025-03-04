import { useSearchParams } from 'next/navigation'

import { RoomStatusListPageParams } from '../services/get'

import { parseSearchParamsToNumber } from '@/utils/parseSearchParamsToNumber'

const getPageParamsHoc = () => {
  return () => {
    const searchParams = useSearchParams()
    const page = parseSearchParamsToNumber(searchParams.get('page'), 1)
    const limit = parseSearchParamsToNumber(searchParams.get('limit'), 10)

    const pageParams: RoomStatusListPageParams = { page, limit }

    return pageParams
  }
}

export const getPageParams = getPageParamsHoc()
