import { axiosInstance } from '@/services/axiosInstance'

export const deleteItem = async (id: string) => {
  const { data } = await axiosInstance.delete(`/features/${id}`)
  return data
}
