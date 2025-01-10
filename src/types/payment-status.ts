export type PaymentStatus = {
  id: number
  payment_status_name: string
  created_at?: string
  updated_at?: string
}

export type CreatePaymentStatusInput = {
  payment_status_name: string
}

export type UpdatePaymentStatusInput = {
  id: number
  payment_status_name: string
}
