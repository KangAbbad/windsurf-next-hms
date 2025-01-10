import { ApiResponse, PaginatedDataResponse } from '@/services/apiResponse'
import { axiosInstance } from '@/services/axiosInstance'
import { RoomClassListItem } from '@/types/room-class'

export const getAllRoomClasses = async () => {
  const { data } = await axiosInstance.get<ApiResponse<PaginatedDataResponse<RoomClassListItem>>>('/room-classes')
  return data
}
