import { useSearchParams } from 'next/navigation'

import { RoomClassListPageParams } from '../services/get'

const getPageParamsHoc = () => {
  return () => {
    const searchParams = useSearchParams()
    const searchName = searchParams.get('search[name]') ?? undefined
    const searchPrice = searchParams.get('search[price]') ?? undefined
    const searchBedType = searchParams.get('search[bed_type]') ?? undefined

    const pageParams: RoomClassListPageParams = {
      page: Number(searchParams.get('page') ?? 1),
      limit: Number(searchParams.get('limit') ?? 10),
    }

    if (searchName || searchPrice || searchBedType) {
      pageParams.search = {}
      if (searchName) pageParams.search.name = searchName
      if (searchPrice) pageParams.search.price = searchPrice
      if (searchBedType) pageParams.search.bed_type = searchBedType
    }

    return pageParams
  }
}

export const getPageParams = getPageParamsHoc()
