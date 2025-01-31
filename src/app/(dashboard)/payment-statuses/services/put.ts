import { PaymentStatusListItem, UpdatePaymentStatusBody } from '@/app/api/payment-statuses/types'
import { ApiResponse } from '@/services/apiResponse'
import { axiosInstance } from '@/services/axiosInstance'

export const updateItem = async (body: UpdatePaymentStatusBody) => {
  const { id, ...restBody } = body
  const { data } = await axiosInstance.put<ApiResponse<PaymentStatusListItem>>(`/payment-statuses/${id}`, restBody)
  return data
}
