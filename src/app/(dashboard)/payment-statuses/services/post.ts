import { CreatePaymentStatusBody, PaymentStatusListItem } from '@/app/api/payment-statuses/types'
import { ApiResponse } from '@/services/apiResponse'
import { axiosInstance } from '@/services/axiosInstance'

export const createItem = async (body: CreatePaymentStatusBody) => {
  const { data } = await axiosInstance.post<ApiResponse<PaymentStatusListItem>>('/payment-statuses', body)
  return data
}
