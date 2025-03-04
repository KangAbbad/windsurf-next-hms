import { BED_TYPE_NAME_MAX_LENGTH, BedTypeListItem, type UpdateBedTypeBody } from '@/app/api/bed-types/types'
import { createClient } from '@/providers/supabase/server'
import { createApiResponse, createErrorResponse } from '@/services/apiResponse'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ identifier: string }> }
): Promise<Response> {
  const startHrtime = process.hrtime()

  try {
    const supabase = await createClient()
    const { identifier } = await params

    const { data, error } = await supabase.from('bed_type').select('*').eq('id', identifier).single()

    if (error) {
      return createErrorResponse({
        code: 404,
        message: 'Bed type not found',
        errors: [error.message],
      })
    }

    return createApiResponse<BedTypeListItem>({
      code: 200,
      message: 'Bed type retrieved successfully',
      start_hrtime: startHrtime,
      data,
    })
  } catch (error) {
    console.error('Get bed type error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ identifier: string }> }
): Promise<Response> {
  const startHrtime = process.hrtime()

  try {
    const supabase = await createClient()
    const { identifier } = await params
    const updateData: UpdateBedTypeBody = await request.json()

    // Validate required fields
    if (
      !updateData.name &&
      !updateData.image_url &&
      !updateData.length &&
      !updateData.width &&
      !updateData.height &&
      !updateData.material
    ) {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: ['All fields are required'],
      })
    }

    // Validate bed type name
    if (!updateData.name) {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: ['Bed type name is required'],
      })
    }

    // Validate bed type name length
    if (updateData.name.length > BED_TYPE_NAME_MAX_LENGTH) {
      return createErrorResponse({
        code: 400,
        message: 'Invalid bed type name',
        errors: [`Bed type name must not exceed ${BED_TYPE_NAME_MAX_LENGTH} characters`],
      })
    }

    // Validate image_url
    if (!updateData.image_url) {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: ['Bed type image url is required'],
      })
    }

    // Validate length
    if (typeof updateData.length !== 'number') {
      return createErrorResponse({
        code: 400,
        message: 'Invalid bed type length',
        errors: ['Bed type length must be a number'],
      })
    }

    // Validate width
    if (typeof updateData.width !== 'number') {
      return createErrorResponse({
        code: 400,
        message: 'Invalid bed type width',
        errors: ['Bed type width must be a number'],
      })
    }

    // Validate height
    if (typeof updateData.height !== 'number') {
      return createErrorResponse({
        code: 400,
        message: 'Invalid bed type height',
        errors: ['Bed type height must be a number'],
      })
    }

    // Validate material
    if (!updateData.material) {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: ['Bed type material is required'],
      })
    }

    // Check if bed type exists
    const { data: existingBedType } = await supabase.from('bed_type').select('id').eq('id', identifier).single()

    if (!existingBedType) {
      return createErrorResponse({
        code: 404,
        message: 'Bed type not found',
        errors: ['The specified bed type does not exist'],
      })
    }

    // Check if bed type name already exists (excluding current bed type)
    const { data: duplicateBedType } = await supabase
      .from('bed_type')
      .select('id')
      .ilike('name', updateData.name)
      .neq('id', identifier)
      .single()

    if (duplicateBedType) {
      return createErrorResponse({
        code: 409,
        message: 'Bed type name already exists',
        errors: ['Bed type name must be unique'],
      })
    }

    // Update bed type
    const { data, error } = await supabase.from('bed_type').update(updateData).eq('id', identifier).select().single()

    if (error) {
      return createErrorResponse({
        code: 400,
        message: error.message,
        errors: [error.message],
      })
    }

    return createApiResponse<BedTypeListItem>({
      code: 200,
      message: 'Bed type updated successfully',
      start_hrtime: startHrtime,
      data,
    })
  } catch (error) {
    console.error('Update bed type error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ identifier: string }> }
): Promise<Response> {
  const startHrtime = process.hrtime()

  try {
    const supabase = await createClient()
    const { identifier } = await params

    // Check if bed type exists
    const { data: existingBedType } = await supabase.from('bed_type').select('id').eq('id', identifier).single()

    if (!existingBedType) {
      return createErrorResponse({
        code: 404,
        message: 'Bed type not found',
        errors: ['The specified bed type does not exist'],
      })
    }

    // Check if bed type is used in room_class_bed_type
    const { data: roomClassBedTypes } = await supabase
      .from('room_class_bed_type')
      .select('id')
      .eq('bed_type_id', identifier)
      .limit(1)

    if (roomClassBedTypes && roomClassBedTypes.length > 0) {
      return createErrorResponse({
        code: 409,
        message: 'Cannot delete bed type that is in use',
        errors: ['Bed type is being used in one or more room classes'],
      })
    }

    const { error } = await supabase.from('bed_type').delete().eq('id', identifier)

    if (error) {
      return createErrorResponse({
        code: 400,
        message: error.message,
        errors: [error.message],
      })
    }

    return createApiResponse({
      code: 200,
      message: 'Bed type deleted successfully',
      start_hrtime: startHrtime,
    })
  } catch (error) {
    console.error('Delete bed type error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}
