import { FloorListItem } from '../types'

import { createClient } from '@/providers/supabase/server'
import { createApiResponse, createErrorResponse } from '@/services/apiResponse'

export async function GET(_request: Request, { params }: { params: Promise<{ identifier: string }> }) {
  try {
    const supabase = await createClient()
    const { identifier } = await params

    const { data, error } = await supabase.from('floor').select('*').eq('id', identifier).single()

    if (error) {
      return createErrorResponse({
        code: 404,
        message: 'Floor not found',
        errors: [error.message],
      })
    }

    return createApiResponse<FloorListItem>({
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

export async function PUT(request: Request, { params }: { params: Promise<{ identifier: string }> }) {
  try {
    const supabase = await createClient()
    const { identifier } = await params
    const updates = await request.json()

    // Validate required fields
    if (typeof updates.number !== 'number') {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: ['number must be a number'],
      })
    }

    // Check if floor number already exists (excluding current floor)
    const { data: existingFloor } = await supabase
      .from('floor')
      .select('id')
      .eq('number', updates.number)
      .neq('id', identifier)
      .single()

    if (existingFloor) {
      return createErrorResponse({
        code: 400,
        message: 'Floor number already exists',
        errors: ['Floor number must be unique'],
      })
    }

    // Update floor
    const updateData = {
      ...(updates.number !== undefined && { number: updates.number }),
      ...(updates.name !== undefined && { name: updates.name }),
    }

    const { data, error } = await supabase.from('floor').update(updateData).eq('id', identifier).select().single()

    if (error) {
      return createErrorResponse({
        code: 400,
        message: error.message,
        errors: [error.message],
      })
    }

    return createApiResponse<FloorListItem>({
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

export async function DELETE(_request: Request, { params }: { params: Promise<{ identifier: string }> }) {
  try {
    const supabase = await createClient()
    const { identifier } = await params

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
