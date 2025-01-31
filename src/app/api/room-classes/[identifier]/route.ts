import { FeatureListItem } from '@/app/api/features/types'
import { createClient } from '@/providers/supabase/server'
import { createApiResponse, createErrorResponse } from '@/services/apiResponse'
import type { UpdateRoomClassBody } from '@/types/room-class'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ identifier: string }> }
): Promise<Response> {
  try {
    const supabase = await createClient()
    const { identifier } = await params

    const { data, error } = await supabase
      .from('room_class')
      .select(
        `
        id,
        class_name,
        base_price,
        created_at,
        updated_at
      `
      )
      .eq('id', identifier)
      .single()

    if (error) {
      return createErrorResponse({
        code: 404,
        message: 'Room class not found',
        errors: [error.message],
      })
    }

    return createApiResponse({
      code: 200,
      message: 'Room class details retrieved successfully',
      data,
    })
  } catch (error) {
    console.error('Get room class details error:', error)
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
    const updateData: UpdateRoomClassBody = await request.json()

    // Validate required fields
    const validationErrors: string[] = []
    if (!updateData.class_name) validationErrors.push('class_name is required')
    if (!updateData.base_price) validationErrors.push('base_price is required')
    if (!updateData.bed_types?.length) validationErrors.push('At least one bed type is required')
    if (!updateData.feature_ids?.length) validationErrors.push('At least one feature is required')

    if (validationErrors.length > 0) {
      return createErrorResponse({
        code: 400,
        message: 'Missing required fields',
        errors: validationErrors,
      })
    }

    // Validate base_price is a positive number
    if (typeof updateData.base_price !== 'number' || updateData.base_price <= 0) {
      return createErrorResponse({
        code: 400,
        message: 'Invalid base price',
        errors: ['Base price must be a positive number'],
      })
    }

    // Validate bed types have positive num_beds
    const invalidBedTypes = updateData.bed_types?.filter((bt) => bt.num_beds <= 0)
    if (invalidBedTypes?.length) {
      return createErrorResponse({
        code: 400,
        message: 'Invalid number of beds',
        errors: ['Number of beds must be positive for all bed types'],
      })
    }

    // Check if room class name already exists (excluding current room class)
    const { data: existingRoomClass } = await supabase
      .from('room_class')
      .select('id')
      .ilike('class_name', updateData.class_name ?? '')
      .neq('id', identifier)
      .single()

    if (existingRoomClass) {
      return createErrorResponse({
        code: 400,
        message: 'Room class name already exists',
        errors: ['Room class name must be unique'],
      })
    }

    // Start transaction
    // 1. Update room class
    const { error: updateError } = await supabase
      .from('room_class')
      .update({
        class_name: updateData.class_name,
        base_price: updateData.base_price,
      })
      .eq('id', identifier)
      .select()
      .single()

    if (updateError) {
      return createErrorResponse({
        code: 400,
        message: updateError.message,
        errors: [updateError.message],
      })
    }

    // 2. Delete existing bed types and features
    const { error: deleteBedTypesError } = await supabase
      .from('room_class_bed_type')
      .delete()
      .eq('room_class_id', identifier)

    if (deleteBedTypesError) {
      return createErrorResponse({
        code: 400,
        message: deleteBedTypesError.message,
        errors: [deleteBedTypesError.message],
      })
    }

    const { error: deleteFeaturesError } = await supabase
      .from('room_class_feature')
      .delete()
      .eq('room_class_id', identifier)

    if (deleteFeaturesError) {
      return createErrorResponse({
        code: 400,
        message: deleteFeaturesError.message,
        errors: [deleteFeaturesError.message],
      })
    }

    // 3. Insert new bed types
    const { error: insertBedTypesError } = await supabase.from('room_class_bed_type').insert(
      (updateData.bed_types ?? []).map((bt) => ({
        room_class_id: identifier,
        bed_type_id: bt.bed_type_id,
        num_beds: bt.num_beds,
      }))
    )

    if (insertBedTypesError) {
      return createErrorResponse({
        code: 400,
        message: insertBedTypesError.message,
        errors: [insertBedTypesError.message],
      })
    }

    // 4. Insert new features
    const { error: insertFeaturesError } = await supabase.from('room_class_feature').insert(
      (updateData.feature_ids ?? []).map((featureId) => ({
        room_class_id: identifier,
        feature_id: featureId,
      }))
    )

    if (insertFeaturesError) {
      return createErrorResponse({
        code: 400,
        message: insertFeaturesError.message,
        errors: [insertFeaturesError.message],
      })
    }

    // Get the complete updated room class data
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
      .eq('id', identifier)
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
      code: 200,
      message: 'Room class updated successfully',
      data: response,
    })
  } catch (error) {
    console.error('Update room class error:', error)
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

    const { error } = await supabase.from('room_class').delete().eq('id', identifier)

    if (error) {
      return createErrorResponse({
        code: 400,
        message: error.message,
        errors: [error.message],
      })
    }

    return createApiResponse({
      code: 200,
      message: 'Room class deleted successfully',
    })
  } catch (error) {
    console.error('Delete room class error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}
