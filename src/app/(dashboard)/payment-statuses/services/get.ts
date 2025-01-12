import { ApiResponse, PaginatedDataResponse } from '@/services/apiResponse'
import { axiosInstance } from '@/services/axiosInstance'
import { PaymentStatusListItem } from '@/types/payment-status'

export type PaymentStatusListPageParams = {
  page?: number
  limit?: number
  search?: string
}

export const getAll = async (params: PaymentStatusListPageParams) => {
  const { data } = await axiosInstance.get<ApiResponse<PaginatedDataResponse<PaymentStatusListItem>>>(
    '/payment-statuses',
    { params }
  )
  return data
}
