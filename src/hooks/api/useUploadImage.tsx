import { UseMutationOptions, useMutation } from '@tanstack/react-query'
import { Typography } from 'antd'

import { queryKeyUpload } from '@/lib/constants'
import { useAntdContextHolder } from '@/lib/context/AntdContextHolder'
import { ApiResponse } from '@/services/apiResponse'
import { uploadImage, UploadImageResponse } from '@/services/upload/post'
import { UploadImageBody } from '@/types/upload-image'

export type useUploadImageConfig = {
  options?: UseMutationOptions<ApiResponse<UploadImageResponse>, UploadImageBody, unknown>
}

export const useUploadImage = (opt: useUploadImageConfig) => {
  const { options } = opt
  const { antdNotification } = useAntdContextHolder()

  return useMutation({
    mutationKey: [queryKeyUpload.UPLOAD_IMAGE],
    mutationFn: uploadImage,
    onSuccess: (res, variables, context) => {
      if (!res.success) {
        const description =
          Array.isArray(res.errors) && res.errors.length ? (
            <div className="error-notification-container">
              {res.errors.map((msg, msgIndex) => (
                <Typography.Paragraph key={msgIndex}>{msg}</Typography.Paragraph>
              ))}
            </div>
          ) : (
            res.message || 'Internal Server Error.'
          )
        antdNotification?.error({
          message: 'Upload Image Failed!',
          description,
        })
        return
      }
      options?.onSuccess?.(res, variables, context)
    },
    onError: (error: { message: string }) => {
      console.error(error)
      antdNotification?.error({
        message: 'Upload Image Failed!',
        description: error?.message,
      })
    },
  })
}
