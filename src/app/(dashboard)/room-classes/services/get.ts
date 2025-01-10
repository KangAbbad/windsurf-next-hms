import { ApiResponse, PaginatedDataResponse } from '@/services/apiResponse'
import { axiosInstance } from '@/services/axiosInstance'
import type { RoomClassListItem } from '@/types/room-class'

export type RoomClassListPageParams = {
  page?: number
  limit?: number
  search?: string
}

export const getAll = async (params: RoomClassListPageParams) => {
  const { data } = await axiosInstance.get<ApiResponse<PaginatedDataResponse<RoomClassListItem>>>('/room-classes', {
    params,
  })
  return data
}
