import { createApiResponse, createErrorResponse } from '@/lib/api-response'
import { createClient } from '@/providers/supabase/server'

export async function GET(_request: Request, { params }: { params: { identifier: string } }) {
  try {
    const supabase = await createClient()
    const { identifier } = params

    const { data, error } = await supabase.from('floor').select('*').eq('id', identifier).single()

    if (error) {
      return createErrorResponse({
        code: 404,
        message: 'Floor not found',
        errors: [error.message],
      })
    }

    return createApiResponse({
      code: 200,
      message: 'Floor retrieved successfully',
      data,
    })
  } catch (error) {
    console.error('Get floor error:', error)
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
    const { floor_name, floor_number, description } = await request.json()

    // Validate required fields
    const validationErrors: string[] = []
    if (!floor_name) validationErrors.push('floor_name is required')
    if (typeof floor_number !== 'number') validationErrors.push('floor_number must be a number')

    if (validationErrors.length > 0) {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: validationErrors,
      })
    }

    // Check if floor name already exists (excluding current floor)
    const { data: existingFloorName } = await supabase
      .from('floor')
      .select('id')
      .ilike('floor_name', floor_name)
      .neq('id', identifier)
      .single()

    if (existingFloorName) {
      return createErrorResponse({
        code: 400,
        message: 'Floor name already exists',
        errors: ['Floor name must be unique'],
      })
    }

    // Check if floor number already exists (excluding current floor)
    const { data: existingFloorNumber } = await supabase
      .from('floor')
      .select('id')
      .eq('floor_number', floor_number)
      .neq('id', identifier)
      .single()

    if (existingFloorNumber) {
      return createErrorResponse({
        code: 400,
        message: 'Floor number already exists',
        errors: ['Floor number must be unique'],
      })
    }

    // Update floor
    const { data, error } = await supabase
      .from('floor')
      .update({
        floor_name,
        floor_number,
        description,
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
      message: 'Floor updated successfully',
      data,
    })
  } catch (error) {
    console.error('Update floor error:', error)
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

    // Check if floor has any rooms
    const { data: rooms } = await supabase.from('room').select('id').eq('floor_id', identifier).limit(1)

    if (rooms && rooms.length > 0) {
      return createErrorResponse({
        code: 400,
        message: 'Cannot delete floor that has rooms',
        errors: ['Floor has one or more rooms assigned to it'],
      })
    }

    const { error } = await supabase.from('floor').delete().eq('id', identifier)

    if (error) {
      return createErrorResponse({
        code: 400,
        message: error.message,
        errors: [error.message],
      })
    }

    return createApiResponse({
      code: 200,
      message: 'Floor deleted successfully',
    })
  } catch (error) {
    console.error('Delete floor error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}
