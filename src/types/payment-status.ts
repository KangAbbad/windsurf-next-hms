export type PaymentStatusListItem = {
  id: number
  payment_status_name: string
  created_at: string
  updated_at: string
}

export type CreatePaymentStatusBody = {
  payment_status_name: string
}

export type UpdatePaymentStatusBody = Partial<CreatePaymentStatusBody> & {
  id: number
}
