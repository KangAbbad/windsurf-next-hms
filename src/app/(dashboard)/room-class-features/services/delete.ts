import { ApiResponse } from '@/services/apiResponse'
import { axiosInstance } from '@/services/axiosInstance'

export type DeleteRoomClassFeatureParams = {
  roomClassId: string
  featureId: string
}

export const deleteItem = async ({
  roomClassId,
  featureId,
}: DeleteRoomClassFeatureParams): Promise<ApiResponse<null>> => {
  const { data } = await axiosInstance.delete(`/room-class-features/${roomClassId}/${featureId}`)
  return data
}
