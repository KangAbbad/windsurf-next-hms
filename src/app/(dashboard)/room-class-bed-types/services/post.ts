import { axiosInstance } from '@/services/axiosInstance'
import { CreateRoomClassBedTypeBody, RoomClassBedTypeListItem } from '@/types/room-class-bed-type'

export const createItem = async (body: CreateRoomClassBedTypeBody) => {
  const { data } = await axiosInstance.post<RoomClassBedTypeListItem>('/room-class-bed-types', body)
  return data
}
