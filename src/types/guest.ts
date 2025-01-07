export interface Guest {
  id: number
  first_name: string
  last_name: string
  email_address: string
  phone_number: string
  created_at?: string
  updated_at?: string
}

export interface CreateGuestInput {
  first_name: string
  last_name: string
  email_address: string
  phone_number: string
}

export interface UpdateGuestInput extends CreateGuestInput {
  id: number
}

export interface GuestResponse {
  guests: Guest[]
  pagination: {
    total: number
    page: number
    limit: number
    total_pages: number
  }
}
