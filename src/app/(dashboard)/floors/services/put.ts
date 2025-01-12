import { ApiResponse } from '@/services/apiResponse'
import { axiosInstance } from '@/services/axiosInstance'
import { FloorListItem, UpdateFloorBody } from '@/types/floor'

export const updateItem = async (body: UpdateFloorBody) => {
  const { id, ...restBody } = body
  const { data } = await axiosInstance.put<ApiResponse<FloorListItem>>(`/floors/${id}`, restBody)
  return data
}
