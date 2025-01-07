export interface PaymentStatus {
  id: number
  payment_status_name: string
  created_at?: string
  updated_at?: string
}

export interface CreatePaymentStatusInput {
  payment_status_name: string
}

export interface UpdatePaymentStatusInput {
  id: number
  payment_status_name: string
}

export interface PaymentStatusResponse {
  payment_statuses: PaymentStatus[]
  pagination: {
    total: number
    page: number
    limit: number
    total_pages: number
  }
}
