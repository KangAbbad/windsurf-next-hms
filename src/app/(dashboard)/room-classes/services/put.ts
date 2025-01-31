import type { RoomClassListItem, UpdateRoomClassBody } from '@/app/api/room-classes/types'
import { ApiResponse } from '@/services/apiResponse'
import { axiosInstance } from '@/services/axiosInstance'

export const updateItem = async (body: UpdateRoomClassBody) => {
  const { id, ...restBody } = body
  const { data } = await axiosInstance.put<ApiResponse<RoomClassListItem>>(`/room-classes/${id}`, restBody)
  return data
}
