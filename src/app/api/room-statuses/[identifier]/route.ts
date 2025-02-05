import type { RoomStatusListItem, UpdateRoomStatusBody } from '../types'

import { createClient } from '@/providers/supabase/server'
import { createApiResponse, createErrorResponse } from '@/services/apiResponse'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ identifier: string }> }
): Promise<Response> {
  try {
    const supabase = await createClient()
    const { identifier } = await params

    const { data, error } = await supabase.from('room_status').select('*').eq('id', identifier).single()

    if (error) {
      return createErrorResponse({
        code: 404,
        message: 'Room status not found',
        errors: [error.message],
      })
    }

    return createApiResponse<RoomStatusListItem>({
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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ identifier: string }> }
): Promise<Response> {
  try {
    const supabase = await createClient()
    const { identifier } = await params
    const updateData: UpdateRoomStatusBody = await request.json()

    // Validate required fields
    if (!updateData.name && typeof updateData.number !== 'number' && !updateData.color) {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: ['All fields are required'],
      })
    }

    // Validate name
    if (!updateData.name || typeof updateData.name !== 'string' || updateData.name.trim() === '') {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: ['Room status name is required'],
      })
    }

    // Validate number
    if (typeof updateData.number !== 'number') {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: ['Room status number is required'],
      })
    }

    // Validate color
    if (!updateData.color) {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: ['Room status color is required'],
      })
    }

    // Check if status name already exists (excluding current status)
    const { data: existingStatus } = await supabase
      .from('room_status')
      .select('id')
      .ilike('status_name', updateData.name ?? '')
      .neq('id', identifier)
      .single()

    if (existingStatus) {
      return createErrorResponse({
        code: 400,
        message: 'Room status name already exists',
        errors: ['Room status name must be unique'],
      })
    }

    // Check if status number already exists (excluding current status)
    const { data: existingNumber } = await supabase
      .from('room_status')
      .select('id')
      .eq('status_number', updateData.number)
      .neq('id', identifier)
      .single()

    if (existingNumber) {
      return createErrorResponse({
        code: 400,
        message: 'Room status number already exists',
        errors: ['Room status number must be unique'],
      })
    }

    // Check if status color already exists (excluding current status)
    const { data: existingColor } = await supabase
      .from('room_status')
      .select('id')
      .eq('status_color', updateData.color)
      .neq('id', identifier)
      .single()

    if (existingColor) {
      return createErrorResponse({
        code: 400,
        message: 'Room status color already exists',
        errors: ['Room status color must be unique'],
      })
    }

    const { data, error } = await supabase.from('room_status').update(updateData).eq('id', identifier).select().single()

    if (error) {
      return createErrorResponse({
        code: 400,
        message: error.message,
        errors: [error.message],
      })
    }

    return createApiResponse<RoomStatusListItem>({
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

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ identifier: string }> }
): Promise<Response> {
  try {
    const supabase = await createClient()
    const { identifier } = await params

    // Check if status is used by any rooms
    const { data: rooms } = await supabase.from('room').select('id').eq('status_id', identifier).limit(1)

    if (rooms && rooms.length > 0) {
      return createErrorResponse({
        code: 400,
        message: 'Cannot delete room status that is in use',
        errors: ['Room status is assigned to one or more rooms'],
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
