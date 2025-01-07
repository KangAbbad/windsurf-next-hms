import { createApiResponse, createErrorResponse } from '@/lib/api-response'
import { createClient } from '@/providers/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { room_classes } = await request.json()

    if (!Array.isArray(room_classes) || room_classes.length === 0) {
      return createErrorResponse({
        code: 400,
        message: 'Invalid request body',
        errors: ['room_classes must be a non-empty array'],
      })
    }

    // Validate all entries
    const validationErrors: string[] = []
    const uniqueNames = new Set<string>()

    room_classes.forEach((roomClass, index) => {
      if (!roomClass.room_class_name) {
        validationErrors.push(`Entry at index ${index} is missing room_class_name`)
      }
      if (!roomClass.base_occupancy) {
        validationErrors.push(`Entry at index ${index} is missing base_occupancy`)
      }
      if (!roomClass.max_occupancy) {
        validationErrors.push(`Entry at index ${index} is missing max_occupancy`)
      }
      if (!roomClass.base_rate) {
        validationErrors.push(`Entry at index ${index} is missing base_rate`)
      }
      if (!Array.isArray(roomClass.features)) {
        validationErrors.push(`Entry at index ${index} is missing features array`)
      }
      if (!Array.isArray(roomClass.bed_types)) {
        validationErrors.push(`Entry at index ${index} is missing bed_types array`)
      }

      // Additional validation
      if (roomClass.base_occupancy > roomClass.max_occupancy) {
        validationErrors.push(`Entry at index ${index}: base_occupancy cannot be greater than max_occupancy`)
      }
      if (roomClass.base_rate < 0) {
        validationErrors.push(`Entry at index ${index}: base_rate cannot be negative`)
      }

      const normalizedName = roomClass.room_class_name?.toLowerCase()
      if (normalizedName && uniqueNames.has(normalizedName)) {
        validationErrors.push(`Duplicate room class name at index ${index}`)
      }
      if (normalizedName) {
        uniqueNames.add(normalizedName)
      }
    })

    if (validationErrors.length > 0) {
      return createErrorResponse({
        code: 400,
        message: 'Validation failed',
        errors: validationErrors,
      })
    }

    // Check for existing room class names
    const roomClassNames = room_classes.map((rc) => rc.room_class_name)
    const { data: existingNames } = await supabase
      .from('room_class')
      .select('room_class_name')
      .in('room_class_name', roomClassNames)

    if (existingNames && existingNames.length > 0) {
      return createErrorResponse({
        code: 400,
        message: 'Some room class names already exist',
        errors: existingNames.map((rc) => `Room class name '${rc.room_class_name}' already exists`),
      })
    }

    // Create room classes and their relationships
    const results = await Promise.all(
      room_classes.map(async (roomClass) => {
        try {
          // Create room class
          const { data: newRoomClass, error: roomClassError } = await supabase
            .from('room_class')
            .insert([
              {
                room_class_name: roomClass.room_class_name,
                description: roomClass.description,
                base_occupancy: roomClass.base_occupancy,
                max_occupancy: roomClass.max_occupancy,
                base_rate: roomClass.base_rate,
              },
            ])
            .select()
            .single()

          if (roomClassError) throw roomClassError

          // Add features
          if (roomClass.features.length > 0) {
            const { error: featuresError } = await supabase.from('room_class_feature').insert(
              roomClass.features.map((featureId: string) => ({
                room_class_id: newRoomClass.id,
                feature_id: featureId,
              }))
            )

            if (featuresError) throw featuresError
          }

          // Add bed types
          if (roomClass.bed_types.length > 0) {
            const { error: bedTypesError } = await supabase.from('room_class_bed_type').insert(
              roomClass.bed_types.map((bt: { bed_type_id: string; quantity: number }) => ({
                room_class_id: newRoomClass.id,
                bed_type_id: bt.bed_type_id,
                quantity: bt.quantity,
              }))
            )

            if (bedTypesError) throw bedTypesError
          }

          // Get complete room class data
          const { data: completeRoomClass, error: fetchError } = await supabase
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
            .eq('id', newRoomClass.id)
            .single()

          if (fetchError) throw fetchError

          return { success: true, data: completeRoomClass }
        } catch (error) {
          return {
            success: false,
            error: (error as Error).message,
            room_class_name: roomClass.room_class_name,
          }
        }
      })
    )

    const failures = results.filter((r) => !r.success)
    if (failures.length > 0) {
      // Attempt to clean up any successful creations
      const successfulIds = results.filter((r) => r.success && r.data).map((r) => r.data.id)

      if (successfulIds.length > 0) {
        await supabase.from('room_class_bed_type').delete().in('room_class_id', successfulIds)
        await supabase.from('room_class_feature').delete().in('room_class_id', successfulIds)
        await supabase.from('room_class').delete().in('id', successfulIds)
      }

      return createErrorResponse({
        code: 400,
        message: 'Failed to create some room classes',
        errors: failures.map((f) => `Failed to create room class '${f.room_class_name}': ${f.error}`),
      })
    }

    return createApiResponse({
      code: 201,
      message: 'Room classes created successfully',
      data: results.map((r) => r.data),
    })
  } catch (error) {
    console.error('Bulk create room classes error:', error)
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
    const { room_classes } = await request.json()

    if (!Array.isArray(room_classes) || room_classes.length === 0) {
      return createErrorResponse({
        code: 400,
        message: 'Invalid request body',
        errors: ['room_classes must be a non-empty array'],
      })
    }

    // Validate all entries
    const validationErrors: string[] = []
    const uniqueNames = new Set<string>()
    const uniqueIds = new Set<string>()

    room_classes.forEach((roomClass, index) => {
      if (!roomClass.id) {
        validationErrors.push(`Entry at index ${index} is missing id`)
      }
      if (!roomClass.room_class_name) {
        validationErrors.push(`Entry at index ${index} is missing room_class_name`)
      }
      if (!roomClass.base_occupancy) {
        validationErrors.push(`Entry at index ${index} is missing base_occupancy`)
      }
      if (!roomClass.max_occupancy) {
        validationErrors.push(`Entry at index ${index} is missing max_occupancy`)
      }
      if (!roomClass.base_rate) {
        validationErrors.push(`Entry at index ${index} is missing base_rate`)
      }
      if (!Array.isArray(roomClass.features)) {
        validationErrors.push(`Entry at index ${index} is missing features array`)
      }
      if (!Array.isArray(roomClass.bed_types)) {
        validationErrors.push(`Entry at index ${index} is missing bed_types array`)
      }

      if (uniqueIds.has(roomClass.id)) {
        validationErrors.push(`Duplicate id at index ${index}`)
      }
      uniqueIds.add(roomClass.id)

      const normalizedName = roomClass.room_class_name?.toLowerCase()
      if (normalizedName && uniqueNames.has(normalizedName)) {
        validationErrors.push(`Duplicate room class name at index ${index}`)
      }
      if (normalizedName) {
        uniqueNames.add(normalizedName)
      }

      // Additional validation
      if (roomClass.base_occupancy > roomClass.max_occupancy) {
        validationErrors.push(`Entry at index ${index}: base_occupancy cannot be greater than max_occupancy`)
      }
      if (roomClass.base_rate < 0) {
        validationErrors.push(`Entry at index ${index}: base_rate cannot be negative`)
      }
    })

    if (validationErrors.length > 0) {
      return createErrorResponse({
        code: 400,
        message: 'Validation failed',
        errors: validationErrors,
      })
    }

    // Check if all room classes exist
    const roomClassIds = [...uniqueIds]
    const { data: existingClasses } = await supabase.from('room_class').select('id').in('id', roomClassIds)

    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    const existingIds = new Set(existingClasses?.map((rc) => rc.id) || [])
    const invalidIds = roomClassIds.filter((id) => !existingIds.has(id))

    if (invalidIds.length > 0) {
      return createErrorResponse({
        code: 404,
        message: 'Some room classes not found',
        errors: invalidIds.map((id) => `Room class with id '${id}' not found`),
      })
    }

    // Check for name conflicts
    const nameConflicts = await Promise.all(
      room_classes.map(async (roomClass) => {
        const { data } = await supabase
          .from('room_class')
          .select('id')
          .ilike('room_class_name', roomClass.room_class_name)
          .neq('id', roomClass.id)
          .single()
        return data ? roomClass.room_class_name : null
      })
    )

    const conflictingNames = nameConflicts.filter(Boolean)
    if (conflictingNames.length > 0) {
      return createErrorResponse({
        code: 400,
        message: 'Some room class names already exist',
        errors: conflictingNames.map((name) => `Room class name '${name}' already exists`),
      })
    }

    // Update room classes and their relationships
    const results = await Promise.all(
      room_classes.map(async (roomClass) => {
        try {
          // Update room class
          const { id, features, bed_types, created_at, updated_at, ...updates } = roomClass
          const { error: roomClassError } = await supabase.from('room_class').update(updates).eq('id', id)

          if (roomClassError) throw roomClassError

          // Update features
          await supabase.from('room_class_feature').delete().eq('room_class_id', id)
          if (features.length > 0) {
            const { error: featuresError } = await supabase.from('room_class_feature').insert(
              features.map((featureId: string) => ({
                room_class_id: id,
                feature_id: featureId,
              }))
            )

            if (featuresError) throw featuresError
          }

          // Update bed types
          await supabase.from('room_class_bed_type').delete().eq('room_class_id', id)
          if (bed_types.length > 0) {
            const { error: bedTypesError } = await supabase.from('room_class_bed_type').insert(
              bed_types.map((bt: { bed_type_id: string; quantity: number }) => ({
                room_class_id: id,
                bed_type_id: bt.bed_type_id,
                quantity: bt.quantity,
              }))
            )

            if (bedTypesError) throw bedTypesError
          }

          // Get updated room class data
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
            .eq('id', id)
            .single()

          if (fetchError) throw fetchError

          return { success: true, data: updatedRoomClass }
        } catch (error) {
          return {
            success: false,
            error: (error as Error).message,
            id: roomClass.id,
            room_class_name: roomClass.room_class_name,
          }
        }
      })
    )

    const failures = results.filter((r) => !r.success)
    if (failures.length > 0) {
      return createErrorResponse({
        code: 400,
        message: 'Failed to update some room classes',
        errors: failures.map((f) => `Failed to update room class '${f.room_class_name}' (${f.id}): ${f.error}`),
      })
    }

    return createApiResponse({
      code: 200,
      message: 'Room classes updated successfully',
      data: results.map((r) => r.data),
    })
  } catch (error) {
    console.error('Bulk update room classes error:', error)
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
    const { data: rooms } = await supabase.from('room').select('room_class_id').in('room_class_id', ids).limit(1)

    if (rooms && rooms.length > 0) {
      return createErrorResponse({
        code: 400,
        message: 'Cannot delete room classes that have rooms',
        errors: ['One or more room classes have rooms assigned to them'],
      })
    }

    // Delete relationships first
    await supabase.from('room_class_bed_type').delete().in('room_class_id', ids)
    await supabase.from('room_class_feature').delete().in('room_class_id', ids)

    // Delete room classes
    const { error } = await supabase.from('room_class').delete().in('id', ids)

    if (error) {
      return createErrorResponse({
        code: 400,
        message: error.message,
        errors: [error.message],
      })
    }

    return createApiResponse({
      code: 200,
      message: 'Room classes deleted successfully',
      data: { deleted_count: ids.length },
    })
  } catch (error) {
    console.error('Bulk delete room classes error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}
