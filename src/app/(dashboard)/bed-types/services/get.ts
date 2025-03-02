import { BedTypeListItem } from '@/app/api/bed-types/types'
import { ApiResponse, PaginatedDataResponse } from '@/services/apiResponse'
import { axiosInstance } from '@/services/axiosInstance'

export type BedTypeListPageParams = {
  page?: number
  limit?: number
  search?: {
    name?: string
    material?: string
    dimension?: string
  }
}

export const getAll = async (params: BedTypeListPageParams) => {
  const { data } = await axiosInstance.get<ApiResponse<PaginatedDataResponse<BedTypeListItem>>>('/bed-types', {
    params,
  })
  return data
}
