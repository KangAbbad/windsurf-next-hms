import { ADDON_NAME_MAX_LENGTH, AddonListItem, UpdateAddonBody } from '../types'

import { createClient } from '@/providers/supabase/server'
import { createApiResponse, createErrorResponse } from '@/services/apiResponse'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ identifier: string }> }
): Promise<Response> {
  try {
    const supabase = await createClient()
    const { identifier } = await params

    const { data, error } = await supabase.from('addon').select('*').eq('id', identifier).single()

    if (error) {
      return createErrorResponse({
        code: 404,
        message: 'Addon not found',
        errors: [error.message],
      })
    }

    return createApiResponse<AddonListItem>({
      code: 200,
      message: 'Addon details retrieved successfully',
      data,
    })
  } catch (error) {
    console.error('Get addon details error:', error)
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
  try {
    const supabase = await createClient()
    const { identifier } = await params
    const updateData: UpdateAddonBody = await request.json()

    // Validate required fields if provided
    if (!updateData.name && !updateData.image_url && typeof updateData.price !== 'number') {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: ['All fields are required'],
      })
    }

    // Validate addon name
    if (!updateData.name) {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: ['Addon name is required'],
      })
    }

    // Validate addon name length
    if (updateData.name.length > ADDON_NAME_MAX_LENGTH) {
      return createErrorResponse({
        code: 400,
        message: 'Invalid addon name',
        errors: [`name must not exceed ${ADDON_NAME_MAX_LENGTH} characters`],
      })
    }

    // Validate image_url
    if (!updateData.image_url) {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: ['Image URL is required'],
      })
    }

    // Validate price
    if (typeof updateData.price !== 'number') {
      return createErrorResponse({
        code: 400,
        message: 'Invalid addon price',
        errors: ['Price must be a number'],
      })
    }

    const { data: existingAddon } = await supabase.from('addon').select('id').eq('id', identifier).single()

    if (!existingAddon) {
      return createErrorResponse({
        code: 404,
        message: 'Addon not found',
        errors: ['The specified addon does not exist'],
      })
    }

    // Check if addon exists
    const { data: duplicateAddon } = await supabase
      .from('addon')
      .select('id')
      .ilike('name', updateData.name)
      .neq('id', identifier)
      .single()

    if (duplicateAddon) {
      return createErrorResponse({
        code: 409,
        message: 'Addon name already exists',
        errors: ['Addon name must be unique'],
      })
    }

    // Update addon
    const { data, error } = await supabase.from('addon').update(updateData).eq('id', identifier).select().single()

    if (error) {
      return createErrorResponse({
        code: 400,
        message: error.message,
        errors: [error.message],
      })
    }

    return createApiResponse<AddonListItem>({
      code: 200,
      message: 'Addon updated successfully',
      data,
    })
  } catch (error) {
    console.error('Update addon error:', error)
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
  try {
    const supabase = await createClient()
    const { identifier } = await params

    // Check if addon exists
    const { data: existingAddon, error: checkError } = await supabase
      .from('addon')
      .select('id')
      .eq('id', identifier)
      .single()

    if (checkError || !existingAddon) {
      return createErrorResponse({
        code: 404,
        message: 'Addon not found',
        errors: ['Invalid addon ID'],
      })
    }

    // Check if addon is used in any bookings
    const { data: bookings } = await supabase
      .from('booking_addon')
      .select('booking_id')
      .eq('addon_id', identifier)
      .limit(1)

    if (bookings && bookings.length > 0) {
      return createErrorResponse({
        code: 400,
        message: 'Cannot delete addon that is used in bookings',
        errors: ['Addon has associated bookings'],
      })
    }

    // Check if addon is used in any room classes
    const { data: roomClasses } = await supabase
      .from('room_class_addon')
      .select('room_class_id')
      .eq('addon_id', identifier)
      .limit(1)

    if (roomClasses && roomClasses.length > 0) {
      return createErrorResponse({
        code: 400,
        message: 'Cannot delete addon that is used in room classes',
        errors: ['Addon has associated room classes'],
      })
    }

    const { error } = await supabase.from('addon').delete().eq('id', identifier)

    if (error) {
      return createErrorResponse({
        code: 400,
        message: error.message,
        errors: [error.message],
      })
    }

    return createApiResponse({
      code: 200,
      message: 'Addon deleted successfully',
    })
  } catch (error) {
    console.error('Delete addon error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}
