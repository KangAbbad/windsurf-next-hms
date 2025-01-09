import { ApiResponse, PaginatedDataResponse } from '@/services/apiResponse'
import { axiosInstance } from '@/services/axiosInstance'
import { BedTypeListItem } from '@/types/bedType'

export type BedTypeListPageParams = {
  page?: number
  limit?: number
  search?: string
}

export const getAll = async (params: BedTypeListPageParams) => {
  const { data } = await axiosInstance.get<ApiResponse<PaginatedDataResponse<BedTypeListItem>>>('/bed-types', {
    params,
  })
  return data
}
