import { useSearchParams } from 'next/navigation'

import { BedTypeListPageParams } from '../services/get'

import { parseSearchParamsToNumber } from '@/utils/parseSearchParamsToNumber'

const getPageParamsHoc = () => {
  return () => {
    const searchParams = useSearchParams()
    const page = parseSearchParamsToNumber(searchParams.get('page'), 1)
    const limit = parseSearchParamsToNumber(searchParams.get('limit'), 10)
    const searchName = searchParams.get('search[name]')
    const searchMaterial = searchParams.get('search[material]')
    const searchDimension = searchParams.get('search[dimension]')

    const pageParams: BedTypeListPageParams = { page, limit }

    if (searchName || searchMaterial || searchDimension) {
      pageParams.search = {}
      if (searchName) pageParams.search.name = searchName
      if (searchMaterial) pageParams.search.material = searchMaterial
      if (searchDimension) pageParams.search.dimension = searchDimension
    }

    return pageParams
  }
}

export const getPageParams = getPageParamsHoc()
