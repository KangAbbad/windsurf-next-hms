import { BookingListItem, UpdateBookingBody } from '@/app/api/bookings/types'
import { ApiResponse } from '@/services/apiResponse'
import { axiosInstance } from '@/services/axiosInstance'

export const updateItem = async (body: UpdateBookingBody) => {
  const { id, ...restBody } = body
  const { data } = await axiosInstance.put<ApiResponse<BookingListItem>>(`/bookings/${id}`, restBody)
  return data
}
