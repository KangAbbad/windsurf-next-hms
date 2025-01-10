import { createClient } from '@/providers/supabase/server'
import { createApiResponse, createErrorResponse } from '@/services/apiResponse'
import { RoomClassFeatureListItem, UpdateRoomClassFeatureBody } from '@/types/room-class-feature'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ identifier: string }> }
): Promise<Response> {
  try {
    const supabase = await createClient()
    const { identifier } = await params

    const { data, error } = await supabase.from('room_class_feature').select('*').eq('id', identifier).single()

    if (error) {
      return createErrorResponse({
        code: 404,
        message: 'Room class feature not found',
        errors: [error.message],
      })
    }

    return createApiResponse<RoomClassFeatureListItem>({
      code: 200,
      message: 'Room class feature details retrieved successfully',
      data: data as RoomClassFeatureListItem,
    })
  } catch (error) {
    console.error('Get room class feature details error:', error)
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
    const updates: UpdateRoomClassFeatureBody = await request.json()

    // Check if room class feature exists
    const { data: existingFeature, error: checkError } = await supabase
      .from('room_class_feature')
      .select('id')
      .eq('id', identifier)
      .single()

    if (checkError || !existingFeature) {
      return createErrorResponse({
        code: 404,
        message: 'Room class feature not found',
        errors: ['Invalid room class feature ID'],
      })
    }

    if (updates.room_class_id) {
      // Check if room class exists
      const { data: existingRoomClass, error: roomClassError } = await supabase
        .from('room_class')
        .select('id')
        .eq('id', updates.room_class_id)
        .single()

      if (roomClassError || !existingRoomClass) {
        return createErrorResponse({
          code: 404,
          message: 'Room class not found',
          errors: ['Invalid room class ID'],
        })
      }
    }

    if (updates.feature_id) {
      // Check if feature exists
      const { data: existingFeature, error: featureError } = await supabase
        .from('feature')
        .select('id')
        .eq('id', updates.feature_id)
        .single()

      if (featureError || !existingFeature) {
        return createErrorResponse({
          code: 404,
          message: 'Feature not found',
          errors: ['Invalid feature ID'],
        })
      }
    }

    const { data, error } = await supabase
      .from('room_class_feature')
      .update(updates)
      .eq('id', identifier)
      .select()
      .single()

    if (error) {
      return createErrorResponse({
        code: 500,
        message: 'Failed to update room class feature',
        errors: [error.message],
      })
    }

    return createApiResponse<RoomClassFeatureListItem>({
      code: 200,
      message: 'Room class feature updated successfully',
      data: data as RoomClassFeatureListItem,
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
  { params }: { params: Promise<{ identifier: string }> }
): Promise<Response> {
  try {
    const supabase = await createClient()
    const { identifier } = await params

    // Check if room class feature exists
    const { data: existingFeature, error: checkError } = await supabase
      .from('room_class_feature')
      .select('id')
      .eq('id', identifier)
      .single()

    if (checkError || !existingFeature) {
      return createErrorResponse({
        code: 404,
        message: 'Room class feature not found',
        errors: ['Invalid room class feature ID'],
      })
    }

    const { error } = await supabase.from('room_class_feature').delete().eq('id', identifier)

    if (error) {
      return createErrorResponse({
        code: 500,
        message: 'Failed to delete room class feature',
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
