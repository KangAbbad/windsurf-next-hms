export type Guest = {
  id: number
  first_name: string
  last_name: string
  email_address: string
  phone_number: string
  created_at?: string
  updated_at?: string
}

export type CreateGuestInput = {
  first_name: string
  last_name: string
  email_address: string
  phone_number: string
}

export type UpdateGuestInput = CreateGuestInput & {
  id: number
}
