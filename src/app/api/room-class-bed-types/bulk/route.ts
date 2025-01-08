import { createClient } from '@/providers/supabase/server'
import { createApiResponse, createErrorResponse } from '@/services/apiResponse'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { room_class_bed_types } = await request.json()

    if (!Array.isArray(room_class_bed_types) || room_class_bed_types.length === 0) {
      return createErrorResponse({
        code: 400,
        message: 'Invalid request body',
        errors: ['room_class_bed_types must be a non-empty array'],
      })
    }

    // Validate all entries
    const validationErrors: string[] = []
    const uniqueKeys = new Set<string>()

    room_class_bed_types.forEach((rcbt, index) => {
      if (!rcbt.room_class_id) {
        validationErrors.push(`Entry at index ${index} is missing room_class_id`)
      }
      if (!rcbt.bed_type_id) {
        validationErrors.push(`Entry at index ${index} is missing bed_type_id`)
      }
      if (typeof rcbt.quantity !== 'number' || rcbt.quantity < 1) {
        validationErrors.push(`Entry at index ${index} has invalid quantity`)
      }

      const key = `${rcbt.room_class_id}-${rcbt.bed_type_id}`
      if (uniqueKeys.has(key)) {
        validationErrors.push(`Duplicate room class and bed type combination at index ${index}`)
      }
      uniqueKeys.add(key)
    })

    if (validationErrors.length > 0) {
      return createErrorResponse({
        code: 400,
        message: 'Validation failed',
        errors: validationErrors,
      })
    }

    // Check if all room classes exist
    const roomClassIds = [...new Set(room_class_bed_types.map((rcbt) => rcbt.room_class_id))]
    const { data: roomClasses } = await supabase.from('room_class').select('id').in('id', roomClassIds)

    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    const existingRoomClassIds = new Set(roomClasses?.map((rc) => rc.id) || [])
    const invalidRoomClassIds = roomClassIds.filter((id) => !existingRoomClassIds.has(id))

    if (invalidRoomClassIds.length > 0) {
      return createErrorResponse({
        code: 404,
        message: 'Invalid room classes',
        errors: invalidRoomClassIds.map((id) => `Room class with id '${id}' not found`),
      })
    }

    // Check if all bed types exist
    const bedTypeIds = [...new Set(room_class_bed_types.map((rcbt) => rcbt.bed_type_id))]
    const { data: bedTypes } = await supabase.from('bed_type').select('id').in('id', bedTypeIds)

    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    const existingBedTypeIds = new Set(bedTypes?.map((bt) => bt.id) || [])
    const invalidBedTypeIds = bedTypeIds.filter((id) => !existingBedTypeIds.has(id))

    if (invalidBedTypeIds.length > 0) {
      return createErrorResponse({
        code: 404,
        message: 'Invalid bed types',
        errors: invalidBedTypeIds.map((id) => `Bed type with id '${id}' not found`),
      })
    }

    // Check for existing relationships
    const existingRelations = await Promise.all(
      room_class_bed_types.map(async (rcbt) => {
        const { data } = await supabase
          .from('room_class_bed_type')
          .select('id')
          .eq('room_class_id', rcbt.room_class_id)
          .eq('bed_type_id', rcbt.bed_type_id)
          .single()
        return data ? `${rcbt.room_class_id}-${rcbt.bed_type_id}` : null
      })
    )

    const duplicateRelations = existingRelations.filter(Boolean)
    if (duplicateRelations.length > 0) {
      return createErrorResponse({
        code: 400,
        message: 'Duplicate relationships found',
        errors: duplicateRelations.map((rel) => `Relationship '${rel}' already exists`),
      })
    }

    // Insert all relationships
    const { data, error } = await supabase
      .from('room_class_bed_type')
      .insert(room_class_bed_types)
      .select(
        `
        *,
        room_class:room_class(
          id,
          room_class_name
        ),
        bed_type:bed_type(*)
      `
      )

    if (error) {
      return createErrorResponse({
        code: 400,
        message: error.message,
        errors: [error.message],
      })
    }

    return createApiResponse({
      code: 201,
      message: 'Room class bed types created successfully',
      data,
    })
  } catch (error) {
    console.error('Bulk create room class bed types error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    const { room_class_bed_types } = await request.json()

    if (!Array.isArray(room_class_bed_types) || room_class_bed_types.length === 0) {
      return createErrorResponse({
        code: 400,
        message: 'Invalid request body',
        errors: ['room_class_bed_types must be a non-empty array'],
      })
    }

    // Validate all entries
    const validationErrors: string[] = []
    const uniqueKeys = new Set<string>()
    const uniqueIds = new Set<string>()

    room_class_bed_types.forEach((rcbt, index) => {
      if (!rcbt.id) {
        validationErrors.push(`Entry at index ${index} is missing id`)
      }
      if (!rcbt.room_class_id) {
        validationErrors.push(`Entry at index ${index} is missing room_class_id`)
      }
      if (!rcbt.bed_type_id) {
        validationErrors.push(`Entry at index ${index} is missing bed_type_id`)
      }
      if (typeof rcbt.quantity !== 'number' || rcbt.quantity < 1) {
        validationErrors.push(`Entry at index ${index} has invalid quantity`)
      }

      if (uniqueIds.has(rcbt.id)) {
        validationErrors.push(`Duplicate id at index ${index}`)
      }
      uniqueIds.add(rcbt.id)

      const key = `${rcbt.room_class_id}-${rcbt.bed_type_id}`
      if (uniqueKeys.has(key)) {
        validationErrors.push(`Duplicate room class and bed type combination at index ${index}`)
      }
      uniqueKeys.add(key)
    })

    if (validationErrors.length > 0) {
      return createErrorResponse({
        code: 400,
        message: 'Validation failed',
        errors: validationErrors,
      })
    }

    // Check if all room classes exist
    const roomClassIds = [...new Set(room_class_bed_types.map((rcbt) => rcbt.room_class_id))]
    const { data: roomClasses } = await supabase.from('room_class').select('id').in('id', roomClassIds)

    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    const existingRoomClassIds = new Set(roomClasses?.map((rc) => rc.id) || [])
    const invalidRoomClassIds = roomClassIds.filter((id) => !existingRoomClassIds.has(id))

    if (invalidRoomClassIds.length > 0) {
      return createErrorResponse({
        code: 404,
        message: 'Invalid room classes',
        errors: invalidRoomClassIds.map((id) => `Room class with id '${id}' not found`),
      })
    }

    // Check if all bed types exist
    const bedTypeIds = [...new Set(room_class_bed_types.map((rcbt) => rcbt.bed_type_id))]
    const { data: bedTypes } = await supabase.from('bed_type').select('id').in('id', bedTypeIds)

    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    const existingBedTypeIds = new Set(bedTypes?.map((bt) => bt.id) || [])
    const invalidBedTypeIds = bedTypeIds.filter((id) => !existingBedTypeIds.has(id))

    if (invalidBedTypeIds.length > 0) {
      return createErrorResponse({
        code: 404,
        message: 'Invalid bed types',
        errors: invalidBedTypeIds.map((id) => `Bed type with id '${id}' not found`),
      })
    }

    // Update relationships one by one to maintain atomicity
    const results = await Promise.all(
      room_class_bed_types.map(async (rcbt) => {
        // Check for conflicts (excluding current relationship)
        const { data: conflict } = await supabase
          .from('room_class_bed_type')
          .select('id')
          .eq('room_class_id', rcbt.room_class_id)
          .eq('bed_type_id', rcbt.bed_type_id)
          .neq('id', rcbt.id)
          .single()

        if (conflict) {
          return {
            id: rcbt.id,
            success: false,
            error: { message: 'Relationship already exists' },
          }
        }

        const { id, created_at, updated_at, ...updates } = rcbt
        const { data, error } = await supabase
          .from('room_class_bed_type')
          .update(updates)
          .eq('id', id)
          .select(
            `
            *,
            room_class:room_class(
              id,
              room_class_name
            ),
            bed_type:bed_type(*)
          `
          )
          .single()

        return { id, success: !error, data, error }
      })
    )

    const errors = results
      .filter((r) => !r.success)
      .map((r) => `Failed to update relationship ${r.id}: ${r.error?.message}`)

    if (errors.length > 0) {
      return createErrorResponse({
        code: 400,
        message: 'Some updates failed',
        errors,
      })
    }

    return createApiResponse({
      code: 200,
      message: 'Room class bed types updated successfully',
      data: results.map((r) => r.data),
    })
  } catch (error) {
    console.error('Bulk update room class bed types error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { ids } = await request.json()

    if (!Array.isArray(ids) || ids.length === 0) {
      return createErrorResponse({
        code: 400,
        message: 'Invalid request body',
        errors: ['ids must be a non-empty array'],
      })
    }

    // Check if any room classes have rooms
    const { data: roomClassBedTypes } = await supabase.from('room_class_bed_type').select('room_class_id').in('id', ids)

    if (roomClassBedTypes) {
      const roomClassIds = [...new Set(roomClassBedTypes.map((rcbt) => rcbt.room_class_id))]
      const { data: rooms } = await supabase
        .from('room')
        .select('room_class_id')
        .in('room_class_id', roomClassIds)
        .limit(1)

      if (rooms && rooms.length > 0) {
        return createErrorResponse({
          code: 400,
          message: 'Cannot delete bed types from room classes that have rooms',
          errors: ['One or more room classes have rooms associated with them'],
        })
      }
    }

    const { error } = await supabase.from('room_class_bed_type').delete().in('id', ids)

    if (error) {
      return createErrorResponse({
        code: 400,
        message: error.message,
        errors: [error.message],
      })
    }

    return createApiResponse({
      code: 200,
      message: 'Room class bed types deleted successfully',
      data: { deleted_count: ids.length },
    })
  } catch (error) {
    console.error('Bulk delete room class bed types error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}
