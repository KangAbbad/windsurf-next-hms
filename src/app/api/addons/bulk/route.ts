import { createClient } from '@/providers/supabase/server'
import { createApiResponse, createErrorResponse } from '@/services/apiResponse'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { addons } = await request.json()

    if (!Array.isArray(addons) || addons.length === 0) {
      return createErrorResponse({
        code: 400,
        message: 'Invalid request body',
        errors: ['addons must be a non-empty array'],
      })
    }

    // Validate all addons
    const validationErrors: string[] = []
    const addonNames = new Set<string>()

    addons.forEach((addon, index) => {
      if (!addon.addon_name || !addon.price) {
        validationErrors.push(`Addon at index ${index} is missing required fields`)
      }
      if (typeof addon.price !== 'number' || addon.price <= 0) {
        validationErrors.push(`Addon at index ${index} has invalid price`)
      }
      if (addonNames.has(addon.addon_name.toLowerCase())) {
        validationErrors.push(`Duplicate addon name at index ${index}`)
      }
      addonNames.add(addon.addon_name.toLowerCase())
    })

    if (validationErrors.length > 0) {
      return createErrorResponse({
        code: 400,
        message: 'Validation failed',
        errors: validationErrors,
      })
    }

    // Check for existing addon names
    const { data: existingAddons } = await supabase
      .from('addon')
      .select('addon_name')
      .in(
        'addon_name',
        addons.map((a) => a.addon_name)
      )

    if (existingAddons && existingAddons.length > 0) {
      return createErrorResponse({
        code: 400,
        message: 'Duplicate addon names',
        errors: existingAddons.map((a) => `Addon name '${a.addon_name}' already exists`),
      })
    }

    // Insert all addons
    const { data, error } = await supabase.from('addon').insert(addons).select()

    if (error) {
      return createErrorResponse({
        code: 400,
        message: error.message,
        errors: [error.message],
      })
    }

    return createApiResponse({
      code: 201,
      message: 'Addons created successfully',
      data,
    })
  } catch (error) {
    console.error('Bulk create addons error:', error)
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
    const { addons } = await request.json()

    if (!Array.isArray(addons) || addons.length === 0) {
      return createErrorResponse({
        code: 400,
        message: 'Invalid request body',
        errors: ['addons must be a non-empty array'],
      })
    }

    // Validate all addons
    const validationErrors: string[] = []
    const addonNames = new Set<string>()
    const addonIds = new Set<string>()

    addons.forEach((addon, index) => {
      if (!addon.id) {
        validationErrors.push(`Addon at index ${index} is missing id`)
      }
      if (!addon.addon_name || !addon.price) {
        validationErrors.push(`Addon at index ${index} is missing required fields`)
      }
      if (typeof addon.price !== 'number' || addon.price <= 0) {
        validationErrors.push(`Addon at index ${index} has invalid price`)
      }
      if (addonNames.has(addon.addon_name.toLowerCase())) {
        validationErrors.push(`Duplicate addon name at index ${index}`)
      }
      if (addonIds.has(addon.id)) {
        validationErrors.push(`Duplicate addon ID at index ${index}`)
      }
      addonNames.add(addon.addon_name.toLowerCase())
      addonIds.add(addon.id)
    })

    if (validationErrors.length > 0) {
      return createErrorResponse({
        code: 400,
        message: 'Validation failed',
        errors: validationErrors,
      })
    }

    // Check for name conflicts (excluding current addons)
    const nameConflicts = await Promise.all(
      addons.map(async (addon) => {
        const { data } = await supabase
          .from('addon')
          .select('id')
          .eq('addon_name', addon.addon_name)
          .neq('id', addon.id)
          .single()
        return data ? addon.addon_name : null
      })
    )

    const conflictingNames = nameConflicts.filter(Boolean)
    if (conflictingNames.length > 0) {
      return createErrorResponse({
        code: 400,
        message: 'Name conflicts found',
        errors: conflictingNames.map((name) => `Addon name '${name}' already exists`),
      })
    }

    // Update addons one by one to maintain atomicity
    const results = await Promise.all(
      addons.map(async (addon) => {
        const { id, created_at, updated_at, ...updates } = addon
        const { data, error } = await supabase.from('addon').update(updates).eq('id', id).select().single()

        return { id, success: !error, data, error }
      })
    )

    const errors = results.filter((r) => !r.success).map((r) => `Failed to update addon ${r.id}: ${r.error?.message}`)
    if (errors.length > 0) {
      return createErrorResponse({
        code: 400,
        message: 'Some updates failed',
        errors,
      })
    }

    return createApiResponse({
      code: 200,
      message: 'Addons updated successfully',
      data: results.map((r) => r.data),
    })
  } catch (error) {
    console.error('Bulk update addons error:', error)
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

    // Check if any addons are used in bookings
    const { data: usedAddons } = await supabase.from('booking_addon').select('addon_id').in('addon_id', ids).limit(1)

    if (usedAddons && usedAddons.length > 0) {
      return createErrorResponse({
        code: 400,
        message: 'Cannot delete addons that are used in bookings',
        errors: ['One or more addons have associated bookings'],
      })
    }

    const { error } = await supabase.from('addon').delete().in('id', ids)

    if (error) {
      return createErrorResponse({
        code: 400,
        message: error.message,
        errors: [error.message],
      })
    }

    return createApiResponse({
      code: 200,
      message: 'Addons deleted successfully',
      data: { deleted_count: ids.length },
    })
  } catch (error) {
    console.error('Bulk delete addons error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}
