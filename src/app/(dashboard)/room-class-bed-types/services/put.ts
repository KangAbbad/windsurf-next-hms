import { axiosInstance } from '@/services/axiosInstance'
import { RoomClassBedTypeListItem, UpdateRoomClassBedTypeBody } from '@/types/room-class-bed-type'

export const updateItem = async (body: UpdateRoomClassBedTypeBody) => {
  const { id, ...restBody } = body
  const { data } = await axiosInstance.put<RoomClassBedTypeListItem>(`/room-class-bed-types/${id}`, restBody)
  return data
}
