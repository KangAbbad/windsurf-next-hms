import { useSearchParams } from 'next/navigation'

import { AddonListPageParams } from '../services/get'

const getPageParamsHoc = () => {
  return () => {
    const searchParams = useSearchParams()
    const searchName = searchParams.get('search[name]') ?? undefined
    const searchPrice = searchParams.get('search[price]') ?? undefined

    const pageParams: AddonListPageParams = {
      page: Number(searchParams.get('page') ?? 1),
      limit: Number(searchParams.get('limit') ?? 10),
    }

    if (searchName || searchPrice) {
      pageParams.search = {}
      if (searchName) pageParams.search.name = searchName
      if (searchPrice) pageParams.search.price = searchPrice
    }

    return pageParams
  }
}

export const getPageParams = getPageParamsHoc()
