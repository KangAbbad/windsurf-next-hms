import { createApiResponse, createErrorResponse } from '@/lib/api-response'
import { createClient } from '@/providers/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { bed_types } = await request.json()

    if (!Array.isArray(bed_types) || bed_types.length === 0) {
      return createErrorResponse({
        code: 400,
        message: 'Invalid request body',
        errors: ['bed_types must be a non-empty array'],
      })
    }

    // Validate all bed types
    const validationErrors: string[] = []
    const bedTypeNames = new Set<string>()

    bed_types.forEach((bedType, index) => {
      if (!bedType.bed_type_name) {
        validationErrors.push(`Bed type at index ${index} is missing bed_type_name`)
      }
      if (bedTypeNames.has(bedType.bed_type_name?.toLowerCase())) {
        validationErrors.push(`Duplicate bed type name at index ${index}`)
      }
      if (bedType.bed_type_name) {
        bedTypeNames.add(bedType.bed_type_name.toLowerCase())
      }
    })

    if (validationErrors.length > 0) {
      return createErrorResponse({
        code: 400,
        message: 'Validation failed',
        errors: validationErrors,
      })
    }

    // Check for existing bed type names
    const { data: existingBedTypes } = await supabase
      .from('bed_type')
      .select('bed_type_name')
      .in(
        'bed_type_name',
        bed_types.map((bt) => bt.bed_type_name)
      )

    if (existingBedTypes && existingBedTypes.length > 0) {
      return createErrorResponse({
        code: 400,
        message: 'Duplicate bed type names',
        errors: existingBedTypes.map((bt) => `Bed type name '${bt.bed_type_name}' already exists`),
      })
    }

    // Insert all bed types
    const { data, error } = await supabase.from('bed_type').insert(bed_types).select()

    if (error) {
      return createErrorResponse({
        code: 400,
        message: error.message,
        errors: [error.message],
      })
    }

    return createApiResponse({
      code: 201,
      message: 'Bed types created successfully',
      data,
    })
  } catch (error) {
    console.error('Bulk create bed types error:', error)
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
    const { bed_types } = await request.json()

    if (!Array.isArray(bed_types) || bed_types.length === 0) {
      return createErrorResponse({
        code: 400,
        message: 'Invalid request body',
        errors: ['bed_types must be a non-empty array'],
      })
    }

    // Validate all bed types
    const validationErrors: string[] = []
    const bedTypeNames = new Set<string>()
    const bedTypeIds = new Set<string>()

    bed_types.forEach((bedType, index) => {
      if (!bedType.id) {
        validationErrors.push(`Bed type at index ${index} is missing id`)
      }
      if (!bedType.bed_type_name) {
        validationErrors.push(`Bed type at index ${index} is missing bed_type_name`)
      }
      if (bedTypeNames.has(bedType.bed_type_name?.toLowerCase())) {
        validationErrors.push(`Duplicate bed type name at index ${index}`)
      }
      if (bedTypeIds.has(bedType.id)) {
        validationErrors.push(`Duplicate bed type ID at index ${index}`)
      }
      if (bedType.bed_type_name) {
        bedTypeNames.add(bedType.bed_type_name.toLowerCase())
      }
      if (bedType.id) {
        bedTypeIds.add(bedType.id)
      }
    })

    if (validationErrors.length > 0) {
      return createErrorResponse({
        code: 400,
        message: 'Validation failed',
        errors: validationErrors,
      })
    }

    // Check for name conflicts (excluding current bed types)
    const nameConflicts = await Promise.all(
      bed_types.map(async (bedType) => {
        const { data } = await supabase
          .from('bed_type')
          .select('id')
          .eq('bed_type_name', bedType.bed_type_name)
          .neq('id', bedType.id)
          .single()
        return data ? bedType.bed_type_name : null
      })
    )

    const conflictingNames = nameConflicts.filter(Boolean)
    if (conflictingNames.length > 0) {
      return createErrorResponse({
        code: 400,
        message: 'Name conflicts found',
        errors: conflictingNames.map((name) => `Bed type name '${name}' already exists`),
      })
    }

    // Update bed types one by one to maintain atomicity
    const results = await Promise.all(
      bed_types.map(async (bedType) => {
        const { id, created_at, updated_at, ...updates } = bedType
        const { data, error } = await supabase.from('bed_type').update(updates).eq('id', id).select().single()

        return { id, success: !error, data, error }
      })
    )

    const errors = results
      .filter((r) => !r.success)
      .map((r) => `Failed to update bed type ${r.id}: ${r.error?.message}`)
    if (errors.length > 0) {
      return createErrorResponse({
        code: 400,
        message: 'Some updates failed',
        errors,
      })
    }

    return createApiResponse({
      code: 200,
      message: 'Bed types updated successfully',
      data: results.map((r) => r.data),
    })
  } catch (error) {
    console.error('Bulk update bed types error:', error)
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

    // Check if any bed types are used in room classes
    const { data: usedBedTypes } = await supabase
      .from('room_class_bed_type')
      .select('bed_type_id')
      .in('bed_type_id', ids)
      .limit(1)

    if (usedBedTypes && usedBedTypes.length > 0) {
      return createErrorResponse({
        code: 400,
        message: 'Cannot delete bed types that are used in room classes',
        errors: ['One or more bed types are associated with room classes'],
      })
    }

    const { error } = await supabase.from('bed_type').delete().in('id', ids)

    if (error) {
      return createErrorResponse({
        code: 400,
        message: error.message,
        errors: [error.message],
      })
    }

    return createApiResponse({
      code: 200,
      message: 'Bed types deleted successfully',
      data: { deleted_count: ids.length },
    })
  } catch (error) {
    console.error('Bulk delete bed types error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}
