import { BookingListItem } from '@/app/api/bookings/types'
import { ApiResponse, PaginatedDataResponse } from '@/services/apiResponse'
import { axiosInstance } from '@/services/axiosInstance'

export type BookingListPageParams = {
  page?: number
  limit?: number
  search?: {
    guest?: string
    amount?: string
  }
}

export const getAll = async (params: BookingListPageParams) => {
  const { data } = await axiosInstance.get<ApiResponse<PaginatedDataResponse<BookingListItem>>>('/bookings', { params })
  return data
}

export const getById = async (id: string) => {
  const { data } = await axiosInstance.get<ApiResponse<BookingListItem>>(`/bookings/${id}`)
  return data
}
