import { ApiResponse } from '@/services/apiResponse'
import { axiosInstance } from '@/services/axiosInstance'
import { BedTypeListItem, CreateBedTypeBody } from '@/types/bed-type'

export const createItem = async (body: CreateBedTypeBody) => {
  const { data } = await axiosInstance.post<ApiResponse<BedTypeListItem>>('/bed-types', body)
  return data
}
