import { createClient } from '@/providers/supabase/server'
import { createApiResponse, createErrorResponse } from '@/services/apiResponse'

export async function GET(_request: Request, { params }: { params: { identifier: string } }) {
  try {
    const supabase = await createClient()
    const { identifier } = params

    const { data, error } = await supabase.from('room_status').select('*').eq('id', identifier).single()

    if (error) {
      return createErrorResponse({
        code: 404,
        message: 'Room status not found',
        errors: [error.message],
      })
    }

    return createApiResponse({
      code: 200,
      message: 'Room status retrieved successfully',
      data,
    })
  } catch (error) {
    console.error('Get room status error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}

export async function PUT(request: Request, { params }: { params: { identifier: string } }) {
  try {
    const supabase = await createClient()
    const { identifier } = params
    const { status_name, description, is_available, color_code } = await request.json()

    // Validate required fields
    const validationErrors: string[] = []
    if (!status_name) validationErrors.push('status_name is required')
    if (typeof is_available !== 'boolean') validationErrors.push('is_available must be a boolean')
    if (color_code && !/^#[0-9A-Fa-f]{6}$/.test(color_code)) {
      validationErrors.push('color_code must be a valid hex color code (e.g., #FF0000)')
    }

    if (validationErrors.length > 0) {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: validationErrors,
      })
    }

    // Check if status name already exists (excluding current status)
    const { data: existingStatus } = await supabase
      .from('room_status')
      .select('id')
      .ilike('status_name', status_name)
      .neq('id', identifier)
      .single()

    if (existingStatus) {
      return createErrorResponse({
        code: 400,
        message: 'Room status name already exists',
        errors: ['Room status name must be unique'],
      })
    }

    // Update room status
    const { data, error } = await supabase
      .from('room_status')
      .update({
        status_name,
        description,
        is_available,
        color_code,
      })
      .eq('id', identifier)
      .select()
      .single()

    if (error) {
      return createErrorResponse({
        code: 400,
        message: error.message,
        errors: [error.message],
      })
    }

    return createApiResponse({
      code: 200,
      message: 'Room status updated successfully',
      data,
    })
  } catch (error) {
    console.error('Update room status error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}

export async function DELETE(_request: Request, { params }: { params: { identifier: string } }) {
  try {
    const supabase = await createClient()
    const { identifier } = params

    // Check if status is used by any rooms
    const { data: rooms } = await supabase.from('room').select('id').eq('status_id', identifier).limit(1)

    if (rooms && rooms.length > 0) {
      return createErrorResponse({
        code: 400,
        message: 'Cannot delete room status that is in use',
        errors: ['Room status is assigned to one or more rooms'],
      })
    }

    // Check if this is the last available status
    const { data: availableStatuses } = await supabase
      .from('room_status')
      .select('id')
      .eq('is_available', true)
      .limit(2)

    if (availableStatuses && availableStatuses.length === 1 && availableStatuses[0].id === identifier) {
      return createErrorResponse({
        code: 400,
        message: 'Cannot delete the last available room status',
        errors: ['At least one available room status must exist'],
      })
    }

    const { error } = await supabase.from('room_status').delete().eq('id', identifier)

    if (error) {
      return createErrorResponse({
        code: 400,
        message: error.message,
        errors: [error.message],
      })
    }

    return createApiResponse({
      code: 200,
      message: 'Room status deleted successfully',
    })
  } catch (error) {
    console.error('Delete room status error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}
