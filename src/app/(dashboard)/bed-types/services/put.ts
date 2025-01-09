import { axiosInstance } from '@/services/axiosInstance'
import { BedTypeListItem, UpdateBedTypeBody } from '@/types/bedType'

export const updateItem = async (body: UpdateBedTypeBody) => {
  const { id, ...restBody } = body
  const { data } = await axiosInstance.put<BedTypeListItem>(`/bed-types/${id}`, restBody)
  return data
}
