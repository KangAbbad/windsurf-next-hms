import { useSearchParams } from 'next/navigation'

import { RoomClassListPageParams } from '../services/get'

import { parseSearchParamsToNumber } from '@/utils/parseSearchParamsToNumber'

const getPageParamsHoc = () => {
  return () => {
    const searchParams = useSearchParams()
    const page = parseSearchParamsToNumber(searchParams.get('page'), 1)
    const limit = parseSearchParamsToNumber(searchParams.get('limit'), 10)
    const searchName = searchParams.get('search[name]')
    const searchPrice = searchParams.get('search[price]')
    const searchBedType = searchParams.get('search[bed_type]')
    const searchFeature = searchParams.get('search[feature]')

    const pageParams: RoomClassListPageParams = { page, limit }

    if (searchName || searchPrice || searchBedType || searchFeature) {
      pageParams.search = {}
      if (searchName) pageParams.search.name = searchName
      if (searchPrice) pageParams.search.price = searchPrice
      if (searchBedType) pageParams.search.bed_type = searchBedType
      if (searchFeature) pageParams.search.feature = searchFeature
    }

    return pageParams
  }
}

export const getPageParams = getPageParamsHoc()
