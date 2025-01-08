import { createClient } from '@/providers/supabase/server'
import { createApiResponse, createErrorResponse } from '@/services/apiResponse'
import type {
  CreateRoomClassFeatureInput,
  RoomClassFeature,
  RoomClassFeatureResponse,
} from '@/types/room-class-feature'

export async function GET(request: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url)
    const roomClassId = searchParams.get('room_class_id')
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    const page = parseInt(searchParams.get('page') || '1', 10)
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    const limit = parseInt(searchParams.get('limit') || '10', 10)

    const offset = (page - 1) * limit

    const supabase = await createClient()

    let query = supabase.from('room_class_feature').select(
      `
        id,
        room_class_id,
        feature_id,
        created_at,
        updated_at,
        room_class:room_class(
          id,
          room_class_name
        ),
        feature:feature(
          id,
          feature_name
        )
      `,
      { count: 'exact' }
    )

    // Filter by room class if provided
    if (roomClassId) {
      query = query.eq('room_class_id', roomClassId)
    }

    const {
      data: roomClassFeatures,
      error,
      count,
    } = await query.range(offset, offset + limit - 1).order('created_at', { ascending: false })

    if (error) {
      return createErrorResponse({
        code: 400,
        message: error.message,
        errors: [error.message],
      })
    }

    const response: RoomClassFeatureResponse = {
      room_class_features: (roomClassFeatures || []) as RoomClassFeature[],
      pagination: {
        total: count,
        page,
        limit,
        total_pages: count ? Math.ceil(count / limit) : null,
      },
    }

    return createApiResponse({
      code: 200,
      message: 'Room class features retrieved successfully',
      data: response,
    })
  } catch (error) {
    console.error('Get room class features error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const supabase = await createClient()
    const newRoomClassFeature: CreateRoomClassFeatureInput = await request.json()

    // Validate required fields
    if (!newRoomClassFeature.room_class_id || !newRoomClassFeature.feature_id) {
      return createErrorResponse({
        code: 400,
        message: 'Missing required fields',
        errors: ['room_class_id and feature_id are required'],
      })
    }

    // Check if room class exists
    const { data: roomClass, error: roomClassError } = await supabase
      .from('room_class')
      .select('id')
      .eq('id', newRoomClassFeature.room_class_id)
      .single()

    if (roomClassError || !roomClass) {
      return createErrorResponse({
        code: 404,
        message: 'Room class not found',
        errors: ['Invalid room_class_id'],
      })
    }

    // Check if feature exists
    const { data: feature, error: featureError } = await supabase
      .from('feature')
      .select('id')
      .eq('id', newRoomClassFeature.feature_id)
      .single()

    if (featureError || !feature) {
      return createErrorResponse({
        code: 404,
        message: 'Feature not found',
        errors: ['Invalid feature_id'],
      })
    }

    // Check if relationship already exists
    const { data: existingRelation, error: existingError } = await supabase
      .from('room_class_feature')
      .select('id')
      .eq('room_class_id', newRoomClassFeature.room_class_id)
      .eq('feature_id', newRoomClassFeature.feature_id)
      .single()

    if (existingError && existingError.code !== 'PGRST116') {
      return createErrorResponse({
        code: 400,
        message: 'Error checking existing relationship',
        errors: [existingError.message],
      })
    }

    if (existingRelation) {
      return createErrorResponse({
        code: 400,
        message: 'Relationship already exists',
        errors: ['This feature is already assigned to the room class'],
      })
    }

    // Create the relationship
    const { data: created, error: createError } = await supabase
      .from('room_class_feature')
      .insert([newRoomClassFeature])
      .select(
        `
        id,
        room_class_id,
        feature_id,
        created_at,
        updated_at,
        room_class:room_class(
          id,
          room_class_name
        ),
        feature:feature(
          id,
          feature_name
        )
      `
      )
      .single()

    if (createError) {
      return createErrorResponse({
        code: 400,
        message: createError.message,
        errors: [createError.message],
      })
    }

    return createApiResponse({
      code: 201,
      message: 'Room class feature created successfully',
      data: created,
    })
  } catch (error) {
    console.error('Create room class feature error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}

export async function DELETE(request: Request): Promise<Response> {
  try {
    const supabase = await createClient()
    const { id } = await request.json()

    if (!id) {
      return createErrorResponse({
        code: 400,
        message: 'Missing required fields',
        errors: ['id is required'],
      })
    }

    // Check if record exists and get its details
    const { data: roomClassFeature, error: checkError } = await supabase
      .from('room_class_feature')
      .select('id, room_class_id')
      .eq('id', id)
      .single()

    if (checkError) {
      return createErrorResponse({
        code: 404,
        message: 'Room class feature not found',
        errors: ['Invalid room class feature ID'],
      })
    }

    // Check if any room is using this room class
    const { data: rooms, error: roomError } = await supabase
      .from('room')
      .select('id')
      .eq('room_class_id', roomClassFeature.room_class_id)
      .limit(1)
      .single()

    if (roomError && roomError.code !== 'PGRST116') {
      return createErrorResponse({
        code: 400,
        message: 'Error checking room usage',
        errors: [roomError.message],
      })
    }

    if (rooms) {
      return createErrorResponse({
        code: 400,
        message: 'Room class feature in use',
        errors: ['Cannot delete feature from room class that is being used by rooms'],
      })
    }

    // Delete the record
    const { error: deleteError } = await supabase.from('room_class_feature').delete().eq('id', id)

    if (deleteError) {
      return createErrorResponse({
        code: 400,
        message: deleteError.message,
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
