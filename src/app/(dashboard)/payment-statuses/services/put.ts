import { ApiResponse } from '@/services/apiResponse'
import { axiosInstance } from '@/services/axiosInstance'
import { PaymentStatusListItem, UpdatePaymentStatusBody } from '@/types/payment-status'

export const updateItem = async (body: UpdatePaymentStatusBody) => {
  const { id, ...restBody } = body
  const { data } = await axiosInstance.put<ApiResponse<PaymentStatusListItem>>(`/payment-statuses/${id}`, restBody)
  return data
}
