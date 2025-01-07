import { createApiResponse, createErrorResponse } from '@/lib/api-response'
import { createClient } from '@/providers/supabase/server'
import type {
  BookingRoomResponse,
  BulkCreateBookingRoomInput,
  BulkDeleteBookingRoomInput,
  BulkUpdateBookingRoomInput,
} from '@/types/booking-room'

export async function GET(request: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') ?? '1', 10)
    const limit = parseInt(searchParams.get('limit') ?? '10', 10)
    const booking_id = searchParams.get('booking_id')
    const room_id = searchParams.get('room_id')

    const offset = (page - 1) * limit
    const supabase = await createClient()

    let query = supabase
      .from('booking_room')
      .select(
        `
        id,
        booking_id,
        room_id,
        check_in,
        check_out,
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
        room:room_id(
          id,
          room_number,
          room_class:room_class_id(
            id,
            room_class_name,
            description,
            base_occupancy,
            max_occupancy,
            base_rate,
            features:room_class_feature(
              feature:feature(
                id,
                feature_name
              )
            ),
            bed_types:room_class_bed_type(
              bed_type:bed_type(
                id,
                bed_type_name
              ),
              quantity
            )
          ),
          room_status:room_status_id(
            id,
            status_name,
            description,
            is_available,
            color_code
          )
        )
        `,
        { count: 'exact' }
      )
      .range(offset, offset + limit - 1)

    // Apply filters
    if (booking_id) {
      query = query.eq('booking_id', booking_id)
    }
    if (room_id) {
      query = query.eq('room_id', room_id)
    }

    const { data: booking_rooms, error, count } = await query.order('created_at', { ascending: false })

    if (error) {
      return createErrorResponse({
        code: 400,
        message: error.message,
        errors: [error.message],
      })
    }

    const response: BookingRoomResponse = {
      booking_rooms: (booking_rooms ?? []) as any[],
      pagination: {
        total: count,
        page,
        limit,
        total_pages: count ? Math.ceil(count / limit) : null,
      },
    }

    return createApiResponse({
      code: 200,
      message: 'Booking rooms retrieved successfully',
      data: response,
    })
  } catch (error) {
    console.error('List booking rooms error:', error)
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
    const { items }: BulkCreateBookingRoomInput = await request.json()

    // Validate request
    if (!Array.isArray(items) || items.length === 0) {
      return createErrorResponse({
        code: 400,
        message: 'Invalid request body',
        errors: ['items must be a non-empty array'],
      })
    }

    // Validate each item
    for (const item of items) {
      if (!item.booking_id || !item.room_id || !item.check_in || !item.check_out) {
        return createErrorResponse({
          code: 400,
          message: 'Missing required fields',
          errors: ['booking_id, room_id, check_in, and check_out are required for each item'],
        })
      }

      // Validate dates
      const checkIn = new Date(item.check_in)
      const checkOut = new Date(item.check_out)
      if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
        return createErrorResponse({
          code: 400,
          message: 'Invalid dates',
          errors: ['check_in and check_out must be valid dates'],
        })
      }
      if (checkOut <= checkIn) {
        return createErrorResponse({
          code: 400,
          message: 'Invalid date range',
          errors: ['check_out must be after check_in'],
        })
      }

      // Check if booking exists
      const { data: booking, error: bookingError } = await supabase
        .from('booking')
        .select('id')
        .eq('id', item.booking_id)
        .single()

      if (bookingError || !booking) {
        return createErrorResponse({
          code: 404,
          message: 'Booking not found',
          errors: [`Booking with ID ${item.booking_id} does not exist`],
        })
      }

      // Check if room exists
      const { data: room, error: roomError } = await supabase.from('room').select('id').eq('id', item.room_id).single()

      if (roomError || !room) {
        return createErrorResponse({
          code: 404,
          message: 'Room not found',
          errors: [`Room with ID ${item.room_id} does not exist`],
        })
      }

      // Check if room is already booked for the given dates
      const { data: existingBooking, error: existingError } = await supabase
        .from('booking_room')
        .select('id')
        .eq('room_id', item.room_id)
        .or(`check_in.lte.${item.check_out},check_out.gte.${item.check_in}`)
        .not('booking_id', 'eq', item.booking_id)
        .limit(1)

      if (existingError) {
        return createErrorResponse({
          code: 400,
          message: existingError.message,
          errors: [existingError.message],
        })
      }

      if (existingBooking && existingBooking.length > 0) {
        return createErrorResponse({
          code: 400,
          message: 'Room already booked',
          errors: [`Room ${item.room_id} is already booked for the selected dates`],
        })
      }
    }

    // Create booking rooms
    const { data, error } = await supabase
      .from('booking_room')
      .insert(items)
      .select(
        `
        id,
        booking_id,
        room_id,
        check_in,
        check_out,
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
        room:room_id(
          id,
          room_number,
          room_class:room_class_id(
            id,
            room_class_name,
            description,
            base_occupancy,
            max_occupancy,
            base_rate,
            features:room_class_feature(
              feature:feature(
                id,
                feature_name
              )
            ),
            bed_types:room_class_bed_type(
              bed_type:bed_type(
                id,
                bed_type_name
              ),
              quantity
            )
          ),
          room_status:room_status_id(
            id,
            status_name,
            description,
            is_available,
            color_code
          )
        )
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
      message: 'Booking rooms created successfully',
      data,
    })
  } catch (error) {
    console.error('Create booking rooms error:', error)
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
    const { items }: BulkUpdateBookingRoomInput = await request.json()

    // Validate request
    if (!Array.isArray(items) || items.length === 0) {
      return createErrorResponse({
        code: 400,
        message: 'Invalid request body',
        errors: ['items must be a non-empty array'],
      })
    }

    // Validate each item
    for (const item of items) {
      if (!item.id) {
        return createErrorResponse({
          code: 400,
          message: 'Missing required fields',
          errors: ['id is required for each item'],
        })
      }

      // Check if booking room exists
      const { data: existingRoom, error: existingError } = await supabase
        .from('booking_room')
        .select('id')
        .eq('id', item.id)
        .single()

      if (existingError || !existingRoom) {
        return createErrorResponse({
          code: 404,
          message: 'Booking room not found',
          errors: [`Booking room with ID ${item.id} does not exist`],
        })
      }

      if (item.check_in || item.check_out) {
        const { data: current } = await supabase
          .from('booking_room')
          .select('check_in, check_out')
          .eq('id', item.id)
          .single()

        const checkIn = new Date(item.check_in ?? current?.check_in)
        const checkOut = new Date(item.check_out ?? current?.check_out)

        if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
          return createErrorResponse({
            code: 400,
            message: 'Invalid dates',
            errors: ['check_in and check_out must be valid dates'],
          })
        }

        if (checkOut <= checkIn) {
          return createErrorResponse({
            code: 400,
            message: 'Invalid date range',
            errors: ['check_out must be after check_in'],
          })
        }

        // Check if room is already booked for the new dates
        const { data: existingBooking, error: bookingError } = await supabase
          .from('booking_room')
          .select('id')
          .eq('room_id', item.room_id)
          .or(`check_in.lte.${item.check_out},check_out.gte.${item.check_in}`)
          .not('id', 'eq', item.id)
          .limit(1)

        if (bookingError) {
          return createErrorResponse({
            code: 400,
            message: bookingError.message,
            errors: [bookingError.message],
          })
        }

        if (existingBooking && existingBooking.length > 0) {
          return createErrorResponse({
            code: 400,
            message: 'Room already booked',
            errors: [`Room is already booked for the selected dates`],
          })
        }
      }
    }

    // Update booking rooms
    const updates = items.map((item) => {
      const { id, ...updateData } = item
      return supabase
        .from('booking_room')
        .update(updateData)
        .eq('id', id)
        .select(
          `
          id,
          booking_id,
          room_id,
          check_in,
          check_out,
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
          room:room_id(
            id,
            room_number,
            room_class:room_class_id(
              id,
              room_class_name,
              description,
              base_occupancy,
              max_occupancy,
              base_rate,
              features:room_class_feature(
                feature:feature(
                  id,
                  feature_name
                )
              ),
              bed_types:room_class_bed_type(
                bed_type:bed_type(
                  id,
                  bed_type_name
                ),
                quantity
              )
            ),
            room_status:room_status_id(
              id,
              status_name,
              description,
              is_available,
              color_code
            )
          )
          `
        )
        .single()
    })

    const results = await Promise.all(updates)
    const errors = results.filter((r) => r.error).map((r) => r.error)
    if (errors.length > 0) {
      return createErrorResponse({
        code: 400,
        message: 'Error updating booking rooms',
        errors: errors.map((e) => e?.message ?? 'Unknown error'),
      })
    }

    return createApiResponse({
      code: 200,
      message: 'Booking rooms updated successfully',
      data: results.map((r) => r.data),
    })
  } catch (error) {
    console.error('Update booking rooms error:', error)
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
    const { ids }: BulkDeleteBookingRoomInput = await request.json()

    // Validate request
    if (!Array.isArray(ids) || ids.length === 0) {
      return createErrorResponse({
        code: 400,
        message: 'Invalid request body',
        errors: ['ids must be a non-empty array'],
      })
    }

    // Check if all booking rooms exist
    const { data: existingRooms, error: existingError } = await supabase.from('booking_room').select('id').in('id', ids)

    if (existingError) {
      return createErrorResponse({
        code: 400,
        message: existingError.message,
        errors: [existingError.message],
      })
    }

    if (!existingRooms || existingRooms.length !== ids.length) {
      return createErrorResponse({
        code: 404,
        message: 'Some booking rooms not found',
        errors: ['One or more booking rooms do not exist'],
      })
    }

    // Delete booking rooms
    const { error } = await supabase.from('booking_room').delete().in('id', ids)

    if (error) {
      return createErrorResponse({
        code: 400,
        message: error.message,
        errors: [error.message],
      })
    }

    return createApiResponse({
      code: 200,
      message: 'Booking rooms deleted successfully',
    })
  } catch (error) {
    console.error('Delete booking rooms error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}
