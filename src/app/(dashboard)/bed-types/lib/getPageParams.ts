import { useSearchParams } from 'next/navigation'

import { BedTypeListPageParams } from '../services/get'

export const getPageParams = () => {
  return () => {
    const searchParams = useSearchParams()

    const pageParams: BedTypeListPageParams = {
      page: Number(searchParams.get('page') ?? 1),
      limit: Number(searchParams.get('limit') ?? 10),
      search: {
        name: searchParams.get('search[name]') ?? undefined,
        material: searchParams.get('search[material]') ?? undefined,
      },
    }

    return pageParams
  }
}
