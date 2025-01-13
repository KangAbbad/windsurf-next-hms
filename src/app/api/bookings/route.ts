import { createClient } from '@/providers/supabase/server'
import { createApiResponse, createErrorResponse, PaginatedDataResponse } from '@/services/apiResponse'
import type { BookingListItem, CreateBookingBody } from '@/types/booking'

export async function GET(request: Request): Promise<Response> {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    // Pagination params
    const page = Number(searchParams.get('page')) || 1
    const limit = Number(searchParams.get('limit')) || 10
    const offset = (page - 1) * limit

    // Search params
    const search = searchParams.get('search')?.toLowerCase() ?? ''
    const searchBy = searchParams.get('searchBy') ?? 'guest' // guest, dates
    const startDate = searchParams.get('startDate') ?? ''
    const endDate = searchParams.get('endDate') ?? ''

    // Build base query with relations
    let query = supabase.from('booking').select(
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
      `,
      { count: 'exact' }
    )

    // Apply search filters
    if (search) {
      switch (searchBy) {
        case 'guest':
          // Search by guest name or contact info
          query = query.or(
            `guest.first_name.ilike.%${search}%,guest.last_name.ilike.%${search}%,guest.email_address.ilike.%${search}%,guest.phone_number.ilike.%${search}%`
          )
          break
        case 'dates':
          // Search by date range if both start and end dates are provided
          if (startDate && endDate) {
            query = query.or(`and(checkin_date.gte.${startDate},checkout_date.lte.${endDate})`)
          }
          break
      }
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1).order('checkin_date', { ascending: false })

    const { data: bookings, error, count } = await query

    if (error) {
      return createErrorResponse({
        code: 500,
        message: 'Failed to fetch bookings',
        errors: [error.message],
      })
    }

    // Transform the nested data structure
    const transformedBookings = bookings.map((booking: any) => ({
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
    }))

    const response: PaginatedDataResponse<BookingListItem> = {
      items: transformedBookings,
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
  try {
    const supabase = await createClient()
    const newBooking: CreateBookingBody = await request.json()

    // Validate required fields
    const requiredFields: (keyof CreateBookingBody)[] = [
      'guest_id',
      'payment_status_id',
      'checkin_date',
      'checkout_date',
      'num_adults',
      'booking_amount',
      'room_ids',
    ]

    const missingFields = requiredFields.filter((field) => !newBooking[field])
    if (missingFields.length > 0) {
      return createErrorResponse({
        code: 400,
        message: 'Missing required fields',
        errors: missingFields.map((field) => `${field} is required`),
      })
    }

    // Validate dates
    const checkinDate = new Date(newBooking.checkin_date)
    const checkoutDate = new Date(newBooking.checkout_date)
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

    // Validate numeric fields
    if (newBooking.num_adults <= 0) {
      return createErrorResponse({
        code: 400,
        message: 'Invalid number of adults',
        errors: ['num_adults must be greater than 0'],
      })
    }

    if (newBooking.booking_amount <= 0) {
      return createErrorResponse({
        code: 400,
        message: 'Invalid booking amount',
        errors: ['booking_amount must be greater than 0'],
      })
    }

    if (newBooking.num_children < 0) {
      return createErrorResponse({
        code: 400,
        message: 'Invalid number of children',
        errors: ['num_children cannot be negative'],
      })
    }

    // Check if rooms exist and are available for the given dates
    const { data: rooms, error: roomsError } = await supabase
      .from('room')
      .select('id, status_id')
      .in('id', newBooking.room_ids)

    if (roomsError || !rooms || rooms.length !== newBooking.room_ids.length) {
      return createErrorResponse({
        code: 400,
        message: 'Invalid rooms',
        errors: ['One or more rooms do not exist'],
      })
    }

    // Check if rooms are already booked for the given dates
    const { data: existingBookings, error: bookingsError } = await supabase
      .from('booking_room')
      .select('room_id, booking:booking_id(checkin_date, checkout_date)')
      .in('room_id', newBooking.room_ids)

    if (bookingsError) {
      return createErrorResponse({
        code: 500,
        message: 'Error checking room availability',
        errors: [bookingsError.message],
      })
    }

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

    if (unavailableRooms && unavailableRooms.length > 0) {
      return createErrorResponse({
        code: 400,
        message: 'Rooms not available',
        errors: ['One or more rooms are not available for the selected dates'],
      })
    }

    // Create booking
    const { data: booking, error: bookingError } = await supabase
      .from('booking')
      .insert({
        guest_id: newBooking.guest_id,
        payment_status_id: newBooking.payment_status_id,
        checkin_date: newBooking.checkin_date,
        checkout_date: newBooking.checkout_date,
        num_adults: newBooking.num_adults,
        num_children: newBooking.num_children,
        booking_amount: newBooking.booking_amount,
      })
      .select()
      .single()

    if (bookingError || !booking) {
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

    // Return the created booking with all relations
    const { data: createdBooking, error: fetchError } = await supabase
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
      guest: createdBooking.guest,
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
