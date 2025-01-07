import { createApiResponse, createErrorResponse } from '@/lib/api-response'
import { createClient } from '@/providers/supabase/server'

export async function GET(_request: Request, { params }: { params: { identifier: string } }) {
  try {
    const supabase = await createClient()
    const { identifier } = params

    const { data, error } = await supabase
      .from('room_class')
      .select(
        `
        *,
        features:room_class_feature(
          feature:feature(*)
        ),
        bed_types:room_class_bed_type(
          bed_type:bed_type(*),
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

export async function PUT(request: Request, { params }: { params: { identifier: string } }) {
  try {
    const supabase = await createClient()
    const { identifier } = params
    const { room_class_name, description, base_occupancy, max_occupancy, base_rate, features, bed_types } =
      await request.json()

    // Validate required fields
    const validationErrors: string[] = []
    if (!room_class_name) validationErrors.push('room_class_name is required')
    if (!base_occupancy) validationErrors.push('base_occupancy is required')
    if (!max_occupancy) validationErrors.push('max_occupancy is required')
    if (!base_rate) validationErrors.push('base_rate is required')
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
    if (base_occupancy > max_occupancy) {
      return createErrorResponse({
        code: 400,
        message: 'Invalid occupancy values',
        errors: ['base_occupancy cannot be greater than max_occupancy'],
      })
    }

    if (base_rate < 0) {
      return createErrorResponse({
        code: 400,
        message: 'Invalid base rate',
        errors: ['base_rate cannot be negative'],
      })
    }

    // Check if room class name already exists (excluding current room class)
    const { data: existingRoomClass } = await supabase
      .from('room_class')
      .select('id')
      .ilike('room_class_name', room_class_name)
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
        room_class_name,
        description,
        base_occupancy,
        max_occupancy,
        base_rate,
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
    if (features.length > 0) {
      const { error: featuresError } = await supabase.from('room_class_feature').insert(
        features.map((featureId: string) => ({
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
    if (bed_types.length > 0) {
      const { error: bedTypesError } = await supabase.from('room_class_bed_type').insert(
        bed_types.map((bt: { bed_type_id: string; quantity: number }) => ({
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
        *,
        features:room_class_feature(
          feature:feature(*)
        ),
        bed_types:room_class_bed_type(
          bed_type:bed_type(*),
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
      data: updatedRoomClass,
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

    // Check if room class has any rooms
    const { data: rooms } = await supabase.from('room').select('id').eq('room_class_id', identifier).limit(1)

    if (rooms && rooms.length > 0) {
      return createErrorResponse({
        code: 400,
        message: 'Cannot delete room class that has rooms',
        errors: ['Room class has one or more rooms associated with it'],
      })
    }

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
