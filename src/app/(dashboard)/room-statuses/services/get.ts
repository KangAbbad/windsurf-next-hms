import type { ApiResponse, PaginatedDataResponse } from '@/services/apiResponse'
import { axiosInstance } from '@/services/axiosInstance'
import type { RoomStatusListItem } from '@/types/room-status'

export type RoomStatusListPageParams = {
  page?: number
  limit?: number
  search?: string
}

export const getAll = async (params: RoomStatusListPageParams) => {
  const { data } = await axiosInstance.get<ApiResponse<PaginatedDataResponse<RoomStatusListItem>>>('/room-statuses', {
    params,
  })
  return data
}
