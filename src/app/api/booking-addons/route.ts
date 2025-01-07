import { createApiResponse, createErrorResponse } from '@/lib/api-response'
import { createClient } from '@/providers/supabase/server'
import type {
  BookingAddonResponse,
  BulkCreateBookingAddonInput,
  BulkDeleteBookingAddonInput,
  BulkUpdateBookingAddonInput,
} from '@/types/booking-addon'

export async function GET(request: Request): Promise<Response> {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    // Get query parameters
    const booking_id = searchParams.get('booking_id')
    const addon_id = searchParams.get('addon_id')
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    const page = parseInt(searchParams.get('page') || '1', 10)
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('booking_addon')
      .select(
        `
        id,
        booking_id,
        addon_id,
        quantity,
        created_at,
        updated_at,
        booking:booking_id(
          id,
          booking_number,
          guest_name,
          checkin_date,
          checkout_date,
          num_guests,
          status
        ),
        addon:addon_id(
          id,
          addon_name,
          description,
          price,
          created_at,
          updated_at
        )
      `,
        { count: 'exact' }
      )
      .range(offset, offset + limit - 1)

    // Apply filters
    if (booking_id) {
      query = query.eq('booking_id', booking_id)
    }
    if (addon_id) {
      query = query.eq('addon_id', addon_id)
    }

    const { data: booking_addons, error, count } = await query.order('created_at', { ascending: false })

    if (error) {
      return createErrorResponse({
        code: 400,
        message: 'Error fetching booking addons',
        errors: [error.message],
      })
    }

    const response: BookingAddonResponse = {
      booking_addons: (booking_addons ?? []) as any[],
      pagination: {
        total: count,
        page,
        limit,
        total_pages: count ? Math.ceil(count / limit) : null,
      },
    }

    return createApiResponse({
      code: 200,
      message: 'Booking addons retrieved successfully',
      data: response,
    })
  } catch (error) {
    console.error('List booking addons error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const supabase = await createClient()
    const { items }: BulkCreateBookingAddonInput = await request.json()

    // Validate required fields
    if (!Array.isArray(items) || items.length === 0) {
      return createErrorResponse({
        code: 400,
        message: 'Missing required fields',
        errors: ['items array is required and cannot be empty'],
      })
    }

    // Extract unique booking_ids and addon_ids for validation
    const booking_ids = [...new Set(items.map((item) => item.booking_id))]
    const addon_ids = [...new Set(items.map((item) => item.addon_id))]

    // Check if all bookings exist
    const { data: bookings, error: bookingError } = await supabase.from('booking').select('id').in('id', booking_ids)

    if (bookingError || !bookings || bookings.length !== booking_ids.length) {
      return createErrorResponse({
        code: 400,
        message: 'Invalid booking_id',
        errors: ['One or more bookings do not exist'],
      })
    }

    // Check if all addons exist
    const { data: addons, error: addonError } = await supabase.from('addon').select('id').in('id', addon_ids)

    if (addonError || !addons || addons.length !== addon_ids.length) {
      return createErrorResponse({
        code: 400,
        message: 'Invalid addon_id',
        errors: ['One or more addons do not exist'],
      })
    }

    // Check for existing booking-addon combinations
    const existingCombos = items.map((item) => `(booking_id.eq.${item.booking_id},addon_id.eq.${item.addon_id})`)
    const { data: existing, error: existingError } = await supabase
      .from('booking_addon')
      .select('booking_id, addon_id')
      .or(existingCombos.join(','))

    if (existingError) {
      return createErrorResponse({
        code: 400,
        message: 'Error checking existing combinations',
        errors: [existingError.message],
      })
    }

    if (existing && existing.length > 0) {
      return createErrorResponse({
        code: 400,
        message: 'Duplicate booking-addon combinations',
        errors: ['Some booking-addon combinations already exist'],
      })
    }

    // Create booking addons
    const { data: created, error: createError } = await supabase
      .from('booking_addon')
      .insert(items)
      .select(
        `
        id,
        booking_id,
        addon_id,
        quantity,
        created_at,
        updated_at,
        booking:booking_id(
          id,
          booking_number,
          guest_name,
          checkin_date,
          checkout_date,
          num_guests,
          status
        ),
        addon:addon_id(
          id,
          addon_name,
          description,
          price,
          created_at,
          updated_at
        )
      `
      )

    if (createError) {
      return createErrorResponse({
        code: 400,
        message: 'Error creating booking addons',
        errors: [createError.message],
      })
    }

    return createApiResponse({
      code: 201,
      message: 'Booking addons created successfully',
      data: created,
    })
  } catch (error) {
    console.error('Create booking addons error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}

export async function PUT(request: Request): Promise<Response> {
  try {
    const supabase = await createClient()
    const { items }: BulkUpdateBookingAddonInput = await request.json()

    // Validate request body
    if (!Array.isArray(items) || items.length === 0) {
      return createErrorResponse({
        code: 400,
        message: 'Missing required fields',
        errors: ['items array is required and cannot be empty'],
      })
    }

    // Get all IDs to update
    const ids = items.map((item) => item.id)

    // Check if all booking addons exist
    const { data: existing, error: existingError } = await supabase.from('booking_addon').select('id').in('id', ids)

    if (existingError || !existing || existing.length !== ids.length) {
      return createErrorResponse({
        code: 400,
        message: 'Invalid booking addon IDs',
        errors: ['One or more booking addons do not exist'],
      })
    }

    // Extract unique booking_ids and addon_ids for validation
    const booking_ids = [...new Set(items.filter((item) => item.booking_id).map((item) => item.booking_id!))]
    const addon_ids = [...new Set(items.filter((item) => item.addon_id).map((item) => item.addon_id!))]

    // Check if all bookings exist (if any booking_ids to update)
    if (booking_ids.length > 0) {
      const { data: bookings, error: bookingError } = await supabase.from('booking').select('id').in('id', booking_ids)

      if (bookingError || !bookings || bookings.length !== booking_ids.length) {
        return createErrorResponse({
          code: 400,
          message: 'Invalid booking_id',
          errors: ['One or more bookings do not exist'],
        })
      }
    }

    // Check if all addons exist (if any addon_ids to update)
    if (addon_ids.length > 0) {
      const { data: addons, error: addonError } = await supabase.from('addon').select('id').in('id', addon_ids)

      if (addonError || !addons || addons.length !== addon_ids.length) {
        return createErrorResponse({
          code: 400,
          message: 'Invalid addon_id',
          errors: ['One or more addons do not exist'],
        })
      }
    }

    // Update each booking addon
    const updates = items.map((item) => {
      const { id, ...updateData } = item
      return supabase
        .from('booking_addon')
        .update(updateData)
        .eq('id', id)
        .select(
          `
          id,
          booking_id,
          addon_id,
          quantity,
          created_at,
          updated_at,
          booking:booking_id(
            id,
            booking_number,
            guest_name,
            checkin_date,
            checkout_date,
            num_guests,
            status
          ),
          addon:addon_id(
            id,
            addon_name,
            description,
            price,
            created_at,
            updated_at
          )
        `
        )
        .single()
    })

    const results = await Promise.all(updates)
    const errors = results.filter((result) => result.error).map((result) => result.error)

    if (errors.length > 0) {
      return createErrorResponse({
        code: 400,
        message: 'Error updating booking addons',
        errors: errors.map((error) => error?.message ?? 'Error updating booking addon'),
      })
    }

    const updatedData = results.map((result) => result.data)

    return createApiResponse({
      code: 200,
      message: 'Booking addons updated successfully',
      data: updatedData,
    })
  } catch (error) {
    console.error('Update booking addons error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}

export async function DELETE(request: Request): Promise<Response> {
  try {
    const supabase = await createClient()
    const { ids }: BulkDeleteBookingAddonInput = await request.json()

    // Validate request body
    if (!Array.isArray(ids) || ids.length === 0) {
      return createErrorResponse({
        code: 400,
        message: 'Missing required fields',
        errors: ['ids array is required and cannot be empty'],
      })
    }

    // Check if all booking addons exist
    const { data: existing, error: existingError } = await supabase.from('booking_addon').select('id').in('id', ids)

    if (existingError) {
      return createErrorResponse({
        code: 400,
        message: 'Error checking booking addons',
        errors: [existingError.message],
      })
    }

    if (!existing || existing.length !== ids.length) {
      return createErrorResponse({
        code: 400,
        message: 'Invalid booking addon IDs',
        errors: ['One or more booking addons do not exist'],
      })
    }

    // Delete booking addons
    const { error: deleteError } = await supabase.from('booking_addon').delete().in('id', ids)

    if (deleteError) {
      return createErrorResponse({
        code: 400,
        message: 'Error deleting booking addons',
        errors: [deleteError.message],
      })
    }

    return createApiResponse({
      code: 200,
      message: 'Booking addons deleted successfully',
    })
  } catch (error) {
    console.error('Delete booking addons error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}
