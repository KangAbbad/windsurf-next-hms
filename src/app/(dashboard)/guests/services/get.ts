import { GuestListItem } from '@/app/api/guests/types'
import { ApiResponse, PaginatedDataResponse } from '@/services/apiResponse'
import { axiosInstance } from '@/services/axiosInstance'

export type GuestListPageParams = {
  page?: number
  limit?: number
  search?: {
    name?: string
    id_card_number?: string
    email?: string
    phone?: string
    address?: string
  }
}

export const getAll = async (params: GuestListPageParams) => {
  const { data } = await axiosInstance.get<ApiResponse<PaginatedDataResponse<GuestListItem>>>('/guests', { params })
  return data
}
