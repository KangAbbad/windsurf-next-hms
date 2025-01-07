import { createApiResponse, createErrorResponse } from '@/lib/api-response'
import { createClient } from '@/providers/supabase/server'
import type { UpdateRoomInput } from '@/types/room'

export async function GET(_request: Request, { params }: { params: { identifier: string } }): Promise<Response> {
  try {
    const supabase = await createClient()

    const { data: room, error } = await supabase
      .from('room')
      .select(
        `
        id,
        room_number,
        room_class_id,
        room_status_id,
        created_at,
        updated_at,
        room_class:room_class(
          id,
          room_class_name,
          description,
          base_occupancy,
          max_occupancy,
          base_rate,
          features:room_class_feature(
            feature:feature(
              id,
              feature_name
            )
          ),
          bed_types:room_class_bed_type(
            bed_type:bed_type(
              id,
              bed_type_name
            ),
            quantity
          )
        ),
        room_status:room_status(
          id,
          status_name,
          description,
          is_available,
          color_code
        )
      `
      )
      .eq('id', params.identifier)
      .single()

    if (error) {
      return createErrorResponse({
        code: 400,
        message: error.message,
        errors: [error.message],
      })
    }

    if (!room) {
      return createErrorResponse({
        code: 404,
        message: 'Room not found',
        errors: ['Invalid room ID'],
      })
    }

    return createApiResponse({
      code: 200,
      message: 'Room retrieved successfully',
      data: room,
    })
  } catch (error) {
    console.error('Get room error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}

export async function PUT(request: Request, { params }: { params: { identifier: string } }): Promise<Response> {
  try {
    const supabase = await createClient()
    const updateRoom: UpdateRoomInput = await request.json()

    // Check if room exists
    const { data: existingRoom, error: checkError } = await supabase
      .from('room')
      .select('id')
      .eq('id', params.identifier)
      .single()

    if (checkError) {
      return createErrorResponse({
        code: 400,
        message: checkError.message,
        errors: [checkError.message],
      })
    }

    if (!existingRoom) {
      return createErrorResponse({
        code: 404,
        message: 'Room not found',
        errors: ['Invalid room ID'],
      })
    }

    // If room number is being updated, check if it's unique
    if (updateRoom.room_number) {
      const { data: roomWithNumber, error: numberError } = await supabase
        .from('room')
        .select('id')
        .eq('room_number', updateRoom.room_number)
        .neq('id', params.identifier)
        .single()

      if (numberError && numberError.code !== 'PGRST116') {
        return createErrorResponse({
          code: 400,
          message: numberError.message,
          errors: [numberError.message],
        })
      }

      if (roomWithNumber) {
        return createErrorResponse({
          code: 400,
          message: 'Room number already exists',
          errors: ['Room number must be unique'],
        })
      }
    }

    // If room class is being updated, check if it exists
    if (updateRoom.room_class_id) {
      const { data: roomClass, error: roomClassError } = await supabase
        .from('room_class')
        .select('id')
        .eq('id', updateRoom.room_class_id)
        .single()

      if (roomClassError || !roomClass) {
        return createErrorResponse({
          code: 404,
          message: 'Room class not found',
          errors: ['Invalid room_class_id'],
        })
      }
    }

    // If room status is being updated, check if it exists
    if (updateRoom.room_status_id) {
      const { data: roomStatus, error: roomStatusError } = await supabase
        .from('room_status')
        .select('id')
        .eq('id', updateRoom.room_status_id)
        .single()

      if (roomStatusError || !roomStatus) {
        return createErrorResponse({
          code: 404,
          message: 'Room status not found',
          errors: ['Invalid room_status_id'],
        })
      }
    }

    // Update room
    const { data: updated, error: updateError } = await supabase
      .from('room')
      .update(updateRoom)
      .eq('id', params.identifier)
      .select(
        `
        id,
        room_number,
        room_class_id,
        room_status_id,
        created_at,
        updated_at,
        room_class:room_class(
          id,
          room_class_name,
          description,
          base_occupancy,
          max_occupancy,
          base_rate,
          features:room_class_feature(
            feature:feature(
              id,
              feature_name
            )
          ),
          bed_types:room_class_bed_type(
            bed_type:bed_type(
              id,
              bed_type_name
            ),
            quantity
          )
        ),
        room_status:room_status(
          id,
          status_name,
          description,
          is_available,
          color_code
        )
      `
      )
      .single()

    if (updateError) {
      return createErrorResponse({
        code: 400,
        message: updateError.message,
        errors: [updateError.message],
      })
    }

    return createApiResponse({
      code: 200,
      message: 'Room updated successfully',
      data: updated,
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

export async function DELETE(_request: Request, { params }: { params: { identifier: string } }): Promise<Response> {
  try {
    const supabase = await createClient()

    // Check if room exists
    const { data: existingRoom, error: checkError } = await supabase
      .from('room')
      .select('id')
      .eq('id', params.identifier)
      .single()

    if (checkError) {
      return createErrorResponse({
        code: 400,
        message: checkError.message,
        errors: [checkError.message],
      })
    }

    if (!existingRoom) {
      return createErrorResponse({
        code: 404,
        message: 'Room not found',
        errors: ['Invalid room ID'],
      })
    }

    // Delete room
    const { error: deleteError } = await supabase.from('room').delete().eq('id', params.identifier)

    if (deleteError) {
      return createErrorResponse({
        code: 400,
        message: deleteError.message,
        errors: [deleteError.message],
      })
    }

    return createApiResponse({
      code: 204,
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
