import { axiosInstance } from '@/services/axiosInstance'
import { BedTypeListItem, CreateBedTypeBody } from '@/types/bed-type'

export const createItem = async (body: CreateBedTypeBody) => {
  const { data } = await axiosInstance.post<BedTypeListItem>('/bed-types', body)
  return data
}
