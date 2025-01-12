import { ApiResponse } from '@/services/apiResponse'
import { axiosInstance } from '@/services/axiosInstance'
import { GuestListItem, UpdateGuestBody } from '@/types/guest'

export const updateItem = async (body: UpdateGuestBody) => {
  const { id, ...restBody } = body
  const { data } = await axiosInstance.put<ApiResponse<GuestListItem>>(`/guests/${id}`, restBody)
  return data
}
