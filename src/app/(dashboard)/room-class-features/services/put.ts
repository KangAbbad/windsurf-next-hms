import { ApiResponse } from '@/services/apiResponse'
import { axiosInstance } from '@/services/axiosInstance'
import { RoomClassFeatureListItem, UpdateRoomClassFeatureBody } from '@/types/room-class-feature'

export const updateItem = async (data: UpdateRoomClassFeatureBody): Promise<ApiResponse<RoomClassFeatureListItem>> => {
  const { room_class_id, feature_id, new_room_class_id, new_feature_id } = data
  const { data: response } = await axiosInstance.put<ApiResponse<RoomClassFeatureListItem>>(
    `/room-class-features/${room_class_id}/${feature_id}`,
    { room_class_id: new_room_class_id, feature_id: new_feature_id }
  )
  return response
}
