import { AddonListItem } from '../../addons/types'
import { GuestListItem } from '../../guests/types'
import { RoomStatusListItem } from '../../room-statuses/types'
import { BookingListItem, UpdateBookingBody } from '../types'

import { createClient } from '@/providers/supabase/server'
import { createApiResponse, createErrorResponse } from '@/services/apiResponse'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ identifier: string }> }
): Promise<Response> {
  const startHrtime = process.hrtime()

  try {
    const supabase = await createClient()
    const { identifier } = await params

    const { data, error } = await supabase
      .from('booking')
      .select(
        `
          *,
          guests:booking_guest(guest(*)),
          payment_status(*),
          rooms:booking_room(
            room(*, floor(*), room_class(*))
          ),
          addons:booking_addon(addon(*))
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
    const { guests, rooms, addons, ...restData } = data
    const reformatGuests = (guests as { guest: GuestListItem }[]).map((guest) => guest.guest)
    const reformatRooms = (rooms as { room: RoomStatusListItem }[]).map((room) => room.room)
    const reformatAddons = (addons as { addon: AddonListItem }[]).map((addon) => addon.addon)

    const transformedBooking: BookingListItem = {
      ...restData,
      guest: reformatGuests?.[0] ?? null,
      rooms: reformatRooms,
      addons: reformatAddons,
    }

    return createApiResponse<BookingListItem>({
      code: 200,
      message: 'Booking details retrieved successfully',
      start_hrtime: startHrtime,
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
  const startHrtime = process.hrtime()

  try {
    const supabase = await createClient()
    const { identifier } = await params
    const updateData: UpdateBookingBody = await request.json()

    // Validate required fields
    if (
      !updateData.guest_id &&
      !updateData.payment_status_id &&
      !updateData.checkin_date &&
      !updateData.checkout_date &&
      typeof updateData.num_adults !== 'number' &&
      !updateData.booking_amount &&
      !updateData.room_ids?.length &&
      !updateData.addon_ids?.length
    ) {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: ['All fields are required'],
      })
    }

    // Validate booking guest_id
    if (!updateData.guest_id) {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: ['Booking guest is required'],
      })
    }

    // Validate booking payment_status_id
    if (!updateData.payment_status_id) {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: ['Booking payment status is required'],
      })
    }

    // Validate booking checkin_date
    if (!updateData.checkin_date) {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: ['Booking checkin date is required'],
      })
    }

    // Validate booking checkout_date
    if (!updateData.checkout_date) {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: ['Booking checkout date is required'],
      })
    }

    // Validate dates
    const checkinDate = new Date(updateData.checkin_date)
    const checkoutDate = new Date(updateData.checkout_date)
    const today = new Date()

    // Normalize dates to start of day for comparison
    checkinDate.setHours(0, 0, 0, 0)
    checkoutDate.setHours(0, 0, 0, 0)
    today.setHours(0, 0, 0, 0)

    if (isNaN(checkinDate.getTime()) || isNaN(checkoutDate.getTime())) {
      return createErrorResponse({
        code: 400,
        message: 'Invalid check in/out dates',
        errors: ['Booking checkin and checkout date must be valid dates'],
      })
    }

    // if (checkinDate < today) {
    //   return createErrorResponse({
    //     code: 400,
    //     message: 'Invalid checkin date',
    //     errors: ['Booking checkin date cannot be in the past'],
    //   })
    // }

    if (checkoutDate <= checkinDate) {
      return createErrorResponse({
        code: 400,
        message: 'Invalid checkout date',
        errors: ['Booking checkout date must be after checkin date'],
      })
    }

    // Validate booking num_adults
    if (typeof updateData.num_adults !== 'number') {
      return createErrorResponse({
        code: 400,
        message: 'Invalid booking number of adults',
        errors: ['Booking number of adults must be a number'],
      })
    }

    // Validate booking booking_amount
    if (typeof updateData.booking_amount !== 'number') {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: ['Booking booking amount must be a number'],
      })
    }

    // Validate booking room_ids
    if (!updateData.room_ids?.length) {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: ['Booking rooms are required'],
      })
    }

    // Check if rooms exist and their status
    const { data: rooms, error: roomsError } = await supabase
      .from('room')
      .select('id, number, room_status(*)')
      .in('id', updateData.room_ids)

    if (roomsError) {
      return createErrorResponse({
        code: 500,
        message: 'Error fetching rooms',
        errors: [roomsError.message],
      })
    }

    if (!rooms.length) {
      return createErrorResponse({
        code: 400,
        message: 'Invalid booking rooms',
        errors: ['One or more rooms do not exist'],
      })
    }

    // Check if rooms are available (status check)
    const unavailableRooms = rooms.filter((room) => (room.room_status as unknown as RoomStatusListItem).number > 1)
    if (unavailableRooms.length > 0) {
      return createErrorResponse({
        code: 400,
        message: 'Rooms not available',
        errors: [`Rooms ${unavailableRooms.map((r) => r.number).join(', ')} are not available for booking`],
      })
    }

    // Check if rooms are already booked for the given dates
    const { data: existingBookings, error: bookingsError } = await supabase
      .from('booking_room')
      .select(
        `
          room_id,
          booking:booking_id(
            checkin_date,
            checkout_date
          )
        `
      )
      .in('room_id', updateData.room_ids)
      .neq('booking_id', identifier)

    if (bookingsError) {
      return createErrorResponse({
        code: 500,
        message: 'Error checking room availability',
        errors: [bookingsError.message],
      })
    }

    // Check for booking date conflicts
    const conflictingRooms = existingBookings?.filter((item) => {
      const existingCheckin = new Date((item.booking as unknown as BookingListItem).checkin_date)
      const existingCheckout = new Date((item.booking as unknown as BookingListItem).checkout_date)

      // Check for date overlap
      return (
        (checkinDate >= existingCheckin && checkinDate < existingCheckout) ||
        (checkoutDate > existingCheckin && checkoutDate <= existingCheckout) ||
        (checkinDate <= existingCheckin && checkoutDate >= existingCheckout)
      )
    })

    if (conflictingRooms && conflictingRooms.length > 0) {
      const conflictingRoomNumbers = rooms
        .filter((room) => conflictingRooms.some((cr) => cr.room_id === room.id))
        .map((room) => room.number)
        .join(', ')

      return createErrorResponse({
        code: 400,
        message: 'Rooms not available for selected dates',
        errors: [`Rooms ${conflictingRoomNumbers} are already booked for the selected dates`],
      })
    }

    // Update booking
    const { error: bookingError } = await supabase
      .from('booking')
      .update({
        payment_status_id: updateData.payment_status_id,
        checkin_date: updateData.checkin_date,
        checkout_date: updateData.checkout_date,
        num_adults: updateData.num_adults,
        num_children: updateData.num_children,
        booking_amount: updateData.booking_amount,
      })
      .eq('id', identifier)

    if (bookingError) {
      return createErrorResponse({
        code: 500,
        message: 'Failed to update booking',
        errors: [bookingError.message],
      })
    }

    // Update rooms if provided
    if (updateData.room_ids) {
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
      const bookingRooms = updateData.room_ids.map((room_id) => ({
        booking_id: identifier,
        room_id,
      }))

      const { error: bookingRoomsError } = await supabase.from('booking_room').insert(bookingRooms)

      if (bookingRoomsError) {
        return createErrorResponse({
          code: 500,
          message: 'Failed to update room assignments',
          errors: [bookingRoomsError.message],
        })
      }
    }

    // Update addons if provided
    if (updateData.addon_ids && updateData.addon_ids.length > 0) {
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
      if (updateData.addon_ids.length > 0) {
        const bookingAddons = updateData.addon_ids.map((addon_id) => ({
          booking_id: identifier,
          addon_id,
        }))

        const { error: bookingAddonsError } = await supabase.from('booking_addon').insert(bookingAddons)

        if (bookingAddonsError) {
          return createErrorResponse({
            code: 500,
            message: 'Failed to update addon assignments',
            errors: [bookingAddonsError.message],
          })
        }
      }
    }

    // Update guest if provided
    if (updateData.guest_id) {
      // Delete existing guest assignments
      const { error: deleteGuestError } = await supabase.from('booking_guest').delete().eq('booking_id', identifier)

      if (deleteGuestError) {
        return createErrorResponse({
          code: 500,
          message: 'Failed to update guest assignments',
          errors: [deleteGuestError.message],
        })
      }

      if (updateData.guest_id) {
        const { error: bookingGuestError } = await supabase.from('booking_guest').insert({
          booking_id: identifier,
          guest_id: updateData.guest_id,
        })

        if (bookingGuestError) {
          return createErrorResponse({
            code: 500,
            message: 'Failed to update guest assignments',
            errors: [bookingGuestError.message],
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
          guest(*),
          payment_status(*),
          rooms:booking_room(
            room(*, floor(*), room_class(*))
          ),
          addons:booking_addon(addon(*))
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
      guest_id: updateData.guest_id,
      guest: updatedBooking.guest?.[0],
      payment_status_id: updatedBooking.payment_status_id,
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
      start_hrtime: startHrtime,
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
  const startHrtime = process.hrtime()

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
      start_hrtime: startHrtime,
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
