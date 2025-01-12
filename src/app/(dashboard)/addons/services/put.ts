import { ApiResponse } from '@/services/apiResponse'
import { axiosInstance } from '@/services/axiosInstance'
import { AddonListItem, UpdateAddonBody } from '@/types/addon'

export const updateItem = async (body: UpdateAddonBody) => {
  const { id, ...restBody } = body
  const { data } = await axiosInstance.put<ApiResponse<AddonListItem>>(`/addons/${id}`, restBody)
  return data
}
