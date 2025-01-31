import { FloorListItem, UpdateFloorBody } from '@/app/api/floors/types'
import { ApiResponse } from '@/services/apiResponse'
import { axiosInstance } from '@/services/axiosInstance'

export const updateItem = async (body: UpdateFloorBody) => {
  const { id, ...restBody } = body
  const { data } = await axiosInstance.put<ApiResponse<FloorListItem>>(`/floors/${id}`, restBody)
  return data
}
