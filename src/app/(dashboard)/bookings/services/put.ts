import { ApiResponse } from '@/services/apiResponse'
import { axiosInstance } from '@/services/axiosInstance'
import { BookingListItem, UpdateBookingBody } from '@/types/booking'

export const updateItem = async (body: UpdateBookingBody) => {
  const { id, ...restBody } = body
  const { data } = await axiosInstance.put<ApiResponse<BookingListItem>>(`/bookings/${id}`, restBody)
  return data
}
