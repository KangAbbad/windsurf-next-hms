export enum GUEST_NATIONALITY_TYPE_ENUM {
  INDONESIAN_CITIZEN = 1,
  FOREIGNER = 2,
}

export type GUEST_NATIONALITY_TYPE = keyof typeof GUEST_NATIONALITY_TYPE_ENUM

export enum GUEST_ID_CARD_TYPE_ENUM {
  NATIONAL_IDENTITY_CARD = 1,
  PASSPORT = 2,
  PERMANENT_RESIDENCE_PERMIT = 3,
  TEMPORARY_STAY_PERMIT = 4,
  DRIVING_LICENSE = 5,
}

export type GUEST_ID_CARD_TYPE = keyof typeof GUEST_ID_CARD_TYPE_ENUM

export type GuestListItem = {
  id: string
  nationality: GUEST_NATIONALITY_TYPE
  id_card_type: GUEST_ID_CARD_TYPE
  id_card_number: string
  name: string
  email: string
  phone: string
  address: string
  created_at: string
  updated_at: string
}

export type CreateGuestBody = {
  nationality: GUEST_NATIONALITY_TYPE
  id_card_type: GUEST_ID_CARD_TYPE
  id_card_number: string
  name: string
  email?: string
  phone: string
  address?: string
}

export type UpdateGuestBody = Partial<CreateGuestBody> & {
  id: string
}
