import { ApiResponse, PaginatedDataResponse } from '@/services/apiResponse'
import { axiosInstance } from '@/services/axiosInstance'
import { RoomClassBedTypeListItem } from '@/types/room-class-bed-type'

export type RoomClassBedTypeListPageParams = {
  page?: number
  limit?: number
  room_class_id?: string
}

export const getAll = async (params: RoomClassBedTypeListPageParams) => {
  const { data } = await axiosInstance.get<ApiResponse<PaginatedDataResponse<RoomClassBedTypeListItem>>>(
    '/room-class-bed-types',
    {
      params,
    }
  )
  return data
}
