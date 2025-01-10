import { axiosInstance } from '@/services/axiosInstance'
import type { CreateRoomClassBody, RoomClassListItem } from '@/types/room-class'

export const createItem = async (body: CreateRoomClassBody) => {
  const { data } = await axiosInstance.post<RoomClassListItem>('/room-classes', body)
  return data
}
