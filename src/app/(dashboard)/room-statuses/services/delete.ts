import type { ApiResponse } from '@/services/apiResponse'
import { axiosInstance } from '@/services/axiosInstance'

export const deleteItem = async (id: number) => {
  const { data } = await axiosInstance.delete<ApiResponse<null>>(`/room-statuses/${id}`)
  return data
}
