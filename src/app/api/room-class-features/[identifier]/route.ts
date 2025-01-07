import { createApiResponse, createErrorResponse } from '@/lib/api-response'
import { createClient } from '@/providers/supabase/server'

export async function GET(_request: Request, { params }: { params: { identifier: string } }) {
  try {
    const supabase = await createClient()
    const { identifier } = params

    const { data, error } = await supabase
      .from('room_class_feature')
      .select(
        `
        *,
        room_class:room_class(
          id,
          room_class_name
        ),
        feature:feature(*)
      `
      )
      .eq('id', identifier)
      .single()

    if (error) {
      return createErrorResponse({
        code: 404,
        message: 'Room class feature not found',
        errors: [error.message],
      })
    }

    return createApiResponse({
      code: 200,
      message: 'Room class feature retrieved successfully',
      data,
    })
  } catch (error) {
    console.error('Get room class feature error:', error)
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
    const { room_class_id, feature_id } = await request.json()

    // Validate required fields
    if (!room_class_id || !feature_id) {
      return createErrorResponse({
        code: 400,
        message: 'Missing required fields',
        errors: ['room_class_id and feature_id are required'],
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

    // Check if feature exists
    const { data: feature } = await supabase.from('feature').select('id').eq('id', feature_id).single()

    if (!feature) {
      return createErrorResponse({
        code: 404,
        message: 'Feature not found',
        errors: ['Invalid feature_id'],
      })
    }

    // Check if relationship already exists (excluding current one)
    const { data: existingRelation } = await supabase
      .from('room_class_feature')
      .select('id')
      .eq('room_class_id', room_class_id)
      .eq('feature_id', feature_id)
      .neq('id', identifier)
      .single()

    if (existingRelation) {
      return createErrorResponse({
        code: 400,
        message: 'Relationship already exists',
        errors: ['This feature is already assigned to the room class'],
      })
    }

    // Update the relationship
    const { data, error } = await supabase
      .from('room_class_feature')
      .update({
        room_class_id,
        feature_id,
      })
      .eq('id', identifier)
      .select(
        `
        *,
        room_class:room_class(
          id,
          room_class_name
        ),
        feature:feature(*)
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
      message: 'Room class feature updated successfully',
      data,
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

export async function DELETE(_request: Request, { params }: { params: { identifier: string } }) {
  try {
    const supabase = await createClient()
    const { identifier } = params

    const { error } = await supabase.from('room_class_feature').delete().eq('id', identifier)

    if (error) {
      return createErrorResponse({
        code: 400,
        message: error.message,
        errors: [error.message],
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
