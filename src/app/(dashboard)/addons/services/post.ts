import { AddonListItem, CreateAddonBody } from '@/app/api/addons/types'
import { ApiResponse } from '@/services/apiResponse'
import { axiosInstance } from '@/services/axiosInstance'

export const createItem = async (body: CreateAddonBody) => {
  const { data } = await axiosInstance.post<ApiResponse<AddonListItem>>('/addons', body)
  return data
}
