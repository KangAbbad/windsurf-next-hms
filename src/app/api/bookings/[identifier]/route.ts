import { createClient } from '@/providers/supabase/server'
import { createApiResponse, createErrorResponse } from '@/services/apiResponse'
import type { BookingListItem, UpdateBookingBody } from '@/types/booking'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ identifier: string }> }
): Promise<Response> {
  try {
    const supabase = await createClient()
    const { identifier } = await params

    const { data: booking, error } = await supabase
      .from('booking')
      .select(
        `
          *,
          guest:guest_id(*),
          payment_status:payment_status_id(*),
          rooms:booking_room(
            room:room_id(
              *,
              floor:floor_id(*),
              room_class:room_class_id(*)
            )
          ),
          addons:booking_addon(
            addon:addon_id(*)
          )
        `
      )
      .eq('id', identifier)
      .single()

    if (error) {
      return createErrorResponse({
        code: 404,
        message: 'Booking not found',
        errors: [error.message],
      })
    }

    // Transform the response to match BookingListItem type
    const transformedBooking: BookingListItem = {
      id: booking.id,
      guest: booking.guest,
      payment_status: booking.payment_status,
      rooms: booking.rooms.map((br: any) => ({
        ...br.room,
        floor: br.room.floor,
        room_class: br.room.room_class,
      })),
      addons: booking.addons.map((ba: any) => ba.addon),
      checkin_date: booking.checkin_date,
      checkout_date: booking.checkout_date,
      num_adults: booking.num_adults,
      num_children: booking.num_children,
      booking_amount: booking.booking_amount,
      created_at: booking.created_at,
      updated_at: booking.updated_at,
    }

    return createApiResponse<BookingListItem>({
      code: 200,
      message: 'Booking details retrieved successfully',
      data: transformedBooking,
    })
  } catch (error) {
    console.error('Get booking details error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ identifier: string }> }
): Promise<Response> {
  try {
    const supabase = await createClient()
    const { identifier } = await params
    const updates: UpdateBookingBody = await request.json()

    // Check if booking exists
    const { data: existingBooking, error: checkError } = await supabase
      .from('booking')
      .select('*')
      .eq('id', identifier)
      .single()

    if (checkError || !existingBooking) {
      return createErrorResponse({
        code: 404,
        message: 'Booking not found',
        errors: ['Booking with the specified ID does not exist'],
      })
    }

    // Validate dates if provided
    if (updates.checkin_date || updates.checkout_date) {
      const checkinDate = new Date(updates.checkin_date ?? existingBooking.checkin_date)
      const checkoutDate = new Date(updates.checkout_date ?? existingBooking.checkout_date)
      const today = new Date()

      if (isNaN(checkinDate.getTime()) || isNaN(checkoutDate.getTime())) {
        return createErrorResponse({
          code: 400,
          message: 'Invalid dates',
          errors: ['checkin_date and checkout_date must be valid dates'],
        })
      }

      if (checkinDate < today) {
        return createErrorResponse({
          code: 400,
          message: 'Invalid checkin date',
          errors: ['checkin_date cannot be in the past'],
        })
      }

      if (checkoutDate <= checkinDate) {
        return createErrorResponse({
          code: 400,
          message: 'Invalid checkout date',
          errors: ['checkout_date must be after checkin_date'],
        })
      }
    }

    // Validate numeric fields if provided
    if (updates.num_adults !== undefined && updates.num_adults <= 0) {
      return createErrorResponse({
        code: 400,
        message: 'Invalid number of adults',
        errors: ['num_adults must be greater than 0'],
      })
    }

    if (updates.booking_amount !== undefined && updates.booking_amount <= 0) {
      return createErrorResponse({
        code: 400,
        message: 'Invalid booking amount',
        errors: ['booking_amount must be greater than 0'],
      })
    }

    if (updates.num_children !== undefined && updates.num_children < 0) {
      return createErrorResponse({
        code: 400,
        message: 'Invalid number of children',
        errors: ['num_children cannot be negative'],
      })
    }

    // Check room availability if rooms are being updated
    if (updates.room_ids) {
      // Check if rooms exist
      const { data: rooms, error: roomsError } = await supabase.from('room').select('id').in('id', updates.room_ids)

      if (roomsError || !rooms || rooms.length !== updates.room_ids.length) {
        return createErrorResponse({
          code: 400,
          message: 'Invalid rooms',
          errors: ['One or more rooms do not exist'],
        })
      }

      // Check if new rooms are available
      const { data: existingBookings, error: bookingsError } = await supabase
        .from('booking_room')
        .select('room_id, booking:booking_id(checkin_date, checkout_date)')
        .in('room_id', updates.room_ids)
        .neq('booking_id', identifier)

      if (bookingsError) {
        return createErrorResponse({
          code: 500,
          message: 'Error checking room availability',
          errors: [bookingsError.message],
        })
      }

      const checkinDate = new Date(updates.checkin_date ?? existingBooking.checkin_date)
      const checkoutDate = new Date(updates.checkout_date ?? existingBooking.checkout_date)

      const unavailableRooms = (
        existingBookings as unknown as {
          room_id: any
          booking: {
            checkin_date: any
            checkout_date: any
          }
        }[]
      ).filter((booking) => {
        const existingCheckin = new Date(booking.booking.checkin_date)
        const existingCheckout = new Date(booking.booking.checkout_date)
        return (
          (checkinDate >= existingCheckin && checkinDate < existingCheckout) ||
          (checkoutDate > existingCheckin && checkoutDate <= existingCheckout) ||
          (checkinDate <= existingCheckin && checkoutDate >= existingCheckout)
        )
      })

      if (unavailableRooms.length > 0) {
        return createErrorResponse({
          code: 400,
          message: 'Rooms not available',
          errors: ['One or more rooms are not available for the selected dates'],
        })
      }
    }

    // Update booking
    const { error: updateError } = await supabase
      .from('booking')
      .update({
        guest_id: updates.guest_id,
        payment_status_id: updates.payment_status_id,
        checkin_date: updates.checkin_date,
        checkout_date: updates.checkout_date,
        num_adults: updates.num_adults,
        num_children: updates.num_children,
        booking_amount: updates.booking_amount,
      })
      .eq('id', identifier)

    if (updateError) {
      return createErrorResponse({
        code: 500,
        message: 'Failed to update booking',
        errors: [updateError.message],
      })
    }

    // Update rooms if provided
    if (updates.room_ids) {
      // Delete existing room assignments
      const { error: deleteRoomsError } = await supabase.from('booking_room').delete().eq('booking_id', identifier)

      if (deleteRoomsError) {
        return createErrorResponse({
          code: 500,
          message: 'Failed to update room assignments',
          errors: [deleteRoomsError.message],
        })
      }

      // Insert new room assignments
      const bookingRooms = updates.room_ids.map((room_id) => ({
        booking_id: identifier,
        room_id,
      }))

      const { error: insertRoomsError } = await supabase.from('booking_room').insert(bookingRooms)

      if (insertRoomsError) {
        return createErrorResponse({
          code: 500,
          message: 'Failed to update room assignments',
          errors: [insertRoomsError.message],
        })
      }
    }

    // Update addons if provided
    if (updates.addon_ids !== undefined) {
      // Delete existing addon assignments
      const { error: deleteAddonsError } = await supabase.from('booking_addon').delete().eq('booking_id', identifier)

      if (deleteAddonsError) {
        return createErrorResponse({
          code: 500,
          message: 'Failed to update addon assignments',
          errors: [deleteAddonsError.message],
        })
      }

      // Insert new addon assignments if any
      if (updates.addon_ids.length > 0) {
        const bookingAddons = updates.addon_ids.map((addon_id) => ({
          booking_id: identifier,
          addon_id,
        }))

        const { error: insertAddonsError } = await supabase.from('booking_addon').insert(bookingAddons)

        if (insertAddonsError) {
          return createErrorResponse({
            code: 500,
            message: 'Failed to update addon assignments',
            errors: [insertAddonsError.message],
          })
        }
      }
    }

    // Fetch updated booking with all relations
    const { data: updatedBooking, error: fetchError } = await supabase
      .from('booking')
      .select(
        `
          *,
          guest:guest_id(*),
          payment_status:payment_status_id(*),
          rooms:booking_room(
            room:room_id(
              *,
              floor:floor_id(*),
              room_class:room_class_id(*)
            )
          ),
          addons:booking_addon(
            addon:addon_id(*)
          )
        `
      )
      .eq('id', identifier)
      .single()

    if (fetchError || !updatedBooking) {
      return createErrorResponse({
        code: 500,
        message: 'Failed to fetch updated booking',
        errors: [fetchError?.message ?? 'Unknown error'],
      })
    }

    // Transform the response to match BookingListItem type
    const transformedBooking: BookingListItem = {
      id: updatedBooking.id,
      guest: updatedBooking.guest,
      payment_status: updatedBooking.payment_status,
      rooms: updatedBooking.rooms.map((br: any) => ({
        ...br.room,
        floor: br.room.floor,
        room_class: br.room.room_class,
      })),
      addons: updatedBooking.addons.map((ba: any) => ba.addon),
      checkin_date: updatedBooking.checkin_date,
      checkout_date: updatedBooking.checkout_date,
      num_adults: updatedBooking.num_adults,
      num_children: updatedBooking.num_children,
      booking_amount: updatedBooking.booking_amount,
      created_at: updatedBooking.created_at,
      updated_at: updatedBooking.updated_at,
    }

    return createApiResponse<BookingListItem>({
      code: 200,
      message: 'Booking updated successfully',
      data: transformedBooking,
    })
  } catch (error) {
    console.error('Update booking error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ identifier: string }> }
): Promise<Response> {
  try {
    const supabase = await createClient()
    const { identifier } = await params

    // Check if booking exists
    const { data: existingBooking, error: checkError } = await supabase
      .from('booking')
      .select('id')
      .eq('id', identifier)
      .single()

    if (checkError || !existingBooking) {
      return createErrorResponse({
        code: 404,
        message: 'Booking not found',
        errors: ['Booking with the specified ID does not exist'],
      })
    }

    // Delete booking (related records in booking_room and booking_addon will be deleted by foreign key constraints)
    const { error: deleteError } = await supabase.from('booking').delete().eq('id', identifier)

    if (deleteError) {
      return createErrorResponse({
        code: 500,
        message: 'Failed to delete booking',
        errors: [deleteError.message],
      })
    }

    return createApiResponse({
      code: 200,
      message: 'Booking deleted successfully',
    })
  } catch (error) {
    console.error('Delete booking error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}
