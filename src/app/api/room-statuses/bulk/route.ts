import { createApiResponse, createErrorResponse } from '@/lib/api-response'
import { createClient } from '@/providers/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { room_statuses } = await request.json()

    if (!Array.isArray(room_statuses) || room_statuses.length === 0) {
      return createErrorResponse({
        code: 400,
        message: 'Invalid request body',
        errors: ['room_statuses must be a non-empty array'],
      })
    }

    // Validate all entries
    const validationErrors: string[] = []
    const uniqueNames = new Set<string>()

    room_statuses.forEach((status, index) => {
      if (!status.status_name) {
        validationErrors.push(`Entry at index ${index} is missing status_name`)
      }
      if (typeof status.is_available !== 'boolean') {
        validationErrors.push(`Entry at index ${index} is missing or has invalid is_available`)
      }
      if (status.color_code && !/^#[0-9A-Fa-f]{6}$/.test(status.color_code)) {
        validationErrors.push(`Entry at index ${index} has invalid color_code`)
      }

      const normalizedName = status.status_name?.toLowerCase()
      if (normalizedName && uniqueNames.has(normalizedName)) {
        validationErrors.push(`Duplicate status name at index ${index}`)
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

    // Check for existing status names
    const statusNames = room_statuses.map((status) => status.status_name)
    const { data: existingStatuses } = await supabase
      .from('room_status')
      .select('status_name')
      .ilike('status_name', `%${statusNames.join('%')}%`)

    if (existingStatuses && existingStatuses.length > 0) {
      const existingNames = existingStatuses.map((status) => status.status_name)
      return createErrorResponse({
        code: 400,
        message: 'Some status names already exist',
        errors: existingNames.map((name) => `Status name '${name}' already exists`),
      })
    }

    // Insert all statuses
    const { data, error } = await supabase.from('room_status').insert(room_statuses).select()

    if (error) {
      return createErrorResponse({
        code: 400,
        message: error.message,
        errors: [error.message],
      })
    }

    return createApiResponse({
      code: 201,
      message: 'Room statuses created successfully',
      data,
    })
  } catch (error) {
    console.error('Bulk create room statuses error:', error)
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
    const { room_statuses } = await request.json()

    if (!Array.isArray(room_statuses) || room_statuses.length === 0) {
      return createErrorResponse({
        code: 400,
        message: 'Invalid request body',
        errors: ['room_statuses must be a non-empty array'],
      })
    }

    // Validate all entries
    const validationErrors: string[] = []
    const uniqueNames = new Set<string>()
    const uniqueIds = new Set<string>()

    room_statuses.forEach((status, index) => {
      if (!status.id) {
        validationErrors.push(`Entry at index ${index} is missing id`)
      }
      if (!status.status_name) {
        validationErrors.push(`Entry at index ${index} is missing status_name`)
      }
      if (typeof status.is_available !== 'boolean') {
        validationErrors.push(`Entry at index ${index} is missing or has invalid is_available`)
      }
      if (status.color_code && !/^#[0-9A-Fa-f]{6}$/.test(status.color_code)) {
        validationErrors.push(`Entry at index ${index} has invalid color_code`)
      }

      if (uniqueIds.has(status.id)) {
        validationErrors.push(`Duplicate id at index ${index}`)
      }
      uniqueIds.add(status.id)

      const normalizedName = status.status_name?.toLowerCase()
      if (normalizedName && uniqueNames.has(normalizedName)) {
        validationErrors.push(`Duplicate status name at index ${index}`)
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

    // Check if all statuses exist
    const statusIds = [...uniqueIds]
    const { data: existingStatuses } = await supabase.from('room_status').select('id').in('id', statusIds)

    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    const existingIds = new Set(existingStatuses?.map((status) => status.id) || [])
    const invalidIds = statusIds.filter((id) => !existingIds.has(id))

    if (invalidIds.length > 0) {
      return createErrorResponse({
        code: 404,
        message: 'Some statuses not found',
        errors: invalidIds.map((id) => `Status with id '${id}' not found`),
      })
    }

    // Check for name conflicts
    const nameConflicts = await Promise.all(
      room_statuses.map(async (status) => {
        const { data } = await supabase
          .from('room_status')
          .select('id')
          .ilike('status_name', status.status_name)
          .neq('id', status.id)
          .single()
        return data ? status.status_name : null
      })
    )

    const conflictingNames = nameConflicts.filter(Boolean)
    if (conflictingNames.length > 0) {
      return createErrorResponse({
        code: 400,
        message: 'Some status names already exist',
        errors: conflictingNames.map((name) => `Status name '${name}' already exists`),
      })
    }

    // Check if update would remove all available statuses
    const { data: currentAvailableStatuses } = await supabase.from('room_status').select('id').eq('is_available', true)

    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    const currentAvailableIds = new Set(currentAvailableStatuses?.map((s) => s.id) || [])
    const updatedAvailableIds = new Set(room_statuses.filter((s) => s.is_available).map((s) => s.id))

    const remainingAvailableIds = new Set([...currentAvailableIds].filter((id) => !statusIds.includes(id)))

    if (currentAvailableIds.size > 0 && remainingAvailableIds.size === 0 && updatedAvailableIds.size === 0) {
      return createErrorResponse({
        code: 400,
        message: 'Update would remove all available statuses',
        errors: ['At least one room status must be available'],
      })
    }

    // Update statuses one by one to maintain atomicity
    const results = await Promise.all(
      room_statuses.map(async (status) => {
        const { id, created_at, updated_at, ...updates } = status
        const { data, error } = await supabase.from('room_status').update(updates).eq('id', id).select().single()

        return { id, success: !error, data, error }
      })
    )

    const errors = results.filter((r) => !r.success).map((r) => `Failed to update status ${r.id}: ${r.error?.message}`)

    if (errors.length > 0) {
      return createErrorResponse({
        code: 400,
        message: 'Some updates failed',
        errors,
      })
    }

    return createApiResponse({
      code: 200,
      message: 'Room statuses updated successfully',
      data: results.map((r) => r.data),
    })
  } catch (error) {
    console.error('Bulk update room statuses error:', error)
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

    // Check if any statuses are used by rooms
    const { data: rooms } = await supabase.from('room').select('status_id').in('status_id', ids).limit(1)

    if (rooms && rooms.length > 0) {
      return createErrorResponse({
        code: 400,
        message: 'Cannot delete statuses that are in use',
        errors: ['One or more statuses are assigned to rooms'],
      })
    }

    // Check if deletion would remove all available statuses
    const { data: availableStatuses } = await supabase.from('room_status').select('id').eq('is_available', true)

    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    const availableIds = new Set(availableStatuses?.map((s) => s.id) || [])
    const remainingAvailableIds = new Set([...availableIds].filter((id) => !ids.includes(id)))

    if (availableIds.size > 0 && remainingAvailableIds.size === 0) {
      return createErrorResponse({
        code: 400,
        message: 'Cannot delete all available statuses',
        errors: ['At least one room status must be available'],
      })
    }

    const { error } = await supabase.from('room_status').delete().in('id', ids)

    if (error) {
      return createErrorResponse({
        code: 400,
        message: error.message,
        errors: [error.message],
      })
    }

    return createApiResponse({
      code: 200,
      message: 'Room statuses deleted successfully',
      data: { deleted_count: ids.length },
    })
  } catch (error) {
    console.error('Bulk delete room statuses error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}
