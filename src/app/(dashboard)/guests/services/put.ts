import { GuestListItem, UpdateGuestBody } from '@/app/api/guests/types'
import { ApiResponse } from '@/services/apiResponse'
import { axiosInstance } from '@/services/axiosInstance'

export const updateItem = async (body: UpdateGuestBody) => {
  const { id, ...restBody } = body
  const { data } = await axiosInstance.put<ApiResponse<GuestListItem>>(`/guests/${id}`, restBody)
  return data
}
