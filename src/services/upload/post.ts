import { ApiResponse } from '../apiResponse'
import { axiosInstance } from '../axiosInstance'

import { UploadImageBody } from '@/app/api/upload-image/types'

export type UploadImageResponse = {
  id: string
  path: string
  fullPath: string
  image_url: string
}

export const uploadImage = async (body: UploadImageBody) => {
  const { file } = body
  const formData = new FormData()
  formData.append('file', file)

  const { data } = await axiosInstance.post<ApiResponse<UploadImageResponse>>('/upload-image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return data
}
