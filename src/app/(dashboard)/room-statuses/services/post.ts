import type { CreateRoomStatusBody, RoomStatusListItem } from '@/app/api/room-statuses/types'
import type { ApiResponse } from '@/services/apiResponse'
import { axiosInstance } from '@/services/axiosInstance'

export const createItem = async (body: CreateRoomStatusBody) => {
  const { data } = await axiosInstance.post<ApiResponse<RoomStatusListItem>>('/room-statuses', body)
  return data
}
