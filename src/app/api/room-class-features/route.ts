import { createClient } from '@/providers/supabase/server'
import { createApiResponse, createErrorResponse, PaginatedDataResponse } from '@/services/apiResponse'
import { CreateRoomClassFeatureBody, RoomClassFeatureListItem } from '@/types/room-class-feature'

export async function GET(request: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') ?? '1', 10)
    const limit = parseInt(searchParams.get('limit') ?? '10', 10)
    const search = searchParams.get('search') ?? ''
    const roomClassId = searchParams.get('room_class_id')

    const offset = (page - 1) * limit

    const supabase = await createClient()

    let query = supabase.from('room_class_feature').select(
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
      `,
      { count: 'exact' }
    )

    // Apply filters if provided
    if (search) {
      query = query.or(`class_name.ilike.%${search}%,features.feature.feature_name.ilike.%${search}%`)
    }
    if (roomClassId) {
      query = query.eq('id', roomClassId)
    }

    const {
      data: items,
      error,
      count,
    } = await query.range(offset, offset + limit - 1).order('room_class_id', { ascending: false })

    if (error) {
      return createErrorResponse({
        code: 400,
        message: error.message,
        errors: [error.message],
      })
    }

    const response: PaginatedDataResponse<RoomClassFeatureListItem> = {
      items: items as unknown as RoomClassFeatureListItem[],
      meta: {
        page,
        limit,
        total: count ?? 0,
        total_pages: Math.ceil((count ?? 0) / limit),
      },
    }

    return createApiResponse<PaginatedDataResponse<RoomClassFeatureListItem>>({
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
    const body: CreateRoomClassFeatureBody = await request.json()

    // Validate required fields
    if (!body.room_class_id || !body.feature_id) {
      return createErrorResponse({
        code: 400,
        message: 'Missing required fields',
        errors: [
          !body.room_class_id ? 'room_class_id is required' : '',
          !body.feature_id ? 'feature_id is required' : '',
        ].filter(Boolean),
      })
    }

    // Check if room class exists
    const { data: existingRoomClass, error: roomClassError } = await supabase
      .from('room_class')
      .select('id')
      .eq('id', body.room_class_id)
      .single()

    if (roomClassError || !existingRoomClass) {
      return createErrorResponse({
        code: 404,
        message: 'Room class not found',
        errors: ['Invalid room class ID'],
      })
    }

    // Check if feature exists
    const { data: existingFeature, error: featureError } = await supabase
      .from('feature')
      .select('id')
      .eq('id', body.feature_id)
      .single()

    if (featureError || !existingFeature) {
      return createErrorResponse({
        code: 404,
        message: 'Feature not found',
        errors: ['Invalid feature ID'],
      })
    }

    // Check if combination already exists
    const { data: existingCombo } = await supabase
      .from('room_class_feature')
      .select('id')
      .eq('room_class_id', body.room_class_id)
      .eq('feature_id', body.feature_id)
      .single()

    if (existingCombo) {
      return createErrorResponse({
        code: 400,
        message: 'Room class feature combination already exists',
        errors: ['This feature is already assigned to this room class'],
      })
    }

    const { data, error } = await supabase.from('room_class_feature').insert(body).select('*').single()

    if (error) {
      return createErrorResponse({
        code: 500,
        message: 'Failed to create room class feature',
        errors: [error.message],
      })
    }

    return createApiResponse<RoomClassFeatureListItem>({
      code: 201,
      message: 'Room class feature created successfully',
      data,
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
