import { AddonListItem, UpdateAddonBody } from '../types'

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
    const updates: UpdateAddonBody = await request.json()

    // Validate required fields if provided
    if (updates.addon_name || updates.price) {
      if (!updates.addon_name) {
        return createErrorResponse({
          code: 400,
          message: 'Missing required fields',
          errors: ['addon_name is required when updating name'],
        })
      }
      if (!updates.price) {
        return createErrorResponse({
          code: 400,
          message: 'Missing required fields',
          errors: ['price is required when updating price'],
        })
      }
    }

    // Validate price is a positive number if provided
    if (updates.price !== undefined && (typeof updates.price !== 'number' || updates.price <= 0)) {
      return createErrorResponse({
        code: 400,
        message: 'Invalid price',
        errors: ['Price must be a positive number'],
      })
    }

    // Check if addon name already exists (excluding current addon)
    if (updates.addon_name) {
      const { data: existingAddon } = await supabase
        .from('addon')
        .select('id')
        .ilike('addon_name', updates.addon_name)
        .neq('id', identifier)
        .single()

      if (existingAddon) {
        return createErrorResponse({
          code: 400,
          message: 'Addon name already exists',
          errors: ['Addon name must be unique'],
        })
      }
    }

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

    // Update addon
    const { data: updatedAddon, error: updateError } = await supabase
      .from('addon')
      .update({
        addon_name: updates.addon_name,
        price: updates.price,
        updated_at: new Date().toISOString(),
      })
      .eq('id', identifier)
      .select()
      .single()

    if (updateError) {
      return createErrorResponse({
        code: 400,
        message: updateError.message,
        errors: [updateError.message],
      })
    }

    return createApiResponse<AddonListItem>({
      code: 200,
      message: 'Addon updated successfully',
      data: updatedAddon,
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
