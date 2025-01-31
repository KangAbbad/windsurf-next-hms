export type PaymentStatusListItem = {
  id: string
  payment_status_name: string
  payment_status_number: number
  created_at: string
  updated_at: string
}

export type CreatePaymentStatusBody = {
  payment_status_name: string
  payment_status_number: number
}

export type UpdatePaymentStatusBody = Partial<CreatePaymentStatusBody> & {
  id: string
}
