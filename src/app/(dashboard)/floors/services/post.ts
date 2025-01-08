import { axiosInstance } from '@/services/axiosInstance'
import { CreateFloorBody, FloorListItem } from '@/types/floor'

export const createItem = async (body: CreateFloorBody) => {
  const { data } = await axiosInstance.post<FloorListItem>('/floors', body)
  return data
}
