import type { RoomListItem, UpdateRoomBody } from '../types'

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

    // Get room with basic relations
    const { data: room, error: roomError } = await supabase
      .from('room')
      .select('*, floor(*), room_class(*), room_status(*)')
      .eq('id', identifier)
      .single()

    if (roomError) {
      return createErrorResponse({
        code: 404,
        message: 'Room not found',
        errors: [roomError.message],
      })
    }

    // Get bed types for the room class
    const { data: bedTypes, error: bedTypesError } = await supabase
      .from('room_class_bed_types')
      .select('room_class_id, num_beds, bed_type(*)')
      .eq('room_class_id', room.room_class.id)

    if (bedTypesError) {
      return createErrorResponse({
        code: 400,
        message: bedTypesError.message,
        errors: [bedTypesError.message],
      })
    }

    // Get features for the room class
    const { data: features, error: featuresError } = await supabase
      .from('room_class_features')
      .select('room_class_id, feature(*)')
      .eq('room_class_id', room.room_class.id)

    if (featuresError) {
      return createErrorResponse({
        code: 400,
        message: featuresError.message,
        errors: [featuresError.message],
      })
    }

    // Combine all data
    const enrichedRoom = {
      ...room,
      room_class: {
        ...room.room_class,
        bed_types: bedTypes,
        features,
      },
    }

    return createApiResponse<RoomListItem>({
      code: 200,
      message: 'Room details retrieved successfully',
      start_hrtime: startHrtime,
      data: enrichedRoom,
    })
  } catch (error) {
    console.error('Get room details error:', error)
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
    const updateData: UpdateRoomBody = await request.json()

    // Validate required fields
    if (
      typeof updateData.number !== 'number' &&
      !updateData.floor_id &&
      !updateData.room_class_id &&
      !updateData.room_status_id
    ) {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: ['All fields are required'],
      })
    }

    // Validate room number
    if (typeof updateData.number !== 'number') {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: ['Room number is required'],
      })
    }

    // Validate floor_id
    if (!updateData.floor_id) {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: ['Floor is required'],
      })
    }

    // Validate room_class_id
    if (!updateData.room_class_id) {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: ['Room class is required'],
      })
    }

    // Validate room_status_id
    if (!updateData.room_status_id) {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: ['Room status is required'],
      })
    }

    // Check if room number already exists on the same floor (excluding current room)
    const { data: existingRoom } = await supabase
      .from('room')
      .select('id')
      .eq('number', updateData.number)
      .eq('floor_id', updateData.floor_id)
      .neq('id', identifier)
      .single()

    if (existingRoom) {
      return createErrorResponse({
        code: 409,
        message: 'Room number already exists on this floor',
        errors: ['Room number must be unique per floor'],
      })
    }

    const { data, error } = await supabase
      .from('room')
      .update(updateData)
      .eq('id', identifier)
      .select('*, floor(*), room_class(*), room_status(*)')
      .single()

    if (error) {
      return createErrorResponse({
        code: 400,
        message: error.message,
        errors: [error.message],
      })
    }

    return createApiResponse<RoomListItem>({
      code: 200,
      message: 'Room updated successfully',
      start_hrtime: startHrtime,
      data,
    })
  } catch (error) {
    console.error('Update room error:', error)
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

    // Check if room exists
    const { data: existingRoom } = await supabase.from('room').select('id').eq('id', identifier).single()

    if (!existingRoom) {
      return createErrorResponse({
        code: 404,
        message: 'Room not found',
        errors: ['Room with the specified ID does not exist'],
      })
    }

    const { error } = await supabase.from('room').delete().eq('id', identifier)

    if (error) {
      return createErrorResponse({
        code: 400,
        message: error.message,
        errors: [error.message],
      })
    }

    return createApiResponse({
      code: 200,
      message: 'Room deleted successfully',
      start_hrtime: startHrtime,
    })
  } catch (error) {
    console.error('Delete room error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}
