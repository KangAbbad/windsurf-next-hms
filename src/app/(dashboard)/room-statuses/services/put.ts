import type { RoomStatusListItem, UpdateRoomStatusBody } from '@/app/api/room-statuses/types'
import type { ApiResponse } from '@/services/apiResponse'
import { axiosInstance } from '@/services/axiosInstance'

export const updateItem = async (body: UpdateRoomStatusBody) => {
  const { data } = await axiosInstance.put<ApiResponse<RoomStatusListItem>>(`/room-statuses/${body.id}`, body)
  return data
}
