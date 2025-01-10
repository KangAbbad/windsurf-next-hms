import { axiosInstance } from '@/services/axiosInstance'
import { RoomClassBedTypeListItem, UpdateRoomClassBedTypeBody } from '@/types/room-class-bed-type'

export const updateItem = async (body: UpdateRoomClassBedTypeBody) => {
  const { room_class_id, bed_type_id } = body
  const { data } = await axiosInstance.put<RoomClassBedTypeListItem>(
    `/room-class-bed-types/${room_class_id}/${bed_type_id}`,
    body
  )
  return data
}
