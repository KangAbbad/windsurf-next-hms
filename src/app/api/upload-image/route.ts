import sharp from 'sharp'
import { v4 as uuidv4 } from 'uuid'

import { createClient } from '@/providers/supabase/server'
import { createApiResponse, createErrorResponse } from '@/services/apiResponse'

export async function POST(request: Request): Promise<Response> {
  try {
    const supabase = await createClient()
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file || !(file instanceof File)) {
      return createErrorResponse({
        code: 400,
        message: 'Invalid file upload',
        errors: ['Please upload a valid file'],
      })
    }

    const fileName = file.name
    const fileExtension = fileName.slice(fileName.lastIndexOf('.') + 1)
    const path = `${uuidv4()}.${fileExtension}`

    try {
      // // Convert File to Buffer
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const compressedBuffer = await sharp(buffer).webp({ quality: 75 }).toBuffer()

      const { data: uploadedImage, error } = await supabase.storage.from('images').upload(path, compressedBuffer)

      if (error) {
        return createErrorResponse({
          code: 400,
          message: error.message || 'Upload image failed',
          errors: [error.message || 'Upload image failed'],
        })
      }

      const { publicUrl: image_url } = supabase.storage.from('images').getPublicUrl(uploadedImage.path).data

      return createApiResponse({
        code: 201,
        message: 'Image uploaded successfully',
        data: {
          ...uploadedImage,
          image_url,
        },
      })
    } catch (error) {
      console.error(error)
      return createErrorResponse({
        code: 400,
        message: 'Image compression failed',
        errors: ['Image compression failed'],
      })
    }
  } catch (error) {
    console.error('Upload image error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}
