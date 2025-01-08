import { createClient } from '@/providers/supabase/server'
import { createApiResponse, createErrorResponse } from '@/services/apiResponse'
import type { UpdateBookingRoomInput } from '@/types/booking-room'

export async function GET(_request: Request, { params }: { params: { identifier: string } }): Promise<Response> {
  try {
    const supabase = await createClient()
    const { identifier } = params

    const { data, error } = await supabase
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
        `
      )
      .eq('id', identifier)
      .single()

    if (error) {
      return createErrorResponse({
        code: 404,
        message: 'Booking room not found',
        errors: [error.message],
      })
    }

    return createApiResponse({
      code: 200,
      message: 'Booking room retrieved successfully',
      data,
    })
  } catch (error) {
    console.error('Get booking room error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}

export async function PUT(request: Request, { params }: { params: { identifier: string } }): Promise<Response> {
  try {
    const supabase = await createClient()
    const { identifier } = params
    const updates: UpdateBookingRoomInput = await request.json()

    // Check if booking room exists
    const { data: existingRoom, error: existingError } = await supabase
      .from('booking_room')
      .select('id, check_in, check_out, room_id')
      .eq('id', identifier)
      .single()

    if (existingError || !existingRoom) {
      return createErrorResponse({
        code: 404,
        message: 'Booking room not found',
        errors: ['Invalid booking room ID'],
      })
    }

    if (updates.check_in || updates.check_out) {
      const checkIn = new Date(updates.check_in ?? existingRoom.check_in)
      const checkOut = new Date(updates.check_out ?? existingRoom.check_out)

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
        .eq('room_id', updates.room_id ?? existingRoom.room_id)
        .or(
          `check_in.lte.${updates.check_out ?? existingRoom.check_out},check_out.gte.${updates.check_in ?? existingRoom.check_in}`
        )
        .not('id', 'eq', identifier)
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
          errors: ['Room is already booked for the selected dates'],
        })
      }
    }

    const { data, error } = await supabase
      .from('booking_room')
      .update(updates)
      .eq('id', identifier)
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

    if (error) {
      return createErrorResponse({
        code: 400,
        message: error.message,
        errors: [error.message],
      })
    }

    return createApiResponse({
      code: 200,
      message: 'Booking room updated successfully',
      data,
    })
  } catch (error) {
    console.error('Update booking room error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}

export async function DELETE(_request: Request, { params }: { params: { identifier: string } }): Promise<Response> {
  try {
    const supabase = await createClient()
    const { identifier } = params

    // Check if booking room exists
    const { data: existingRoom, error: existingError } = await supabase
      .from('booking_room')
      .select('id')
      .eq('id', identifier)
      .single()

    if (existingError || !existingRoom) {
      return createErrorResponse({
        code: 404,
        message: 'Booking room not found',
        errors: ['Invalid booking room ID'],
      })
    }

    const { error } = await supabase.from('booking_room').delete().eq('id', identifier)

    if (error) {
      return createErrorResponse({
        code: 400,
        message: error.message,
        errors: [error.message],
      })
    }

    return createApiResponse({
      code: 200,
      message: 'Booking room deleted successfully',
    })
  } catch (error) {
    console.error('Delete booking room error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}
