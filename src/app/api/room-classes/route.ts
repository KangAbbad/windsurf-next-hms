import { FeatureListItem } from '../features/types'

import { createClient } from '@/providers/supabase/server'
import { createApiResponse, createErrorResponse, PaginatedDataResponse } from '@/services/apiResponse'
import type { CreateRoomClassBody, RoomClassListItem } from '@/types/room-class'

export async function GET(request: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') ?? '1', 10)
    const limit = parseInt(searchParams.get('limit') ?? '10', 10)
    const search = searchParams.get('search') ?? ''

    const offset = (page - 1) * limit

    const supabase = await createClient()

    // First get the room classes
    const {
      data: roomClasses,
      error: roomClassError,
      count,
    } = await supabase
      .from('room_class')
      .select('*', { count: 'exact' })
      .ilike('class_name', `%${search}%`)
      .range(offset, offset + limit - 1)
      .order('class_name', { ascending: true })

    if (roomClassError) {
      return createErrorResponse({
        code: 400,
        message: roomClassError.message,
        errors: [roomClassError.message],
      })
    }

    if (!roomClasses) {
      return createErrorResponse({
        code: 404,
        message: 'No room classes found',
        errors: ['No room classes found'],
      })
    }

    // Fetch details for each room class in parallel
    const items = await Promise.all(
      roomClasses.map(async (roomClass) => {
        // Fetch bed types
        const { data: bedTypes, error: bedTypesError } = await supabase
          .from('room_class_bed_type')
          .select('num_beds, bed_type:bed_type_id(*)')
          .eq('room_class_id', roomClass.id)

        if (bedTypesError) {
          console.error('Error fetching bed types:', bedTypesError)
          return {
            ...roomClass,
            bed_types: [],
            features: [],
          }
        }

        // Fetch features
        const { data: featuresData, error: featuresError } = await supabase
          .from('room_class_feature')
          .select('feature(*)')
          .eq('room_class_id', roomClass.id)

        if (featuresError) {
          console.error('Error fetching features:', featuresError)
          return {
            ...roomClass,
            bed_types: bedTypes,
            features: [],
          }
        }

        // Transform features data
        const features = (featuresData ?? []).map((item) => item.feature) ?? []

        // Combine the results
        return {
          ...roomClass,
          bed_types: bedTypes,
          features,
        }
      })
    )

    const response: PaginatedDataResponse<RoomClassListItem> = {
      items,
      meta: {
        page,
        limit,
        total: count ?? 0,
        total_pages: count ? Math.ceil(count / limit) : 1,
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
    if (!newRoomClass.class_name || !newRoomClass.base_price) {
      return createErrorResponse({
        code: 400,
        message: 'Missing required fields',
        errors: ['class_name and base_price are required'],
      })
    }

    // Validate base_price is a positive number
    if (typeof newRoomClass.base_price !== 'number' || newRoomClass.base_price <= 0) {
      return createErrorResponse({
        code: 400,
        message: 'Invalid base price',
        errors: ['Base price must be a positive number'],
      })
    }

    // Validate bed types and features exist
    const { data: bedTypes, error: bedTypesError } = await supabase
      .from('bed_type')
      .select('id')
      .in(
        'id',
        newRoomClass.bed_types.map((bt) => bt.bed_type_id)
      )

    if (bedTypesError || !bedTypes || bedTypes.length !== newRoomClass.bed_types.length) {
      return createErrorResponse({
        code: 400,
        message: 'Invalid bed types',
        errors: ['One or more bed types do not exist'],
      })
    }

    // Validate num_beds is positive for each bed type
    const invalidBedTypes = newRoomClass.bed_types.filter((bt) => bt.num_beds <= 0)
    if (invalidBedTypes.length > 0) {
      return createErrorResponse({
        code: 400,
        message: 'Invalid number of beds',
        errors: ['Number of beds must be positive for all bed types'],
      })
    }

    const { data: features, error: featuresError } = await supabase
      .from('feature')
      .select('id')
      .in('id', newRoomClass.feature_ids)

    if (featuresError || !features || features.length !== newRoomClass.feature_ids.length) {
      return createErrorResponse({
        code: 400,
        message: 'Invalid features',
        errors: ['One or more features do not exist'],
      })
    }

    // Check if room class name already exists
    const { data: existingRoomClass } = await supabase
      .from('room_class')
      .select('id')
      .ilike('class_name', newRoomClass.class_name)
      .single()

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

    // Insert bed types
    const { error: bedTypesInsertError } = await supabase.from('room_class_bed_type').insert(
      newRoomClass.bed_types.map((bt) => ({
        room_class_id: roomClass.id,
        bed_type_id: bt.bed_type_id,
        num_beds: bt.num_beds,
      }))
    )

    if (bedTypesInsertError) {
      // Rollback by deleting the room class
      await supabase.from('room_class').delete().eq('id', roomClass.id)
      return createErrorResponse({
        code: 400,
        message: bedTypesInsertError.message,
        errors: [bedTypesInsertError.message],
      })
    }

    // Insert features
    const { error: featuresInsertError } = await supabase.from('room_class_feature').insert(
      newRoomClass.feature_ids.map((featureId) => ({
        room_class_id: roomClass.id,
        feature_id: featureId,
      }))
    )

    if (featuresInsertError) {
      // Rollback by deleting the room class (this will cascade delete bed types)
      await supabase.from('room_class').delete().eq('id', roomClass.id)
      return createErrorResponse({
        code: 400,
        message: featuresInsertError.message,
        errors: [featuresInsertError.message],
      })
    }

    // Get the complete room class data with relationships
    const { data: completeRoomClass, error: fetchError } = await supabase
      .from('room_class')
      .select(
        `
          *,
          room_class_bed_type!inner(
            num_beds,
            bed_type:bed_type_id(*)
          ),
          room_class_feature!inner(
            feature(*)
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

    // Transform the response to match RoomClassListItem type
    const response = {
      ...completeRoomClass,
      bed_types: completeRoomClass.room_class_bed_type,
      features: completeRoomClass.room_class_feature.map((f: { feature: FeatureListItem }) => f.feature),
    }

    return createApiResponse({
      code: 201,
      message: 'Room class created successfully',
      data: response,
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
