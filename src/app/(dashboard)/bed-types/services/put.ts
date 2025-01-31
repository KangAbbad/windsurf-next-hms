import { BedTypeListItem, UpdateBedTypeBody } from '@/app/api/bed-types/types'
import { ApiResponse } from '@/services/apiResponse'
import { axiosInstance } from '@/services/axiosInstance'

export const updateItem = async (body: UpdateBedTypeBody) => {
  const { id, ...restBody } = body
  const { data } = await axiosInstance.put<ApiResponse<BedTypeListItem>>(`/bed-types/${id}`, restBody)
  return data
}
