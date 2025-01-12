import { ApiResponse } from '@/services/apiResponse'
import { axiosInstance } from '@/services/axiosInstance'
import { AddonListItem, CreateAddonBody } from '@/types/addon'

export const createItem = async (body: CreateAddonBody) => {
  const { data } = await axiosInstance.post<ApiResponse<AddonListItem>>('/addons', body)
  return data
}
