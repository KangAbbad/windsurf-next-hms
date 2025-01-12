import { ApiResponse } from '@/services/apiResponse'
import { axiosInstance } from '@/services/axiosInstance'
import { CreatePaymentStatusBody, PaymentStatusListItem } from '@/types/payment-status'

export const createItem = async (body: CreatePaymentStatusBody) => {
  const { data } = await axiosInstance.post<ApiResponse<PaymentStatusListItem>>('/payment-statuses', body)
  return data
}
