import type { ApiResponse } from '@/services/apiResponse'
import { axiosInstance } from '@/services/axiosInstance'
import type { RoomStatusListItem, UpdateRoomStatusBody } from '@/types/room-status'

export const updateItem = async (body: UpdateRoomStatusBody) => {
  const { data } = await axiosInstance.put<ApiResponse<RoomStatusListItem>>(`/room-statuses/${body.id}`, body)
  return data
}
