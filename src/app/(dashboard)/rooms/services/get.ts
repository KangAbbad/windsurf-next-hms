import { ApiResponse, PaginatedDataResponse } from '@/services/apiResponse'
import { axiosInstance } from '@/services/axiosInstance'
import { RoomListItem } from '@/types/room'

export type RoomListPageParams = {
  page?: number
  limit?: number
  search?: string
}

export const getAll = async (params: RoomListPageParams) => {
  const { data } = await axiosInstance.get<ApiResponse<PaginatedDataResponse<RoomListItem>>>('/rooms', { params })
  return data
}

export const getById = async (id: string) => {
  const { data } = await axiosInstance.get<ApiResponse<RoomListItem>>(`/rooms/${id}`)
  return data
}
