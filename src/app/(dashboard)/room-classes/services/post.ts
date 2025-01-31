import type { CreateRoomClassBody, RoomClassListItem } from '@/app/api/room-classes/types'
import { ApiResponse } from '@/services/apiResponse'
import { axiosInstance } from '@/services/axiosInstance'

export const createItem = async (body: CreateRoomClassBody) => {
  const { data } = await axiosInstance.post<ApiResponse<RoomClassListItem>>('/room-classes', body)
  return data
}
