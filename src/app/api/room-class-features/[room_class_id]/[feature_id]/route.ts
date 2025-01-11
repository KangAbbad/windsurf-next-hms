import { createClient } from '@/providers/supabase/server'
import { createApiResponse, createErrorResponse } from '@/services/apiResponse'
import { RoomClassFeatureListItem, UpdateRoomClassFeatureBody } from '@/types/room-class-feature'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ room_class_id: string; feature_id: string }> }
): Promise<Response> {
  try {
    const supabase = await createClient()
    const { room_class_id, feature_id } = await params
    const updates: UpdateRoomClassFeatureBody = await request.json()

    const validationErrors: string[] = []
    if (!room_class_id) validationErrors.push('room_class_id is required')
    if (!feature_id) validationErrors.push('feature_id is required')
    if (!updates) validationErrors.push('update data is required')

    if (validationErrors.length > 0) {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: validationErrors,
      })
    }

    // Check if room class feature exists
    const { data: existingFeature, error: findError } = await supabase
      .from('room_class_feature')
      .select()
      .eq('room_class_id', room_class_id)
      .eq('feature_id', feature_id)
      .maybeSingle()

    if (findError) {
      return createErrorResponse({
        code: 500,
        message: 'Error checking room class feature',
        errors: [findError.message],
      })
    }

    if (!existingFeature) {
      return createErrorResponse({
        code: 404,
        message: 'Room class feature not found',
        errors: ['No matching room class feature found'],
      })
    }

    // Check if room class exists
    const { error: roomClassError } = await supabase.from('room_class').select().eq('id', room_class_id).single()

    if (roomClassError) {
      return createErrorResponse({
        code: 404,
        message: 'Room class not found',
        errors: ['Invalid room class ID'],
      })
    }

    // Check if feature exists
    const { error: featureError } = await supabase.from('feature').select().eq('id', feature_id).single()

    if (featureError) {
      return createErrorResponse({
        code: 404,
        message: 'Feature not found',
        errors: ['Invalid feature ID'],
      })
    }

    // Update with detailed response including related data
    const { data: updated, error: updateError } = await supabase
      .from('room_class_feature')
      .update({
        room_class_id: updates.new_room_class_id,
        feature_id: updates.new_feature_id,
      })
      .eq('room_class_id', room_class_id)
      .eq('feature_id', feature_id)
      .select(
        `
        room_class_id,
        feature_id,
        created_at,
        updated_at,
        room_class:room_class(
          id,
          class_name,
          base_price,
          created_at,
          updated_at
        ),
        feature:feature(
          id,
          feature_name,
          created_at,
          updated_at
        )
      `
      )
      .maybeSingle()

    if (updateError) {
      return createErrorResponse({
        code: 500,
        message: 'Failed to update room class feature',
        errors: [updateError.message],
      })
    }

    if (!updated) {
      return createErrorResponse({
        code: 404,
        message: 'Failed to update room class feature',
        errors: ['No rows were updated'],
      })
    }

    return createApiResponse<RoomClassFeatureListItem>({
      code: 200,
      message: 'Room class feature updated successfully',
      data: updated as unknown as RoomClassFeatureListItem,
    })
  } catch (error) {
    console.error('Update room class feature error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ room_class_id: string; feature_id: string }> }
): Promise<Response> {
  try {
    const supabase = await createClient()
    const { room_class_id, feature_id } = await params

    const validationErrors: string[] = []
    if (!room_class_id) validationErrors.push('room_class_id is required')
    if (!feature_id) validationErrors.push('feature_id is required')

    if (validationErrors.length > 0) {
      return createErrorResponse({
        code: 400,
        message: 'Missing required fields',
        errors: validationErrors,
      })
    }

    // Check if record exists first
    const { error: findError } = await supabase
      .from('room_class_feature')
      .select()
      .eq('room_class_id', room_class_id)
      .eq('feature_id', feature_id)
      .single()

    if (findError) {
      return createErrorResponse({
        code: 404,
        message: 'Room class feature not found',
        errors: [findError.message],
      })
    }

    // Delete the record
    const { error: deleteError } = await supabase
      .from('room_class_feature')
      .delete()
      .eq('room_class_id', room_class_id)
      .eq('feature_id', feature_id)

    if (deleteError) {
      return createErrorResponse({
        code: 500,
        message: 'Failed to delete room class feature',
        errors: [deleteError.message],
      })
    }

    return createApiResponse({
      code: 200,
      message: 'Room class feature deleted successfully',
    })
  } catch (error) {
    console.error('Delete room class feature error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}
