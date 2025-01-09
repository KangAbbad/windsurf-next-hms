import { createClient } from '@/providers/supabase/server'
import { createApiResponse, createErrorResponse } from '@/services/apiResponse'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ identifier: string }> }
): Promise<Response> {
  try {
    const supabase = await createClient()
    const { identifier } = await params

    const { data, error } = await supabase
      .from('room_class_bed_type')
      .select(
        `
        *,
        room_class:room_class(
          id,
          room_class_name
        ),
        bed_type:bed_type(*)
      `
      )
      .eq('id', identifier)
      .single()

    if (error) {
      return createErrorResponse({
        code: 404,
        message: 'Room class bed type not found',
        errors: [error.message],
      })
    }

    return createApiResponse({
      code: 200,
      message: 'Room class bed type retrieved successfully',
      data,
    })
  } catch (error) {
    console.error('Get room class bed type error:', error)
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
    const { room_class_id, bed_type_id, quantity } = await request.json()

    // Validate required fields
    const validationErrors: string[] = []
    if (!room_class_id) validationErrors.push('room_class_id is required')
    if (!bed_type_id) validationErrors.push('bed_type_id is required')
    if (typeof quantity !== 'number' || quantity < 1) {
      validationErrors.push('quantity must be a positive number')
    }

    if (validationErrors.length > 0) {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: validationErrors,
      })
    }

    // Check if room class exists
    const { data: roomClass } = await supabase.from('room_class').select('id').eq('id', room_class_id).single()

    if (!roomClass) {
      return createErrorResponse({
        code: 404,
        message: 'Room class not found',
        errors: ['Invalid room_class_id'],
      })
    }

    // Check if bed type exists
    const { data: bedType } = await supabase.from('bed_type').select('id').eq('id', bed_type_id).single()

    if (!bedType) {
      return createErrorResponse({
        code: 404,
        message: 'Bed type not found',
        errors: ['Invalid bed_type_id'],
      })
    }

    // Check if relationship already exists (excluding current one)
    const { data: existingRelation } = await supabase
      .from('room_class_bed_type')
      .select('id')
      .eq('room_class_id', room_class_id)
      .eq('bed_type_id', bed_type_id)
      .neq('id', identifier)
      .single()

    if (existingRelation) {
      return createErrorResponse({
        code: 400,
        message: 'Relationship already exists',
        errors: ['This bed type is already assigned to the room class'],
      })
    }

    // Update the relationship
    const { data, error } = await supabase
      .from('room_class_bed_type')
      .update({
        room_class_id,
        bed_type_id,
        quantity,
      })
      .eq('id', identifier)
      .select(
        `
        *,
        room_class:room_class(
          id,
          room_class_name
        ),
        bed_type:bed_type(*)
      `
      )
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
      message: 'Room class bed type updated successfully',
      data,
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
  _request: Request,
  { params }: { params: Promise<{ identifier: string }> }
): Promise<Response> {
  try {
    const supabase = await createClient()
    const { identifier } = await params

    // Check if any rooms of this class exist
    const { data: roomClassBedType } = await supabase
      .from('room_class_bed_type')
      .select('room_class_id')
      .eq('id', identifier)
      .single()

    if (roomClassBedType) {
      const { data: rooms } = await supabase
        .from('room')
        .select('id')
        .eq('room_class_id', roomClassBedType.room_class_id)
        .limit(1)

      if (rooms && rooms.length > 0) {
        return createErrorResponse({
          code: 400,
          message: 'Cannot delete bed type from room class that has rooms',
          errors: ['Room class has one or more rooms associated with it'],
        })
      }
    }

    const { error } = await supabase.from('room_class_bed_type').delete().eq('id', identifier)

    if (error) {
      return createErrorResponse({
        code: 400,
        message: error.message,
        errors: [error.message],
      })
    }

    return createApiResponse({
      code: 200,
      message: 'Room class bed type deleted successfully',
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
