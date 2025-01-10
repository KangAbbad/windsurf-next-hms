import { createClient } from '@/providers/supabase/server'
import { createApiResponse, createErrorResponse } from '@/services/apiResponse'
import { UpdateRoomClassBedTypeBody } from '@/types/room-class-bed-type'

export async function PUT(
  request: Request,
  { params }: { params: { room_class_id: string; bed_type_id: string } }
): Promise<Response> {
  try {
    const supabase = await createClient()
    const updateData: UpdateRoomClassBedTypeBody = await request.json()
    const { num_beds } = updateData
    const { room_class_id, bed_type_id } = params

    const validationErrors: string[] = []
    if (!room_class_id) validationErrors.push('room_class_id is required')
    if (!bed_type_id) validationErrors.push('bed_type_id is required')
    if (!num_beds) validationErrors.push('num_beds is required')

    if (validationErrors.length > 0) {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: validationErrors,
      })
    }

    // Check if record exists
    const { error: findError } = await supabase
      .from('room_class_bed_type')
      .select()
      .eq('room_class_id', room_class_id)
      .eq('bed_type_id', bed_type_id)
      .single()

    if (findError) {
      return createErrorResponse({
        code: 404,
        message: 'Record not found',
        errors: [findError.message],
      })
    }

    // Update the record
    const { data: updated, error: updateError } = await supabase
      .from('room_class_bed_type')
      .update({ num_beds })
      .eq('room_class_id', room_class_id)
      .eq('bed_type_id', bed_type_id)
      .select(
        `
        room_class_id,
        bed_type_id,
        num_beds,
        created_at,
        updated_at,
        room_class:room_class(
          id,
          class_name
        ),
        bed_type:bed_type(
          id,
          bed_type_name
        )
      `
      )
      .single()

    if (updateError) {
      return createErrorResponse({
        code: 400,
        message: 'Failed to update room class bed type',
        errors: [updateError.message],
      })
    }

    return createApiResponse({
      code: 200,
      message: 'Room class bed type updated successfully',
      data: updated,
    })
  } catch (error) {
    console.error('Update room class bed type error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { room_class_id: string; bed_type_id: string } }
): Promise<Response> {
  try {
    const supabase = await createClient()
    const { room_class_id, bed_type_id } = params

    // Check if record exists
    const { error: findError } = await supabase
      .from('room_class_bed_type')
      .select()
      .eq('room_class_id', room_class_id)
      .eq('bed_type_id', bed_type_id)
      .single()

    if (findError) {
      return createErrorResponse({
        code: 404,
        message: 'Record not found',
        errors: [findError.message],
      })
    }

    // Delete the record
    const { error: deleteError } = await supabase
      .from('room_class_bed_type')
      .delete()
      .eq('room_class_id', room_class_id)
      .eq('bed_type_id', bed_type_id)

    if (deleteError) {
      return createErrorResponse({
        code: 400,
        message: 'Failed to delete room class bed type',
        errors: [deleteError.message],
      })
    }

    return createApiResponse({
      code: 200,
      message: 'Room class bed type deleted successfully',
      data: null,
    })
  } catch (error) {
    console.error('Delete room class bed type error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}
