import { ApiResponse } from '@/services/apiResponse'
import { axiosInstance } from '@/services/axiosInstance'
import { CreateRoomBody, RoomListItem } from '@/types/room'

export const createItem = async (body: CreateRoomBody) => {
  const { data } = await axiosInstance.post<ApiResponse<RoomListItem>>('/rooms', body)
  return data
}
