import { BedTypeListItem, CreateBedTypeBody } from '@/app/api/bed-types/types'
import { ApiResponse } from '@/services/apiResponse'
import { axiosInstance } from '@/services/axiosInstance'

export const createItem = async (body: CreateBedTypeBody) => {
  const { data } = await axiosInstance.post<ApiResponse<BedTypeListItem>>('/bed-types', body)
  return data
}
