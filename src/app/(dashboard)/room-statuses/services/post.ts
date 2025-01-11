import type { ApiResponse } from '@/services/apiResponse'
import { axiosInstance } from '@/services/axiosInstance'
import type { CreateRoomStatusBody, RoomStatusListItem } from '@/types/room-status'

export const createItem = async (body: CreateRoomStatusBody) => {
  const { data } = await axiosInstance.post<ApiResponse<RoomStatusListItem>>('/room-statuses', body)
  return data
}
