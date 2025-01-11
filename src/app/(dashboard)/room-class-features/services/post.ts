import { axiosInstance } from '@/services/axiosInstance'
import { CreateRoomClassFeatureBody, RoomClassFeatureListItem } from '@/types/room-class-feature'

export const createItem = async (body: CreateRoomClassFeatureBody) => {
  const { data } = await axiosInstance.post<RoomClassFeatureListItem>('/room-class-features', body)
  return data
}
