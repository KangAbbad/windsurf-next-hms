import { BookingListItem, CreateBookingBody } from '@/app/api/bookings/types'
import { ApiResponse } from '@/services/apiResponse'
import { axiosInstance } from '@/services/axiosInstance'

export const createItem = async (body: CreateBookingBody) => {
  const { data } = await axiosInstance.post<ApiResponse<BookingListItem>>('/bookings', body)
  return data
}
