import { createApiResponse, createErrorResponse } from '@/lib/api-response'
import { createClient } from '@/providers/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { room_class_features } = await request.json()

    if (!Array.isArray(room_class_features) || room_class_features.length === 0) {
      return createErrorResponse({
        code: 400,
        message: 'Invalid request body',
        errors: ['room_class_features must be a non-empty array'],
      })
    }

    // Validate all entries
    const validationErrors: string[] = []
    const uniqueKeys = new Set<string>()

    room_class_features.forEach((rcf, index) => {
      if (!rcf.room_class_id) {
        validationErrors.push(`Entry at index ${index} is missing room_class_id`)
      }
      if (!rcf.feature_id) {
        validationErrors.push(`Entry at index ${index} is missing feature_id`)
      }

      const key = `${rcf.room_class_id}-${rcf.feature_id}`
      if (uniqueKeys.has(key)) {
        validationErrors.push(`Duplicate room class and feature combination at index ${index}`)
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
    const roomClassIds = [...new Set(room_class_features.map((rcf) => rcf.room_class_id))]
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

    // Check if all features exist
    const featureIds = [...new Set(room_class_features.map((rcf) => rcf.feature_id))]
    const { data: features } = await supabase.from('feature').select('id').in('id', featureIds)

    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    const existingFeatureIds = new Set(features?.map((f) => f.id) || [])
    const invalidFeatureIds = featureIds.filter((id) => !existingFeatureIds.has(id))

    if (invalidFeatureIds.length > 0) {
      return createErrorResponse({
        code: 404,
        message: 'Invalid features',
        errors: invalidFeatureIds.map((id) => `Feature with id '${id}' not found`),
      })
    }

    // Check for existing relationships
    const existingRelations = await Promise.all(
      room_class_features.map(async (rcf) => {
        const { data } = await supabase
          .from('room_class_feature')
          .select('id')
          .eq('room_class_id', rcf.room_class_id)
          .eq('feature_id', rcf.feature_id)
          .single()
        return data ? `${rcf.room_class_id}-${rcf.feature_id}` : null
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
      .from('room_class_feature')
      .insert(room_class_features)
      .select(
        `
        *,
        room_class:room_class(
          id,
          room_class_name
        ),
        feature:feature(*)
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
      message: 'Room class features created successfully',
      data,
    })
  } catch (error) {
    console.error('Bulk create room class features error:', error)
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
    const { room_class_features } = await request.json()

    if (!Array.isArray(room_class_features) || room_class_features.length === 0) {
      return createErrorResponse({
        code: 400,
        message: 'Invalid request body',
        errors: ['room_class_features must be a non-empty array'],
      })
    }

    // Validate all entries
    const validationErrors: string[] = []
    const uniqueKeys = new Set<string>()
    const uniqueIds = new Set<string>()

    room_class_features.forEach((rcf, index) => {
      if (!rcf.id) {
        validationErrors.push(`Entry at index ${index} is missing id`)
      }
      if (!rcf.room_class_id) {
        validationErrors.push(`Entry at index ${index} is missing room_class_id`)
      }
      if (!rcf.feature_id) {
        validationErrors.push(`Entry at index ${index} is missing feature_id`)
      }

      if (uniqueIds.has(rcf.id)) {
        validationErrors.push(`Duplicate id at index ${index}`)
      }
      uniqueIds.add(rcf.id)

      const key = `${rcf.room_class_id}-${rcf.feature_id}`
      if (uniqueKeys.has(key)) {
        validationErrors.push(`Duplicate room class and feature combination at index ${index}`)
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
    const roomClassIds = [...new Set(room_class_features.map((rcf) => rcf.room_class_id))]
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

    // Check if all features exist
    const featureIds = [...new Set(room_class_features.map((rcf) => rcf.feature_id))]
    const { data: features } = await supabase.from('feature').select('id').in('id', featureIds)

    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    const existingFeatureIds = new Set(features?.map((f) => f.id) || [])
    const invalidFeatureIds = featureIds.filter((id) => !existingFeatureIds.has(id))

    if (invalidFeatureIds.length > 0) {
      return createErrorResponse({
        code: 404,
        message: 'Invalid features',
        errors: invalidFeatureIds.map((id) => `Feature with id '${id}' not found`),
      })
    }

    // Update relationships one by one to maintain atomicity
    const results = await Promise.all(
      room_class_features.map(async (rcf) => {
        // Check for conflicts (excluding current relationship)
        const { data: conflict } = await supabase
          .from('room_class_feature')
          .select('id')
          .eq('room_class_id', rcf.room_class_id)
          .eq('feature_id', rcf.feature_id)
          .neq('id', rcf.id)
          .single()

        if (conflict) {
          return {
            id: rcf.id,
            success: false,
            error: { message: 'Relationship already exists' },
          }
        }

        const { id, created_at, updated_at, ...updates } = rcf
        const { data, error } = await supabase
          .from('room_class_feature')
          .update(updates)
          .eq('id', id)
          .select(
            `
            *,
            room_class:room_class(
              id,
              room_class_name
            ),
            feature:feature(*)
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
      message: 'Room class features updated successfully',
      data: results.map((r) => r.data),
    })
  } catch (error) {
    console.error('Bulk update room class features error:', error)
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

    const { error } = await supabase.from('room_class_feature').delete().in('id', ids)

    if (error) {
      return createErrorResponse({
        code: 400,
        message: error.message,
        errors: [error.message],
      })
    }

    return createApiResponse({
      code: 200,
      message: 'Room class features deleted successfully',
      data: { deleted_count: ids.length },
    })
  } catch (error) {
    console.error('Bulk delete room class features error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}
