export type GuestListItem = {
  id: string
  first_name: string
  last_name: string
  email_address: string
  phone_number: string
  created_at: string
  updated_at: string
}

export type CreateGuestBody = {
  first_name: string
  last_name: string
  email_address: string
  phone_number: string
}

export type UpdateGuestBody = Partial<CreateGuestBody> & {
  id: string
}
