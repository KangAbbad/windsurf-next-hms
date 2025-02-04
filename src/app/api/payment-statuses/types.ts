export type PaymentStatusListItem = {
  id: string
  name: string
  number: number
  color: string
  created_at: string
  updated_at: string
}

export type CreatePaymentStatusBody = {
  name: string
  number: number
  color: string
}

export type UpdatePaymentStatusBody = Partial<CreatePaymentStatusBody> & {
  id: string
}
