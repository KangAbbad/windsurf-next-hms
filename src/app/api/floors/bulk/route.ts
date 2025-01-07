import { createApiResponse, createErrorResponse } from '@/lib/api-response'
import { createClient } from '@/providers/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { floors } = await request.json()

    if (!Array.isArray(floors) || floors.length === 0) {
      return createErrorResponse({
        code: 400,
        message: 'Invalid request body',
        errors: ['floors must be a non-empty array'],
      })
    }

    // Validate all entries
    const validationErrors: string[] = []
    const uniqueNames = new Set<string>()
    const uniqueNumbers = new Set<number>()

    floors.forEach((floor, index) => {
      if (!floor.floor_name) {
        validationErrors.push(`Entry at index ${index} is missing floor_name`)
      }
      if (typeof floor.floor_number !== 'number') {
        validationErrors.push(`Entry at index ${index} is missing or has invalid floor_number`)
      }

      const normalizedName = floor.floor_name?.toLowerCase()
      if (normalizedName && uniqueNames.has(normalizedName)) {
        validationErrors.push(`Duplicate floor name at index ${index}`)
      }
      if (normalizedName) {
        uniqueNames.add(normalizedName)
      }

      if (typeof floor.floor_number === 'number' && uniqueNumbers.has(floor.floor_number)) {
        validationErrors.push(`Duplicate floor number at index ${index}`)
      }
      if (typeof floor.floor_number === 'number') {
        uniqueNumbers.add(floor.floor_number)
      }
    })

    if (validationErrors.length > 0) {
      return createErrorResponse({
        code: 400,
        message: 'Validation failed',
        errors: validationErrors,
      })
    }

    // Check for existing floor names
    const floorNames = floors.map((floor) => floor.floor_name)
    const { data: existingFloorNames } = await supabase.from('floor').select('floor_name').in('floor_name', floorNames)

    if (existingFloorNames && existingFloorNames.length > 0) {
      return createErrorResponse({
        code: 400,
        message: 'Some floor names already exist',
        errors: existingFloorNames.map((floor) => `Floor name '${floor.floor_name}' already exists`),
      })
    }

    // Check for existing floor numbers
    const floorNumbers = floors.map((floor) => floor.floor_number)
    const { data: existingFloorNumbers } = await supabase
      .from('floor')
      .select('floor_number')
      .in('floor_number', floorNumbers)

    if (existingFloorNumbers && existingFloorNumbers.length > 0) {
      return createErrorResponse({
        code: 400,
        message: 'Some floor numbers already exist',
        errors: existingFloorNumbers.map((floor) => `Floor number ${floor.floor_number} already exists`),
      })
    }

    // Insert all floors
    const { data, error } = await supabase.from('floor').insert(floors).select()

    if (error) {
      return createErrorResponse({
        code: 400,
        message: error.message,
        errors: [error.message],
      })
    }

    return createApiResponse({
      code: 201,
      message: 'Floors created successfully',
      data,
    })
  } catch (error) {
    console.error('Bulk create floors error:', error)
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
    const { floors } = await request.json()

    if (!Array.isArray(floors) || floors.length === 0) {
      return createErrorResponse({
        code: 400,
        message: 'Invalid request body',
        errors: ['floors must be a non-empty array'],
      })
    }

    // Validate all entries
    const validationErrors: string[] = []
    const uniqueNames = new Set<string>()
    const uniqueNumbers = new Set<number>()
    const uniqueIds = new Set<string>()

    floors.forEach((floor, index) => {
      if (!floor.id) {
        validationErrors.push(`Entry at index ${index} is missing id`)
      }
      if (!floor.floor_name) {
        validationErrors.push(`Entry at index ${index} is missing floor_name`)
      }
      if (typeof floor.floor_number !== 'number') {
        validationErrors.push(`Entry at index ${index} is missing or has invalid floor_number`)
      }

      if (uniqueIds.has(floor.id)) {
        validationErrors.push(`Duplicate id at index ${index}`)
      }
      uniqueIds.add(floor.id)

      const normalizedName = floor.floor_name?.toLowerCase()
      if (normalizedName && uniqueNames.has(normalizedName)) {
        validationErrors.push(`Duplicate floor name at index ${index}`)
      }
      if (normalizedName) {
        uniqueNames.add(normalizedName)
      }

      if (typeof floor.floor_number === 'number' && uniqueNumbers.has(floor.floor_number)) {
        validationErrors.push(`Duplicate floor number at index ${index}`)
      }
      if (typeof floor.floor_number === 'number') {
        uniqueNumbers.add(floor.floor_number)
      }
    })

    if (validationErrors.length > 0) {
      return createErrorResponse({
        code: 400,
        message: 'Validation failed',
        errors: validationErrors,
      })
    }

    // Check if all floors exist
    const floorIds = [...uniqueIds]
    const { data: existingFloors } = await supabase.from('floor').select('id').in('id', floorIds)

    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    const existingIds = new Set(existingFloors?.map((floor) => floor.id) || [])
    const invalidIds = floorIds.filter((id) => !existingIds.has(id))

    if (invalidIds.length > 0) {
      return createErrorResponse({
        code: 404,
        message: 'Some floors not found',
        errors: invalidIds.map((id) => `Floor with id '${id}' not found`),
      })
    }

    // Check for name conflicts
    const nameConflicts = await Promise.all(
      floors.map(async (floor) => {
        const { data } = await supabase
          .from('floor')
          .select('id')
          .ilike('floor_name', floor.floor_name)
          .neq('id', floor.id)
          .single()
        return data ? floor.floor_name : null
      })
    )

    const conflictingNames = nameConflicts.filter(Boolean)
    if (conflictingNames.length > 0) {
      return createErrorResponse({
        code: 400,
        message: 'Some floor names already exist',
        errors: conflictingNames.map((name) => `Floor name '${name}' already exists`),
      })
    }

    // Check for number conflicts
    const numberConflicts = await Promise.all(
      floors.map(async (floor) => {
        const { data } = await supabase
          .from('floor')
          .select('id')
          .eq('floor_number', floor.floor_number)
          .neq('id', floor.id)
          .single()
        return data ? floor.floor_number : null
      })
    )

    const conflictingNumbers = numberConflicts.filter((n) => n !== null)
    if (conflictingNumbers.length > 0) {
      return createErrorResponse({
        code: 400,
        message: 'Some floor numbers already exist',
        errors: conflictingNumbers.map((num) => `Floor number ${num} already exists`),
      })
    }

    // Update floors one by one to maintain atomicity
    const results = await Promise.all(
      floors.map(async (floor) => {
        const { id, created_at, updated_at, ...updates } = floor
        const { data, error } = await supabase.from('floor').update(updates).eq('id', id).select().single()

        return { id, success: !error, data, error }
      })
    )

    const errors = results.filter((r) => !r.success).map((r) => `Failed to update floor ${r.id}: ${r.error?.message}`)

    if (errors.length > 0) {
      return createErrorResponse({
        code: 400,
        message: 'Some updates failed',
        errors,
      })
    }

    return createApiResponse({
      code: 200,
      message: 'Floors updated successfully',
      data: results.map((r) => r.data),
    })
  } catch (error) {
    console.error('Bulk update floors error:', error)
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

    // Check if any floors have rooms
    const { data: rooms } = await supabase.from('room').select('floor_id').in('floor_id', ids).limit(1)

    if (rooms && rooms.length > 0) {
      return createErrorResponse({
        code: 400,
        message: 'Cannot delete floors that have rooms',
        errors: ['One or more floors have rooms assigned to them'],
      })
    }

    const { error } = await supabase.from('floor').delete().in('id', ids)

    if (error) {
      return createErrorResponse({
        code: 400,
        message: error.message,
        errors: [error.message],
      })
    }

    return createApiResponse({
      code: 200,
      message: 'Floors deleted successfully',
      data: { deleted_count: ids.length },
    })
  } catch (error) {
    console.error('Bulk delete floors error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}
