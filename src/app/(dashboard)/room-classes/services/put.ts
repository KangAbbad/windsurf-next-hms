import { axiosInstance } from '@/services/axiosInstance'
import type { RoomClassListItem, UpdateRoomClassBody } from '@/types/room-class'

export const updateItem = async (body: UpdateRoomClassBody) => {
  const { id, ...restBody } = body
  const { data } = await axiosInstance.put<RoomClassListItem>(`/room-classes/${id}`, restBody)
  return data
}
