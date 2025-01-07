import { createApiResponse, createErrorResponse } from '@/lib/api-response'
import { createClient } from '@/providers/supabase/server'
import type { CreateRoomClassInput, RoomClass, RoomClassResponse } from '@/types/room-class'

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
        room_class_name,
        description,
        base_occupancy,
        max_occupancy,
        base_rate,
        created_at,
        updated_at,
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
      `,
      { count: 'exact' }
    )

    // Apply search filter if provided
    if (search) {
      query = query.ilike('room_class_name', `%${search}%`)
    }

    const {
      data: roomClasses,
      error,
      count,
    } = await query.range(offset, offset + limit - 1).order('room_class_name', { ascending: true })

    if (error) {
      return createErrorResponse({
        code: 400,
        message: error.message,
        errors: [error.message],
      })
    }

    const response: RoomClassResponse = {
      room_classes: (roomClasses || []) as RoomClass[],
      pagination: {
        total: count,
        page,
        limit,
        total_pages: count ? Math.ceil(count / limit) : null,
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
    const newRoomClass: CreateRoomClassInput = await request.json()

    // Validate required fields
    const validationErrors: string[] = []
    if (!newRoomClass.room_class_name) validationErrors.push('room_class_name is required')
    if (!newRoomClass.base_occupancy) validationErrors.push('base_occupancy is required')
    if (!newRoomClass.max_occupancy) validationErrors.push('max_occupancy is required')
    if (!newRoomClass.base_rate) validationErrors.push('base_rate is required')
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
    if (newRoomClass.base_occupancy > newRoomClass.max_occupancy) {
      return createErrorResponse({
        code: 400,
        message: 'Invalid occupancy values',
        errors: ['base_occupancy cannot be greater than max_occupancy'],
      })
    }

    if (newRoomClass.base_rate < 0) {
      return createErrorResponse({
        code: 400,
        message: 'Invalid base rate',
        errors: ['base_rate cannot be negative'],
      })
    }

    // Check if room class name already exists
    const { data: existingRoomClass, error: checkError } = await supabase
      .from('room_class')
      .select('id')
      .ilike('room_class_name', newRoomClass.room_class_name)
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
          room_class_name: newRoomClass.room_class_name,
          description: newRoomClass.description,
          base_occupancy: newRoomClass.base_occupancy,
          max_occupancy: newRoomClass.max_occupancy,
          base_rate: newRoomClass.base_rate,
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
        room_class_name,
        description,
        base_occupancy,
        max_occupancy,
        base_rate,
        created_at,
        updated_at,
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
      data: completeRoomClass as RoomClass,
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
