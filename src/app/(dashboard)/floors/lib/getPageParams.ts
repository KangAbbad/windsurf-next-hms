import { useSearchParams } from 'next/navigation'

import { FloorListPageParams } from '../services/get'

const getPageParamsHoc = () => {
  return () => {
    const searchParams = useSearchParams()
    const searchName = searchParams.get('search[name]') ?? undefined
    const searchNumber = searchParams.get('search[number]') ? Number(searchParams.get('search[number]')) : undefined

    const pageParams: FloorListPageParams = {
      page: Number(searchParams.get('page') ?? 1),
      limit: Number(searchParams.get('limit') ?? 10),
    }

    if (searchName || searchNumber) {
      pageParams.search = {}
      if (searchName) pageParams.search.name = searchName
      if (searchNumber) pageParams.search.number = searchNumber
    }

    return pageParams
  }
}

export const getPageParams = getPageParamsHoc()
