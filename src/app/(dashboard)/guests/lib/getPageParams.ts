import { useSearchParams } from 'next/navigation'

import { GuestListPageParams } from '../services/get'

import { parseSearchParamsToNumber } from '@/utils/parseSearchParamsToNumber'

const getPageParamsHoc = () => {
  return () => {
    const searchParams = useSearchParams()
    const page = parseSearchParamsToNumber(searchParams.get('page'), 1)
    const limit = parseSearchParamsToNumber(searchParams.get('limit'), 10)
    const searchName = searchParams.get('search[name]')
    const searchIdCardNumber = searchParams.get('search[id_card_number]')
    const searchEmail = searchParams.get('search[email]')
    const searchPhone = searchParams.get('search[phone]')
    const searchAddress = searchParams.get('search[address]')

    const pageParams: GuestListPageParams = { page, limit }

    if (searchName || searchIdCardNumber || searchEmail || searchPhone || searchAddress) {
      pageParams.search = {}
      if (searchName) pageParams.search.name = searchName
      if (searchIdCardNumber) pageParams.search.id_card_number = searchIdCardNumber
      if (searchEmail) pageParams.search.email = searchEmail
      if (searchPhone) pageParams.search.phone = searchPhone
      if (searchAddress) pageParams.search.address = searchAddress
    }

    return pageParams
  }
}

export const getPageParams = getPageParamsHoc()
