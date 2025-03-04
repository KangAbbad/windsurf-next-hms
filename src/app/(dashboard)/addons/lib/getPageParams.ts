import { useSearchParams } from 'next/navigation'

import { AddonListPageParams } from '../services/get'

import { parseSearchParamsToNumber } from '@/utils/parseSearchParamsToNumber'

const getPageParamsHoc = () => {
  return () => {
    const searchParams = useSearchParams()
    const page = parseSearchParamsToNumber(searchParams.get('page'), 1)
    const limit = parseSearchParamsToNumber(searchParams.get('limit'), 10)
    const searchName = searchParams.get('search[name]')
    const searchPrice = searchParams.get('search[price]')

    const pageParams: AddonListPageParams = { page, limit }

    if (searchName || searchPrice) {
      pageParams.search = {}
      if (searchName) pageParams.search.name = searchName
      if (searchPrice) pageParams.search.price = searchPrice
    }

    return pageParams
  }
}

export const getPageParams = getPageParamsHoc()
