import {
  GUEST_ID_CARD_TYPE,
  GUEST_ID_CARD_TYPE_ENUM,
  GUEST_NATIONALITY_TYPE,
  GUEST_NATIONALITY_TYPE_ENUM,
} from '@/app/api/guests/types'

export const queryKey = {
  RES_GUEST_LIST: 'RES_GUEST_LIST',
  GUEST_DETAIL: 'GUEST_DETAIL',
}

type NationalityOption = {
  label: string
  value: GUEST_NATIONALITY_TYPE
}

export const nationalityOptions: NationalityOption[] = Object.keys(GUEST_NATIONALITY_TYPE_ENUM)
  .filter((key) => isNaN(Number(key)))
  .map((key) => ({
    label: key.replace(/_/g, ' '),
    value: key as GUEST_NATIONALITY_TYPE,
  }))

type IdCardTypeOption = {
  label: string
  value: GUEST_ID_CARD_TYPE
}

export const idCardTypeOptions: IdCardTypeOption[] = Object.keys(GUEST_ID_CARD_TYPE_ENUM)
  .filter((key) => isNaN(Number(key)))
  .map((key) => ({
    label: key.replace(/_/g, ' '),
    value: key as GUEST_ID_CARD_TYPE,
  }))
