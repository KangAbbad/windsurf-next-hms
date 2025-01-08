import { axiosInstance } from '@/services/axiosInstance'
import { AddonListItem, CreateAddonBody } from '@/types/addon'

export const createItem = async (body: CreateAddonBody) => {
  const { data } = await axiosInstance.post<AddonListItem>('/addons', body)
  return data
}
