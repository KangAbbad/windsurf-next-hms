import type { CreateRoomClassBody, RoomClassListItem } from './types'
import { FeatureListItem } from '../features/types'

import { createClient } from '@/providers/supabase/server'
import { createApiResponse, createErrorResponse, PaginatedDataResponse } from '@/services/apiResponse'

export async function GET(request: Request): Promise<Response> {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') ?? '1', 10)
    const limit = parseInt(searchParams.get('limit') ?? '10', 10)
    const offset = (page - 1) * limit
    const searchName = searchParams.get('search[name]')
    const searchPrice = searchParams.get('search[price]')
    const searchBedType = searchParams.get('search[bed_type]')

    let query = supabase.from('room_class').select('*', { count: 'exact' })

    if (searchName) {
      query = query.ilike('name', `%${searchName}%`)
    }
    if (searchPrice) {
      let minPrice: number = 0
      let maxPrice: number | null = null

      const cleanPriceFormat = searchPrice.trim()

      if (cleanPriceFormat.includes('-')) {
        const parts = cleanPriceFormat.split('-').map((part) => part.trim())
        if (parts.length === 2) {
          minPrice = parseFloat(parts[0]) || 0
          maxPrice = parseFloat(parts[1]) || null
        }
      } else {
        minPrice = parseFloat(cleanPriceFormat) || 0
      }

      if (maxPrice !== null && minPrice > maxPrice) {
        ;[minPrice, maxPrice] = [maxPrice, minPrice]
      }

      query = query.gte('price', minPrice)
      if (maxPrice !== null) query = query.lte('price', maxPrice)
    }
    if (searchBedType) {
      // If bed type filter is provided, get room class IDs that have this bed type
      let roomClassIds: string[] = []
      // First get the bed type IDs that match the name
      const { data: matchingBedTypes, error: bedTypeNameError } = await supabase
        .from('bed_type')
        .select('id')
        .ilike('name', `%${searchBedType}%`)

      if (bedTypeNameError) {
        return createErrorResponse({
          code: 400,
          message: bedTypeNameError.message,
          errors: [bedTypeNameError.message],
        })
      }

      if (!matchingBedTypes || matchingBedTypes.length === 0) {
        // No bed types match this name, return empty response
        return createApiResponse({
          code: 200,
          message: 'Room class list retrieved successfully',
          data: {
            items: [],
            meta: {
              page,
              limit,
              total: 0,
              total_pages: 0,
            },
          },
        })
      }

      // Then get room classes that have these bed types
      const bedTypeIds = matchingBedTypes.map((bt) => bt.id)
      const { data: bedTypeRelations, error: bedTypeError } = await supabase
        .from('room_class_bed_type')
        .select('room_class_id')
        .in('bed_type_id', bedTypeIds)

      if (bedTypeError) {
        return createErrorResponse({
          code: 400,
          message: bedTypeError.message,
          errors: [bedTypeError.message],
        })
      }

      if (!bedTypeRelations || bedTypeRelations.length === 0) {
        // No room classes with this bed type, return empty response
        return createApiResponse({
          code: 200,
          message: 'Room class list retrieved successfully',
          data: {
            items: [],
            meta: {
              page,
              limit,
              total: 0,
              total_pages: 0,
            },
          },
        })
      }

      roomClassIds = bedTypeRelations.map((relation) => relation.room_class_id)

      // Apply bed type filter if we have room class IDs
      if (roomClassIds.length) {
        query = query.in('id', roomClassIds)
      }
    }

    const {
      data: roomClasses,
      error: roomClassError,
      count,
    } = await query.range(offset, offset + limit - 1).order('name', { ascending: true })

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

    const items = await Promise.all(
      roomClasses.map(async (roomClass) => {
        const { data: bedTypes, error: bedTypesError } = await supabase
          .from('room_class_bed_type')
          .select('num_beds, bed_type_id, bed_type:bed_type_id(*)')
          .eq('room_class_id', roomClass.id)

        if (bedTypesError) {
          console.error('Error fetching bed types:', bedTypesError)
          return {
            ...roomClass,
            bed_types: [],
            features: [],
          }
        }

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

        const features = (featuresData ?? []).map((item) => item.feature) ?? []

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
    if (
      !newRoomClass.name &&
      typeof newRoomClass.price !== 'number' &&
      !newRoomClass.image_url &&
      !newRoomClass.bed_types.length &&
      !newRoomClass.feature_ids.length
    ) {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: ['All fields are required'],
      })
    }

    // Validate room class name is not empty
    if (!newRoomClass.name) {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: ['Room class name is required'],
      })
    }

    // Validate room class price is not empty
    if (typeof newRoomClass.price !== 'number') {
      return createErrorResponse({
        code: 400,
        message: 'Invalid room class price',
        errors: ['Room class price must be a number'],
      })
    }

    // Validate room class image_url is not empty
    if (!newRoomClass.image_url) {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: ['Room class image url is required'],
      })
    }

    // Validate room class bed_types is not empty
    if (!newRoomClass.bed_types.length) {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: ['Room class bed types are required'],
      })
    }

    // Validate room class feature_ids is not empty
    if (!newRoomClass.feature_ids.length) {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: ['Room class features are required'],
      })
    }

    // Validate bed types and features exist
    const { data: bedTypes, error: bedTypesError } = await supabase
      .from('bed_type')
      .select('id')
      .in(
        'id',
        newRoomClass.bed_types.map((bt) => bt.id)
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
      .ilike('name', newRoomClass.name)
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
          name: newRoomClass.name,
          price: newRoomClass.price,
          image_url: newRoomClass.image_url,
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
        bed_type_id: bt.id,
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
            bed_type_id,
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
