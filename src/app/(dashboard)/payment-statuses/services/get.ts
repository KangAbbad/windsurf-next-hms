import { PaymentStatusListItem } from '@/app/api/payment-statuses/types'
import { ApiResponse, PaginatedDataResponse } from '@/services/apiResponse'
import { axiosInstance } from '@/services/axiosInstance'

export type PaymentStatusListPageParams = {
  page?: number
  limit?: number
}

export const getAll = async (params: PaymentStatusListPageParams) => {
  const { data } = await axiosInstance.get<ApiResponse<PaginatedDataResponse<PaymentStatusListItem>>>(
    '/payment-statuses',
    { params }
  )
  return data
}
