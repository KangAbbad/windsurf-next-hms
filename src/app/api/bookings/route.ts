import type { BookingListItem, CreateBookingBody } from './types'
import { AddonListItem } from '../addons/types'
import { GuestListItem } from '../guests/types'
import { RoomStatusListItem } from '../room-statuses/types'

import { createClient } from '@/providers/supabase/server'
import { createApiResponse, createErrorResponse, PaginatedDataResponse } from '@/services/apiResponse'

export async function GET(request: Request): Promise<Response> {
  const startHrtime = process.hrtime()

  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    // Pagination params
    const page = Number(searchParams.get('page')) || 1
    const limit = Number(searchParams.get('limit')) || 10
    const offset = (page - 1) * limit

    // Build base query with relations
    let query = supabase.from('booking').select(
      `
        *,
        guests:booking_guest(guest(*)),
        payment_status(*),
        rooms:booking_room(
          room(*, floor(*), room_class(*))
        ),
        addons:booking_addon(addon(*))
      `,
      { count: 'exact' }
    )

    query = query.range(offset, offset + limit - 1).order('checkin_date', { ascending: false })

    const { data, error, count } = await query

    const items: BookingListItem[] = (data ?? []).map((item) => {
      const { guests, rooms, addons, ...restItem } = item
      const reformatGuests = (guests as { guest: GuestListItem }[]).map((guest) => guest.guest)
      const reformatRooms = (rooms as { room: RoomStatusListItem }[]).map((room) => room.room)
      const reformatAddons = (addons as { addon: AddonListItem }[]).map((addon) => addon.addon)

      return {
        ...restItem,
        guest: reformatGuests?.[0] ?? null,
        rooms: reformatRooms,
        addons: reformatAddons,
      }
    })

    if (error) {
      return createErrorResponse({
        code: 500,
        message: 'Failed to fetch bookings',
        errors: [error.message],
      })
    }

    const response: PaginatedDataResponse<BookingListItem> = {
      items,
      meta: {
        page,
        limit,
        total: count ?? 0,
        total_pages: Math.ceil((count ?? 0) / limit),
      },
    }

    return createApiResponse<PaginatedDataResponse<BookingListItem>>({
      code: 200,
      message: 'Bookings retrieved successfully',
      start_hrtime: startHrtime,
      data: response,
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
  const startHrtime = process.hrtime()

  try {
    const supabase = await createClient()
    const newBooking: CreateBookingBody = await request.json()

    // Validate required fields
    if (
      !newBooking.guest_id &&
      !newBooking.payment_status_id &&
      !newBooking.checkin_date &&
      !newBooking.checkout_date &&
      typeof newBooking.num_adults !== 'number' &&
      !newBooking.booking_amount &&
      !newBooking.room_ids.length &&
      !newBooking.addon_ids?.length
    ) {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: ['All fields are required'],
      })
    }

    // Validate booking guest_id
    if (!newBooking.guest_id) {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: ['Booking guest is required'],
      })
    }

    // Validate booking payment_status_id
    if (!newBooking.payment_status_id) {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: ['Booking payment status is required'],
      })
    }

    // Validate booking checkin_date
    if (!newBooking.checkin_date) {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: ['Booking checkin date is required'],
      })
    }

    // Validate booking checkout_date
    if (!newBooking.checkout_date) {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: ['Booking checkout date is required'],
      })
    }

    // Validate dates
    const checkinDate = new Date(newBooking.checkin_date)
    const checkoutDate = new Date(newBooking.checkout_date)
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

    if (checkinDate < today) {
      return createErrorResponse({
        code: 400,
        message: 'Invalid checkin date',
        errors: ['Booking checkin date cannot be in the past'],
      })
    }

    if (checkoutDate <= checkinDate) {
      return createErrorResponse({
        code: 400,
        message: 'Invalid checkout date',
        errors: ['Booking checkout date must be after checkin date'],
      })
    }

    // Validate booking num_adults
    if (typeof newBooking.num_adults !== 'number') {
      return createErrorResponse({
        code: 400,
        message: 'Invalid booking number of adults',
        errors: ['Booking number of adults must be a number'],
      })
    }

    // Validate booking booking_amount
    if (typeof newBooking.booking_amount !== 'number') {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: ['Booking booking amount must be a number'],
      })
    }

    // Validate booking room_ids
    if (!newBooking.room_ids.length) {
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
      .in('id', newBooking.room_ids)

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
      .in('room_id', newBooking.room_ids)

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

    // Create booking
    const { data: booking, error: bookingError } = await supabase
      .from('booking')
      .insert({
        payment_status_id: newBooking.payment_status_id,
        checkin_date: newBooking.checkin_date,
        checkout_date: newBooking.checkout_date,
        num_adults: newBooking.num_adults,
        num_children: newBooking.num_children,
        booking_amount: newBooking.booking_amount,
      })
      .select()
      .single()

    if (bookingError) {
      return createErrorResponse({
        code: 500,
        message: 'Failed to create booking',
        errors: [bookingError?.message ?? 'Unknown error'],
      })
    }

    // Insert booking rooms
    const bookingRooms = newBooking.room_ids.map((room_id) => ({
      booking_id: booking.id,
      room_id,
    }))

    const { error: bookingRoomsError } = await supabase.from('booking_room').insert(bookingRooms)

    if (bookingRoomsError) {
      return createErrorResponse({
        code: 500,
        message: 'Failed to assign rooms to booking',
        errors: [bookingRoomsError.message],
      })
    }

    // Insert booking addons if provided
    if (newBooking.addon_ids && newBooking.addon_ids.length > 0) {
      const bookingAddons = newBooking.addon_ids.map((addon_id) => ({
        booking_id: booking.id,
        addon_id,
      }))

      const { error: bookingAddonsError } = await supabase.from('booking_addon').insert(bookingAddons)

      if (bookingAddonsError) {
        return createErrorResponse({
          code: 500,
          message: 'Failed to assign addons to booking',
          errors: [bookingAddonsError.message],
        })
      }
    }

    // Insert booking guest
    const { error: bookingGuestError } = await supabase.from('booking_guest').insert({
      booking_id: booking.id,
      guest_id: newBooking.guest_id,
    })

    if (bookingGuestError) {
      return createErrorResponse({
        code: 500,
        message: 'Failed to assign guest to booking',
        errors: [bookingGuestError.message],
      })
    }

    // Return the created booking with all relations
    const { data: createdBooking, error: fetchError } = await supabase
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
      .eq('id', booking.id)
      .single()

    if (fetchError || !createdBooking) {
      return createErrorResponse({
        code: 500,
        message: 'Failed to fetch created booking',
        errors: [fetchError?.message ?? 'Unknown error'],
      })
    }

    // Transform the response to match BookingListItem type
    const transformedBooking: BookingListItem = {
      id: createdBooking.id,
      guest_id: createdBooking.guest_id,
      guest: createdBooking.guest,
      payment_status_id: createdBooking.payment_status_id,
      payment_status: createdBooking.payment_status,
      rooms: createdBooking.rooms.map((br: any) => ({
        ...br.room,
        floor: br.room.floor,
        room_class: br.room.room_class,
      })),
      addons: createdBooking.addons.map((ba: any) => ba.addon),
      checkin_date: createdBooking.checkin_date,
      checkout_date: createdBooking.checkout_date,
      num_adults: createdBooking.num_adults,
      num_children: createdBooking.num_children,
      booking_amount: createdBooking.booking_amount,
      created_at: createdBooking.created_at,
      updated_at: createdBooking.updated_at,
    }

    return createApiResponse<BookingListItem>({
      code: 201,
      message: 'Booking created successfully',
      start_hrtime: startHrtime,
      data: transformedBooking,
    })
  } catch (error) {
    console.error('Create booking error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}
