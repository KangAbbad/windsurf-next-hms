import { RoomListItem, UpdateRoomBody } from '@/app/api/rooms/types'
import { ApiResponse } from '@/services/apiResponse'
import { axiosInstance } from '@/services/axiosInstance'

export const updateItem = async (body: UpdateRoomBody) => {
  const { id, ...restBody } = body
  const { data } = await axiosInstance.put<ApiResponse<RoomListItem>>(`/rooms/${id}`, restBody)
  return data
}
