import { CreateGuestBody, GuestListItem } from '@/app/api/guests/types'
import { ApiResponse } from '@/services/apiResponse'
import { axiosInstance } from '@/services/axiosInstance'

export const createItem = async (body: CreateGuestBody) => {
  const { data } = await axiosInstance.post<ApiResponse<GuestListItem>>('/guests', body)
  return data
}
