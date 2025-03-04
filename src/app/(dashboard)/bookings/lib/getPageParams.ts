import { useSearchParams } from 'next/navigation'

import { BookingListPageParams } from '../services/get'

import { parseSearchParamsToNumber } from '@/utils/parseSearchParamsToNumber'

const getPageParamsHoc = () => {
  return () => {
    const searchParams = useSearchParams()
    const page = parseSearchParamsToNumber(searchParams.get('page'), 1)
    const limit = parseSearchParamsToNumber(searchParams.get('limit'), 10)
    const searchGuest = searchParams.get('search[guest]')
    const searchAmount = searchParams.get('search[amount]')

    const pageParams: BookingListPageParams = { page, limit }

    if (searchGuest || searchAmount) {
      pageParams.search = {}
      if (searchGuest) pageParams.search.guest = searchGuest
      if (searchAmount) pageParams.search.amount = searchAmount
    }

    return pageParams
  }
}

export const getPageParams = getPageParamsHoc()
