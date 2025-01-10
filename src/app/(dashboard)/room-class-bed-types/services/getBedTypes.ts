import { ApiResponse, PaginatedDataResponse } from '@/services/apiResponse'
import { axiosInstance } from '@/services/axiosInstance'
import { BedTypeListItem } from '@/types/bed-type'

export const getAllBedTypes = async () => {
  const { data } = await axiosInstance.get<ApiResponse<PaginatedDataResponse<BedTypeListItem>>>('/bed-types')
  return data
}
