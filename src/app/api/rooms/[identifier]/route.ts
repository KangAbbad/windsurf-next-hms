import { createClient } from '@/providers/supabase/server'
import { createApiResponse, createErrorResponse } from '@/services/apiResponse'
import type { RoomListItem, UpdateRoomBody } from '@/types/room'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ identifier: string }> }
): Promise<Response> {
  try {
    const supabase = await createClient()
    const { identifier } = await params

    // Get room with basic relations
    const { data: room, error: roomError } = await supabase
      .from('room')
      .select(
        `
          *,
          floor:floor_id(*),
          room_class:room_class_id(*),
          room_status:status_id(*)
        `
      )
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
      .select(
        `
        room_class_id,
        num_beds,
        bed_type:bed_type_id(
          id,
          bed_type_name
        )
      `
      )
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
      .select(
        `
        room_class_id,
        feature:feature_id(
          id,
          feature_name
        )
      `
      )
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
  try {
    const supabase = await createClient()
    const { identifier } = await params
    const updates: UpdateRoomBody = await request.json()

    // Validate required fields if provided
    if (updates.room_number || updates.room_class_id || updates.status_id || updates.floor_id) {
      if (!updates.room_number) {
        return createErrorResponse({
          code: 400,
          message: 'Missing required fields',
          errors: ['room_number is required when updating room details'],
        })
      }
      if (!updates.room_class_id) {
        return createErrorResponse({
          code: 400,
          message: 'Missing required fields',
          errors: ['room_class_id is required when updating room details'],
        })
      }
      if (!updates.status_id) {
        return createErrorResponse({
          code: 400,
          message: 'Missing required fields',
          errors: ['status_id is required when updating room details'],
        })
      }
      if (!updates.floor_id) {
        return createErrorResponse({
          code: 400,
          message: 'Missing required fields',
          errors: ['floor_id is required when updating room details'],
        })
      }
    }

    // Check if room number already exists (excluding current room)
    if (updates.room_number) {
      const { data: existingRoom } = await supabase
        .from('room')
        .select('id')
        .ilike('room_number', updates.room_number)
        .neq('id', identifier)
        .single()

      if (existingRoom) {
        return createErrorResponse({
          code: 400,
          message: 'Room number already exists',
          errors: ['Room number must be unique'],
        })
      }
    }

    // Check if room exists
    const { data: existingRoom, error: checkError } = await supabase
      .from('room')
      .select('id')
      .eq('id', identifier)
      .single()

    if (checkError || !existingRoom) {
      return createErrorResponse({
        code: 404,
        message: 'Room not found',
        errors: ['Room with the specified ID does not exist'],
      })
    }

    const { data, error } = await supabase
      .from('room')
      .update(updates)
      .eq('id', identifier)
      .select('*, room_class(*), room_status:status_id(*), floor(*)')
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
  try {
    const supabase = await createClient()
    const { identifier } = await params

    // Check if room exists
    const { data: existingRoom, error: checkError } = await supabase
      .from('room')
      .select('id')
      .eq('id', identifier)
      .single()

    if (checkError || !existingRoom) {
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
