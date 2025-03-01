import { useSearchParams } from 'next/navigation'

import { BedTypeListPageParams } from '../services/get'

const getPageParamsHoc = () => {
  return () => {
    const searchParams = useSearchParams()
    const searchName = searchParams.get('search[name]') ?? undefined
    const searchMaterial = searchParams.get('search[material]') ?? undefined

    const pageParams: BedTypeListPageParams = {
      page: Number(searchParams.get('page') ?? 1),
      limit: Number(searchParams.get('limit') ?? 10),
    }

    if (searchName || searchMaterial) {
      pageParams.search = {}
      if (searchName) pageParams.search.name = searchName
      if (searchMaterial) pageParams.search.material = searchMaterial
    }

    return pageParams
  }
}

export const getPageParams = getPageParamsHoc()
