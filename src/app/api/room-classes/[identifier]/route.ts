import { createClient } from '@/providers/supabase/server'
import { createApiResponse, createErrorResponse } from '@/services/apiResponse'
import type { RoomClassListItem, UpdateRoomClassBody } from '@/types/room-class'

export async function GET(_request: Request, { params }: { params: { identifier: string } }) {
  try {
    const supabase = await createClient()
    const { identifier } = params

    const { data, error } = await supabase
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
      data: data as RoomClassListItem,
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

export async function PUT(request: Request, { params }: { params: { identifier: string } }) {
  try {
    const supabase = await createClient()
    const { identifier } = params
    const { class_name, base_price, features, bed_types }: UpdateRoomClassBody = await request.json()

    // Validate required fields
    const validationErrors: string[] = []
    if (!class_name) validationErrors.push('class_name is required')
    if (!base_price) validationErrors.push('base_price is required')
    if (!Array.isArray(features)) validationErrors.push('features must be an array')
    if (!Array.isArray(bed_types)) validationErrors.push('bed_types must be an array')

    if (validationErrors.length > 0) {
      return createErrorResponse({
        code: 400,
        message: 'Missing required fields',
        errors: validationErrors,
      })
    }

    // Additional validation
    if ((base_price as number) < 0) {
      return createErrorResponse({
        code: 400,
        message: 'Invalid base price',
        errors: ['base_price cannot be negative'],
      })
    }

    // Check if room class name already exists (excluding current room class)
    const { data: existingRoomClass } = await supabase
      .from('room_class')
      .select('id')
      .ilike('class_name', class_name ?? '')
      .neq('id', identifier)
      .single()

    if (existingRoomClass) {
      return createErrorResponse({
        code: 400,
        message: 'Room class name already exists',
        errors: ['Room class name must be unique'],
      })
    }

    // Update room class
    const { error: roomClassError } = await supabase
      .from('room_class')
      .update({
        class_name,
        base_price,
      })
      .eq('id', identifier)

    if (roomClassError) {
      return createErrorResponse({
        code: 400,
        message: roomClassError.message,
        errors: [roomClassError.message],
      })
    }

    // Update features (delete and insert)
    await supabase.from('room_class_feature').delete().eq('room_class_id', identifier)
    if ((features ?? []).length > 0) {
      const { error: featuresError } = await supabase.from('room_class_feature').insert(
        (features ?? []).map((featureId: number) => ({
          room_class_id: identifier,
          feature_id: featureId,
        }))
      )

      if (featuresError) {
        return createErrorResponse({
          code: 400,
          message: 'Failed to update features',
          errors: [featuresError.message],
        })
      }
    }

    // Update bed types (delete and insert)
    await supabase.from('room_class_bed_type').delete().eq('room_class_id', identifier)
    if ((bed_types ?? []).length > 0) {
      const { error: bedTypesError } = await supabase.from('room_class_bed_type').insert(
        (bed_types ?? []).map((bt: { bed_type_id: number; quantity: number }) => ({
          room_class_id: identifier,
          bed_type_id: bt.bed_type_id,
          quantity: bt.quantity,
        }))
      )

      if (bedTypesError) {
        return createErrorResponse({
          code: 400,
          message: 'Failed to update bed types',
          errors: [bedTypesError.message],
        })
      }
    }

    // Get the updated room class data with relationships
    const { data: updatedRoomClass, error: fetchError } = await supabase
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
      .eq('id', identifier)
      .single()

    if (fetchError) {
      return createErrorResponse({
        code: 400,
        message: fetchError.message,
        errors: [fetchError.message],
      })
    }

    return createApiResponse({
      code: 200,
      message: 'Room class updated successfully',
      data: updatedRoomClass as RoomClassListItem,
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

export async function DELETE(_request: Request, { params }: { params: { identifier: string } }) {
  try {
    const supabase = await createClient()
    const { identifier } = params

    // Delete related records first
    await supabase.from('room_class_feature').delete().eq('room_class_id', identifier)
    await supabase.from('room_class_bed_type').delete().eq('room_class_id', identifier)

    // Delete room class
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
