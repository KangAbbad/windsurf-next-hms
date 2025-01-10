import { createClient } from '@/providers/supabase/server'
import { createApiResponse, createErrorResponse, PaginatedDataResponse } from '@/services/apiResponse'
import type { CreateRoomClassBody, RoomClassListItem } from '@/types/room-class'

export async function GET(request: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url)
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    const page = parseInt(searchParams.get('page') || '1', 10)
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    const search = searchParams.get('search') || ''

    const offset = (page - 1) * limit

    const supabase = await createClient()

    let query = supabase.from('room_class').select(
      `
        id,
        class_name,
        base_price,
        created_at,
        updated_at,
        features:room_class_feature(
          feature:feature(
            id,
            feature_name,
            created_at,
            updated_at
          )
        ),
        bed_types:room_class_bed_type(
          bed_type:bed_type(
            id,
            bed_type_name
          ),
          quantity
        )
      `,
      { count: 'exact' }
    )

    // Apply search filter if provided
    if (search) {
      query = query.ilike('class_name', `%${search}%`)
    }

    const {
      data: items,
      error,
      count,
    } = await query.range(offset, offset + limit - 1).order('class_name', { ascending: true })

    if (error) {
      return createErrorResponse({
        code: 400,
        message: error.message,
        errors: [error.message],
      })
    }

    const response: PaginatedDataResponse<RoomClassListItem> = {
      items: items || [],
      meta: {
        page,
        limit,
        total: count ?? 0,
        total_pages: count ? Math.ceil(count / limit) : 0,
      },
    }

    return createApiResponse({
      code: 200,
      message: 'Room class list retrieved successfully',
      data: response,
    })
  } catch (error) {
    console.error('Get room classes error:', error)
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
    const newRoomClass: CreateRoomClassBody = await request.json()

    // Validate required fields
    const validationErrors: string[] = []
    if (!newRoomClass.class_name) validationErrors.push('class_name is required')
    if (!newRoomClass.base_price) validationErrors.push('base_price is required')
    if (!Array.isArray(newRoomClass.features)) validationErrors.push('features must be an array')
    if (!Array.isArray(newRoomClass.bed_types)) validationErrors.push('bed_types must be an array')

    if (validationErrors.length > 0) {
      return createErrorResponse({
        code: 400,
        message: 'Missing required fields',
        errors: validationErrors,
      })
    }

    // Additional validation
    if (newRoomClass.base_price < 0) {
      return createErrorResponse({
        code: 400,
        message: 'Invalid base price',
        errors: ['base_price cannot be negative'],
      })
    }

    // Check if room class name already exists
    const { data: existingRoomClass, error: checkError } = await supabase
      .from('room_class')
      .select('id')
      .ilike('class_name', newRoomClass.class_name)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      return createErrorResponse({
        code: 400,
        message: checkError.message,
        errors: [checkError.message],
      })
    }

    if (existingRoomClass) {
      return createErrorResponse({
        code: 400,
        message: 'Room class name already exists',
        errors: ['Room class name must be unique'],
      })
    }

    // Start a transaction
    const { data: roomClass, error: roomClassError } = await supabase
      .from('room_class')
      .insert([
        {
          class_name: newRoomClass.class_name,
          base_price: newRoomClass.base_price,
        },
      ])
      .select()
      .single()

    if (roomClassError) {
      return createErrorResponse({
        code: 400,
        message: roomClassError.message,
        errors: [roomClassError.message],
      })
    }

    // Insert features
    if (newRoomClass.features.length > 0) {
      const { error: featuresError } = await supabase.from('room_class_feature').insert(
        newRoomClass.features.map((featureId) => ({
          room_class_id: roomClass.id,
          feature_id: featureId,
        }))
      )

      if (featuresError) {
        // Rollback room class creation
        await supabase.from('room_class').delete().eq('id', roomClass.id)
        return createErrorResponse({
          code: 400,
          message: 'Failed to add features',
          errors: [featuresError.message],
        })
      }
    }

    // Insert bed types with quantities
    if (newRoomClass.bed_types.length > 0) {
      const { error: bedTypesError } = await supabase.from('room_class_bed_type').insert(
        newRoomClass.bed_types.map((bt) => ({
          room_class_id: roomClass.id,
          bed_type_id: bt.bed_type_id,
          quantity: bt.quantity,
        }))
      )

      if (bedTypesError) {
        // Rollback room class and features
        await supabase.from('room_class_feature').delete().eq('room_class_id', roomClass.id)
        await supabase.from('room_class').delete().eq('id', roomClass.id)
        return createErrorResponse({
          code: 400,
          message: 'Failed to add bed types',
          errors: [bedTypesError.message],
        })
      }
    }

    // Get the complete room class data with relationships
    const { data: completeRoomClass, error: fetchError } = await supabase
      .from('room_class')
      .select(
        `
        id,
        class_name,
        base_price,
        created_at,
        updated_at,
        features:room_class_feature(
          feature:feature(
            id,
            feature_name,
            created_at,
            updated_at
          )
        ),
        bed_types:room_class_bed_type(
          bed_type:bed_type(
            id,
            bed_type_name
          ),
          quantity
        )
      `
      )
      .eq('id', roomClass.id)
      .single()

    if (fetchError) {
      return createErrorResponse({
        code: 400,
        message: fetchError.message,
        errors: [fetchError.message],
      })
    }

    return createApiResponse({
      code: 201,
      message: 'Room class created successfully',
      data: completeRoomClass as RoomClassListItem,
    })
  } catch (error) {
    console.error('Create room class error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}
