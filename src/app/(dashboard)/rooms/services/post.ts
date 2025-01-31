import { CreateRoomBody, RoomListItem } from '@/app/api/rooms/types'
import { ApiResponse } from '@/services/apiResponse'
import { axiosInstance } from '@/services/axiosInstance'

export const createItem = async (body: CreateRoomBody) => {
  const { data } = await axiosInstance.post<ApiResponse<RoomListItem>>('/rooms', body)
  return data
}
