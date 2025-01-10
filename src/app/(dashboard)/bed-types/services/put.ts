import { axiosInstance } from '@/services/axiosInstance'
import { BedTypeListItem, UpdateBedTypeBody } from '@/types/bed-type'

export const updateItem = async (body: UpdateBedTypeBody) => {
  const { id, ...restBody } = body
  const { data } = await axiosInstance.put<BedTypeListItem>(`/bed-types/${id}`, restBody)
  return data
}
