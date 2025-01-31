import { CreateFloorBody, FloorListItem } from '@/app/api/floors/types'
import { ApiResponse } from '@/services/apiResponse'
import { axiosInstance } from '@/services/axiosInstance'

export const createItem = async (body: CreateFloorBody) => {
  const { data } = await axiosInstance.post<ApiResponse<FloorListItem>>('/floors', body)
  return data
}
