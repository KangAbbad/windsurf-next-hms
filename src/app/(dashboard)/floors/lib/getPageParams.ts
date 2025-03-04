import { useSearchParams } from 'next/navigation'

import { FloorListPageParams } from '../services/get'

import { parseSearchParamsToNumber } from '@/utils/parseSearchParamsToNumber'

const getPageParamsHoc = () => {
  return () => {
    const searchParams = useSearchParams()
    const page = parseSearchParamsToNumber(searchParams.get('page'), 1)
    const limit = parseSearchParamsToNumber(searchParams.get('limit'), 10)
    const searchName = searchParams.get('search[name]')
    const searchNumber = searchParams.get('search[number]') ? Number(searchParams.get('search[number]')) : undefined

    const pageParams: FloorListPageParams = { page, limit }

    if (searchName || searchNumber) {
      pageParams.search = {}
      if (searchName) pageParams.search.name = searchName
      if (searchNumber) pageParams.search.number = searchNumber
    }

    return pageParams
  }
}

export const getPageParams = getPageParamsHoc()
