import { ApiResponse } from '@/services/apiResponse'
import { axiosInstance } from '@/services/axiosInstance'
import { BookingListItem, CreateBookingBody } from '@/types/booking'

export const createItem = async (body: CreateBookingBody) => {
  const { data } = await axiosInstance.post<ApiResponse<BookingListItem>>('/bookings', body)
  return data
}
