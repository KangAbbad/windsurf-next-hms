import { createClient } from '@/providers/supabase/server'
import { createApiResponse, createErrorResponse } from '@/services/apiResponse'
import type { BookingData, CreateBookingBody } from '@/types/booking'

export async function GET(request: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url)
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    const page = parseInt(searchParams.get('page') || '1', 10)
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    const search = searchParams.get('search') || ''
    const paymentStatus = searchParams.get('payment_status')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    const offset = (page - 1) * limit

    const supabase = await createClient()

    let query = supabase.from('booking').select(
      `
        *,
        guest!guest_id (
          id,
          first_name,
          last_name,
          email_address,
          phone_number
        ),
        payment_status!payment_status_id (
          id,
          payment_status_name
        ),
        rooms:booking_room (
          room:room_id (
            id,
            room_number,
            floor!floor_id (
              id,
              floor_number
            ),
            room_class!room_class_id (
              id,
              class_name,
              base_price,
              bed_types:room_class_bed_type (
                num_beds,
                bed_type!bed_type_id (
                  id,
                  bed_type_name
                )
              ),
              features:room_class_feature (
                feature!feature_id (
                  id,
                  feature_name
                )
              )
            ),
            status!status_id (
              id,
              status_name
            )
          )
        ),
        addons:booking_addon (
          addon!addon_id (
            id,
            addon_name,
            price
          )
        )
      `,
      { count: 'exact' }
    )

    // Apply filters
    if (search) {
      query = query.or(
        `guest.first_name.ilike.%${search}%,guest.last_name.ilike.%${search}%,guest.email_address.ilike.%${search}%`
      )
    }

    if (paymentStatus) {
      query = query.eq('payment_status.payment_status_name', paymentStatus)
    }

    if (startDate) {
      query = query.gte('checkin_date', startDate)
    }

    if (endDate) {
      query = query.lte('checkout_date', endDate)
    }

    const {
      data: bookings,
      error,
      count,
    } = await query.range(offset, offset + limit - 1).order('created_at', { ascending: false })

    if (error) {
      return createErrorResponse({
        code: 400,
        message: error.message,
        errors: [error.message],
      })
    }

    // Transform the data to a more friendly format
    const transformedData = bookings.map((booking: BookingData) => ({
      id: booking.id,
      guest: {
        id: booking.guest.id,
        first_name: booking.guest.first_name,
        last_name: booking.guest.last_name,
        email: booking.guest.email_address,
        phone: booking.guest.phone_number,
      },
      payment_status: {
        id: booking.payment_status.id,
        name: booking.payment_status.payment_status_name,
      },
      rooms: booking.rooms.map((br: any) => ({
        id: br.room.id,
        room_number: br.room.room_number,
        floor: {
          id: br.room.floor.id,
          number: br.room.floor.floor_number,
        },
        class: {
          id: br.room.room_class.id,
          name: br.room.room_class.class_name,
          base_price: br.room.room_class.base_price,
          beds: br.room.room_class.bed_types.map((bed: { bed_type: { bed_type_name: string }; num_beds: number }) => ({
            type: bed.bed_type.bed_type_name,
            count: bed.num_beds,
          })),
          features: br.room.room_class.features.map((feature: { feature: { id: number; feature_name: string } }) => ({
            id: String(feature.feature.id),
            name: feature.feature.feature_name,
          })),
        },
        status: {
          id: br.room.status.id,
          name: br.room.status.status_name,
        },
      })),
      addons: booking.addons.map((ba: any) => ({
        id: ba.addon.id,
        name: ba.addon.addon_name,
        price: ba.addon.price,
      })),
      checkin_date: booking.checkin_date,
      checkout_date: booking.checkout_date,
      num_adults: booking.num_adults,
      num_children: booking.num_children,
      booking_amount: booking.booking_amount,
      created_at: booking.created_at,
      updated_at: booking.updated_at,
    }))

    return createApiResponse({
      code: 200,
      message: 'Booking list retrieved successfully',
      data: {
        bookings: transformedData,
        pagination: {
          total: count,
          page,
          limit,
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          total_pages: Math.ceil((count || 0) / limit),
        },
      },
    })
  } catch (error) {
    console.error('Get bookings error:', error)
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
    const body = await request.json()

    if (!Array.isArray(body)) {
      return createErrorResponse({
        code: 400,
        message: 'Request body must be an array of bookings',
        errors: ['Invalid request format'],
      })
    }

    // Validate all bookings first
    const validationErrors: { index: number; errors: string[] }[] = []
    const bookingsToCreate = body.map((booking: CreateBookingBody, index) => {
      const errors: string[] = []
      const { guest_id, payment_status_id, room_ids, checkin_date, checkout_date, num_adults, booking_amount } = booking

      if (!guest_id) errors.push('guest_id is required')
      if (!payment_status_id) errors.push('payment_status_id is required')
      if (!Array.isArray(room_ids) || room_ids.length === 0) errors.push('At least one room_id is required')
      if (!checkin_date) errors.push('checkin_date is required')
      if (!checkout_date) errors.push('checkout_date is required')
      if (!num_adults || num_adults < 1) errors.push('num_adults must be at least 1')
      if (!booking_amount || booking_amount <= 0) errors.push('booking_amount must be greater than 0')

      if (errors.length > 0) {
        validationErrors.push({ index, errors })
      }

      return booking
    })

    if (validationErrors.length > 0) {
      return createErrorResponse({
        code: 400,
        message: 'Validation failed for some bookings',
        errors: validationErrors.map(
          (error) => `Booking at index ${error.index} has errors: ${error.errors.join(', ')}`
        ),
      })
    }

    // Start transaction
    const { data: result, error: transactionError } = await supabase.rpc('create_bookings', {
      bookings: bookingsToCreate,
    })

    if (transactionError) {
      return createErrorResponse({
        code: 400,
        message: 'Error creating bookings',
        errors: [transactionError.message],
      })
    }

    // Fetch created bookings
    const { data: createdBookings, error: fetchError } = await supabase
      .from('booking')
      .select(
        `
        *,
        guest!guest_id (
          id,
          first_name,
          last_name,
          email_address,
          phone_number
        ),
        payment_status!payment_status_id (
          id,
          payment_status_name
        ),
        rooms:booking_room (
          room:room_id (
            id,
            room_number,
            floor!floor_id (
              id,
              floor_number
            ),
            room_class!room_class_id (
              id,
              class_name,
              base_price,
              bed_types:room_class_bed_type (
                num_beds,
                bed_type!bed_type_id (
                  id,
                  bed_type_name
                )
              ),
              features:room_class_feature (
                feature!feature_id (
                  id,
                  feature_name
                )
              )
            ),
            status!status_id (
              id,
              status_name
            )
          )
        ),
        addons:booking_addon (
          addon!addon_id (
            id,
            addon_name,
            price
          )
        )
      `
      )
      .in(
        'id',
        result.map((r: any) => r.id)
      )
      .order('created_at', { ascending: false })

    if (fetchError) {
      return createErrorResponse({
        code: 400,
        message: 'Error fetching created bookings',
        errors: [fetchError.message],
      })
    }

    // Transform response data
    const transformedBookings = createdBookings.map((booking: BookingData) => ({
      id: booking.id,
      guest: {
        id: booking.guest.id,
        first_name: booking.guest.first_name,
        last_name: booking.guest.last_name,
        email: booking.guest.email_address,
        phone: booking.guest.phone_number,
      },
      payment_status: {
        id: booking.payment_status.id,
        name: booking.payment_status.payment_status_name,
      },
      rooms: booking.rooms.map((br: any) => ({
        id: br.room.id,
        room_number: br.room.room_number,
        floor: {
          id: br.room.floor.id,
          number: br.room.floor.floor_number,
        },
        class: {
          id: br.room.room_class.id,
          name: br.room.room_class.class_name,
          base_price: br.room.room_class.base_price,
          beds: br.room.room_class.bed_types.map((bed: { bed_type: { bed_type_name: string }; num_beds: number }) => ({
            type: bed.bed_type.bed_type_name,
            count: bed.num_beds,
          })),
          features: br.room.room_class.features.map((feature: { feature: { id: number; feature_name: string } }) => ({
            id: String(feature.feature.id),
            name: feature.feature.feature_name,
          })),
        },
        status: {
          id: br.room.status.id,
          name: br.room.status.status_name,
        },
      })),
      addons: booking.addons.map((ba: any) => ({
        id: ba.addon.id,
        name: ba.addon.addon_name,
        price: ba.addon.price,
      })),
      checkin_date: booking.checkin_date,
      checkout_date: booking.checkout_date,
      num_adults: booking.num_adults,
      num_children: booking.num_children,
      booking_amount: booking.booking_amount,
      created_at: booking.created_at,
      updated_at: booking.updated_at,
    }))

    return createApiResponse({
      code: 201,
      message: `Successfully created ${transformedBookings.length} bookings`,
      data: transformedBookings,
    })
  } catch (error) {
    console.error('Bulk create bookings error:', error)
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
    const body = await request.json()
    const { booking_ids } = body

    if (!Array.isArray(booking_ids) || booking_ids.length === 0) {
      return createErrorResponse({
        code: 400,
        message: 'booking_ids must be a non-empty array',
        errors: ['Invalid request format'],
      })
    }

    // Delete booking rooms
    const { error: deleteRoomsError } = await supabase.from('booking_room').delete().in('booking_id', booking_ids)

    if (deleteRoomsError) {
      return createErrorResponse({
        code: 400,
        message: 'Error deleting booking rooms',
        errors: [deleteRoomsError.message],
      })
    }

    // Delete booking addons
    const { error: deleteAddonsError } = await supabase.from('booking_addon').delete().in('booking_id', booking_ids)

    if (deleteAddonsError) {
      return createErrorResponse({
        code: 400,
        message: 'Error deleting booking addons',
        errors: [deleteAddonsError.message],
      })
    }

    // Delete bookings
    const { error: deleteError } = await supabase.from('booking').delete().in('id', booking_ids)

    if (deleteError) {
      return createErrorResponse({
        code: 400,
        message: 'Error deleting bookings',
        errors: [deleteError.message],
      })
    }

    return createApiResponse({
      code: 200,
      message: `Successfully deleted ${booking_ids.length} bookings`,
      data: null,
    })
  } catch (error) {
    console.error('Bulk delete bookings error:', error)
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
    const body = await request.json()

    if (!Array.isArray(body)) {
      return createErrorResponse({
        code: 400,
        message: 'Request body must be an array of bookings',
        errors: ['Invalid request format'],
      })
    }

    // Validate all bookings first
    const validationErrors: { index: number; errors: string[] }[] = []
    body.forEach((booking, index) => {
      const errors: string[] = []
      const { id } = booking

      if (!id) errors.push('id is required')

      if (errors.length > 0) {
        validationErrors.push({ index, errors })
      }
    })

    if (validationErrors.length > 0) {
      return createErrorResponse({
        code: 400,
        message: 'Validation failed for some bookings',
        errors: validationErrors.map(
          (error) => `Booking at index ${error.index} has errors: ${error.errors.join(', ')}`
        ),
      })
    }

    // Start transaction
    const { error: transactionError } = await supabase.rpc('update_bookings', {
      bookings: body,
    })

    if (transactionError) {
      return createErrorResponse({
        code: 400,
        message: 'Error updating bookings',
        errors: [transactionError.message],
      })
    }

    // Fetch updated bookings
    const { data: updatedBookings, error: fetchError } = await supabase
      .from('booking')
      .select(
        `
        *,
        guest!guest_id (
          id,
          first_name,
          last_name,
          email_address,
          phone_number
        ),
        payment_status!payment_status_id (
          id,
          payment_status_name
        ),
        rooms:booking_room (
          room:room_id (
            id,
            room_number,
            floor!floor_id (
              id,
              floor_number
            ),
            room_class!room_class_id (
              id,
              class_name,
              base_price,
              bed_types:room_class_bed_type (
                num_beds,
                bed_type!bed_type_id (
                  id,
                  bed_type_name
                )
              ),
              features:room_class_feature (
                feature!feature_id (
                  id,
                  feature_name
                )
              )
            ),
            status!status_id (
              id,
              status_name
            )
          )
        ),
        addons:booking_addon (
          addon!addon_id (
            id,
            addon_name,
            price
          )
        )
      `
      )
      .in(
        'id',
        body.map((b) => b.id)
      )
      .order('updated_at', { ascending: false })

    if (fetchError) {
      return createErrorResponse({
        code: 400,
        message: 'Error fetching updated bookings',
        errors: [fetchError.message],
      })
    }

    // Transform response data
    const transformedBookings = updatedBookings.map((booking: BookingData) => ({
      id: booking.id,
      guest: {
        id: booking.guest.id,
        first_name: booking.guest.first_name,
        last_name: booking.guest.last_name,
        email: booking.guest.email_address,
        phone: booking.guest.phone_number,
      },
      payment_status: {
        id: booking.payment_status.id,
        name: booking.payment_status.payment_status_name,
      },
      rooms: booking.rooms.map((br: any) => ({
        id: br.room.id,
        room_number: br.room.room_number,
        floor: {
          id: br.room.floor.id,
          number: br.room.floor.floor_number,
        },
        class: {
          id: br.room.room_class.id,
          name: br.room.room_class.class_name,
          base_price: br.room.room_class.base_price,
          beds: br.room.room_class.bed_types.map((bed: { bed_type: { bed_type_name: string }; num_beds: number }) => ({
            type: bed.bed_type.bed_type_name,
            count: bed.num_beds,
          })),
          features: br.room.room_class.features.map((feature: { feature: { id: number; feature_name: string } }) => ({
            id: String(feature.feature.id),
            name: feature.feature.feature_name,
          })),
        },
        status: {
          id: br.room.status.id,
          name: br.room.status.status_name,
        },
      })),
      addons: booking.addons.map((ba: any) => ({
        id: ba.addon.id,
        name: ba.addon.addon_name,
        price: ba.addon.price,
      })),
      checkin_date: booking.checkin_date,
      checkout_date: booking.checkout_date,
      num_adults: booking.num_adults,
      num_children: booking.num_children,
      booking_amount: booking.booking_amount,
      created_at: booking.created_at,
      updated_at: booking.updated_at,
    }))

    return createApiResponse({
      code: 200,
      message: `Successfully updated ${transformedBookings.length} bookings`,
      data: transformedBookings,
    })
  } catch (error) {
    console.error('Bulk update bookings error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}
