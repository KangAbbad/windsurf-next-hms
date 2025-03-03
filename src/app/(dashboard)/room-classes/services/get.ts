import type { RoomClassListItem } from '@/app/api/room-classes/types'
import { ApiResponse, PaginatedDataResponse } from '@/services/apiResponse'
import { axiosInstance } from '@/services/axiosInstance'

export type RoomClassListPageParams = {
  page?: number
  limit?: number
  search?: {
    name?: string
    price?: string
    feature?: string
    bed_type?: string
  }
}

export const getAll = async (params: RoomClassListPageParams) => {
  const { data } = await axiosInstance.get<ApiResponse<PaginatedDataResponse<RoomClassListItem>>>('/room-classes', {
    params,
  })
  return data
}
