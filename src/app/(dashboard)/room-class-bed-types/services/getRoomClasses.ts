import { ApiResponse, PaginatedDataResponse } from '@/services/apiResponse'
import { axiosInstance } from '@/services/axiosInstance'
import { RoomClass } from '@/types/room-class'

export const getAllRoomClasses = async () => {
  const { data } = await axiosInstance.get<ApiResponse<PaginatedDataResponse<RoomClass>>>('/room-classes')
  return data
}
