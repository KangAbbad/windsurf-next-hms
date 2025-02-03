export type PaymentStatusListItem = {
  id: string
  name: string
  number: number
  created_at: string
  updated_at: string
}

export type CreatePaymentStatusBody = {
  name: string
  number: number
}

export type UpdatePaymentStatusBody = Partial<CreatePaymentStatusBody> & {
  id: string
}
