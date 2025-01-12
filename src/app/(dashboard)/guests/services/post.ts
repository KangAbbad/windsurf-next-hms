import { ApiResponse } from '@/services/apiResponse'
import { axiosInstance } from '@/services/axiosInstance'
import { CreateGuestBody, GuestListItem } from '@/types/guest'

export const createItem = async (body: CreateGuestBody) => {
  const { data } = await axiosInstance.post<ApiResponse<GuestListItem>>('/guests', body)
  return data
}
