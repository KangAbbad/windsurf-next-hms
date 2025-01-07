import { createApiResponse, createErrorResponse } from '@/lib/api-response'
import { createClient } from '@/providers/supabase/server'
import type { BookingData, Room, Guest, PaymentStatus, Addon, BookingRoom, BookingAddon } from '@/types/booking'

interface RoomClass {
  id: number
  class_name: string
  base_price: number
  bed_types: {
    num_beds: number
    bed_type: {
      id: number
      bed_type_name: string
    }
  }[]
  features: {
    feature: {
      id: number
      feature_name: string
    }
  }[]
}

interface Floor {
  id: number
  floor_number: number
}

interface DatabaseBooking {
  id: number
  guest_id: number
  payment_status_id: number
  checkin_date: string
  checkout_date: string
  num_adults: number
  num_children: number
  booking_amount: number
  created_at: string
  updated_at: string
  guest: Guest
  payment_status: PaymentStatus
  rooms: {
    room: Room & {
      floor: Floor
      room_class: RoomClass
      status: {
        id: number
        status_name: string
      }[]
    }
  }[]
  addons: {
    addon: Addon
  }[]
}

interface DatabaseExistingBooking {
  room_id: number
  booking: DatabaseBooking
}

interface DatabaseRoom {
  id: number
  room_number: string
  status: {
    id: number
    status_name: string
  }[]
}

interface DatabaseRoomResponse {
  data: DatabaseRoom[] | null
  error: any
}

export async function GET(_request: Request, { params }: { params: { identifier: string } }): Promise<Response> {
  try {
    const { identifier } = params
    const supabase = await createClient()

    const { data: booking, error } = await supabase
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
      .eq('id', identifier)
      .single()

    if (error) {
      return createErrorResponse({
        code: error.code === 'PGRST116' ? 404 : 400,
        message: error.code === 'PGRST116' ? 'Booking not found' : error.message,
        errors: [error.message],
      })
    }

    const dbBooking = booking as DatabaseBooking

    // Transform the data to a more friendly format
    const transformedData: BookingData = {
      id: dbBooking.id,
      guest: {
        id: dbBooking.guest.id,
        first_name: dbBooking.guest.first_name,
        last_name: dbBooking.guest.last_name,
        email_address: dbBooking.guest.email_address,
        phone_number: dbBooking.guest.phone_number,
      },
      payment_status: {
        id: dbBooking.payment_status.id,
        payment_status_name: dbBooking.payment_status.payment_status_name,
      },
      rooms: dbBooking.rooms.map(
        (br): BookingRoom => ({
          room: {
            id: br.room.id,
            room_number: br.room.room_number,
            floor_id: br.room.floor.id,
            room_class_id: br.room.room_class.id,
            status_id: br.room.status[0].id,
            status: {
              id: br.room.status[0].id,
              status_name: br.room.status[0].status_name,
            },
          },
        })
      ),
      addons: dbBooking.addons.map(
        (ba): BookingAddon => ({
          addon: {
            id: ba.addon.id,
            addon_name: ba.addon.addon_name,
            price: ba.addon.price,
          },
        })
      ),
      checkin_date: dbBooking.checkin_date,
      checkout_date: dbBooking.checkout_date,
      num_adults: dbBooking.num_adults,
      num_children: dbBooking.num_children,
      booking_amount: dbBooking.booking_amount,
      created_at: dbBooking.created_at,
      updated_at: dbBooking.updated_at,
    }

    return createApiResponse({
      code: 200,
      message: 'Booking retrieved successfully',
      data: transformedData,
    })
  } catch (error) {
    console.error('Get booking detail error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}

export async function PUT(request: Request, { params }: { params: { identifier: string } }): Promise<Response> {
  try {
    const { identifier } = params
    const supabase = await createClient()

    // Get current booking
    const { data: existingBooking, error: fetchError } = await supabase
      .from('booking')
      .select(
        `
        *,
        rooms:booking_room (
          room_id
        )
      `
      )
      .eq('id', identifier)
      .single()

    if (fetchError) {
      return createErrorResponse({
        code: fetchError.code === 'PGRST116' ? 404 : 400,
        message: fetchError.code === 'PGRST116' ? 'Booking not found' : fetchError.message,
        errors: [fetchError.message],
      })
    }

    const body = await request.json()
    const {
      guest_id,
      payment_status_id,
      room_ids,
      addon_ids,
      checkin_date,
      checkout_date,
      num_adults,
      num_children,
      booking_amount,
    } = body

    // Validate required fields if they are being updated
    const updates: Record<string, any> = {}
    if (guest_id) updates.guest_id = guest_id
    if (payment_status_id) updates.payment_status_id = payment_status_id
    if (checkin_date) updates.checkin_date = checkin_date
    if (checkout_date) updates.checkout_date = checkout_date
    if (num_adults) updates.num_adults = num_adults
    if (typeof num_children !== 'undefined') updates.num_children = num_children
    if (booking_amount) updates.booking_amount = booking_amount

    // If rooms are being updated, validate room availability
    if (room_ids) {
      const roomQuery = await supabase
        .from('room')
        .select(
          `
          id,
          room_number,
          status!status_id (
            id,
            status_name
          )
        `
        )
        .in('id', room_ids)

      const { data: rooms } = roomQuery as DatabaseRoomResponse

      if (!rooms || rooms.length !== room_ids.length) {
        return createErrorResponse({
          code: 400,
          message: 'One or more rooms not found',
          errors: ['Invalid room IDs provided'],
        })
      }

      const unavailableRooms = rooms.filter((room) => room.status[0]?.status_name !== 'available')
      if (unavailableRooms.length > 0) {
        return createErrorResponse({
          code: 400,
          message: 'One or more rooms are not available',
          errors: unavailableRooms.map((room) => `Room ${room.room_number} is not available`),
        })
      }

      const dateRangeConditions = [
        `and(booking.checkin_date.gte.${checkin_date || existingBooking.checkin_date},booking.checkin_date.lt.${checkout_date || existingBooking.checkout_date})`,
        `and(booking.checkout_date.gt.${checkin_date || existingBooking.checkin_date},booking.checkout_date.lte.${checkout_date || existingBooking.checkout_date})`,
        `and(booking.checkin_date.lte.${checkin_date || existingBooking.checkin_date},booking.checkout_date.gte.${checkout_date || existingBooking.checkout_date})`,
      ].join(',')

      // Check for existing bookings in the date range
      const { data: existingBookings, error: bookingError } = (await supabase
        .from('booking_room')
        .select(
          `
          room_id,
          booking: booking_id (
            checkin_date,
            checkout_date
          )
        `
        )
        .in('room_id', room_ids)
        .neq('booking_id', identifier) // Exclude current booking
        .or(dateRangeConditions)) as { data: DatabaseExistingBooking[] | null; error: any }

      if (bookingError) {
        return createErrorResponse({
          code: 400,
          message: 'Error checking existing bookings',
          errors: [bookingError.message],
        })
      }

      if (existingBookings && existingBookings.length > 0) {
        return createErrorResponse({
          code: 400,
          message: 'One or more rooms are already booked for the selected dates',
          errors: existingBookings.map(
            (booking) =>
              `Room ${rooms.find((r) => r.id === booking.room_id)?.room_number} is already booked from ${booking.booking.checkin_date} to ${booking.booking.checkout_date}`
          ),
        })
      }
    }

    // Start transaction
    // 1. Update booking
    const { error: updateError } = await supabase.from('booking').update(updates).eq('id', identifier)

    if (updateError) {
      return createErrorResponse({
        code: 400,
        message: 'Error updating booking',
        errors: [updateError.message],
      })
    }

    // 2. Update rooms if provided
    if (room_ids) {
      // Delete existing room associations
      const { error: deleteRoomsError } = await supabase.from('booking_room').delete().eq('booking_id', identifier)

      if (deleteRoomsError) {
        return createErrorResponse({
          code: 400,
          message: 'Error updating booking rooms',
          errors: [deleteRoomsError.message],
        })
      }

      // Create new room associations
      const bookingRooms = room_ids.map((room_id: any) => ({
        booking_id: identifier,
        room_id,
      }))

      const { error: insertRoomsError } = await supabase.from('booking_room').insert(bookingRooms)

      if (insertRoomsError) {
        return createErrorResponse({
          code: 400,
          message: 'Error updating booking rooms',
          errors: [insertRoomsError.message],
        })
      }
    }

    // 3. Update addons if provided
    if (addon_ids) {
      // Delete existing addon associations
      const { error: deleteAddonsError } = await supabase.from('booking_addon').delete().eq('booking_id', identifier)

      if (deleteAddonsError) {
        return createErrorResponse({
          code: 400,
          message: 'Error updating booking addons',
          errors: [deleteAddonsError.message],
        })
      }

      // Create new addon associations
      const bookingAddons = addon_ids.map((addon_id: any) => ({
        booking_id: identifier,
        addon_id,
      }))

      const { error: insertAddonsError } = await supabase.from('booking_addon').insert(bookingAddons)

      if (insertAddonsError) {
        return createErrorResponse({
          code: 400,
          message: 'Error updating booking addons',
          errors: [insertAddonsError.message],
        })
      }
    }

    // Fetch updated booking details
    const { data: updatedBooking, error: fetchUpdatedError } = await supabase
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
      .eq('id', identifier)
      .single()

    if (fetchUpdatedError) {
      return createErrorResponse({
        code: 400,
        message: 'Error fetching updated booking details',
        errors: [fetchUpdatedError.message],
      })
    }

    // Transform the response data
    const transformedData: BookingData = {
      id: updatedBooking.id,
      guest: {
        id: updatedBooking.guest.id,
        first_name: updatedBooking.guest.first_name,
        last_name: updatedBooking.guest.last_name,
        email_address: updatedBooking.guest.email_address,
        phone_number: updatedBooking.guest.phone_number,
      },
      payment_status: {
        id: updatedBooking.payment_status.id,
        payment_status_name: updatedBooking.payment_status.payment_status_name,
      },
      rooms: updatedBooking.rooms.map(
        (br: any): BookingRoom => ({
          room: {
            id: br.room.id,
            room_number: br.room.room_number,
            floor_id: br.room.floor.id,
            room_class_id: br.room.room_class.id,
            status_id: br.room.status[0].id,
            status: {
              id: br.room.status[0].id,
              status_name: br.room.status[0].status_name,
            },
          },
        })
      ),
      addons: updatedBooking.addons.map(
        (ba: any): BookingAddon => ({
          addon: {
            id: ba.addon.id,
            addon_name: ba.addon.addon_name,
            price: ba.addon.price,
          },
        })
      ),
      checkin_date: updatedBooking.checkin_date,
      checkout_date: updatedBooking.checkout_date,
      num_adults: updatedBooking.num_adults,
      num_children: updatedBooking.num_children,
      booking_amount: updatedBooking.booking_amount,
      created_at: updatedBooking.created_at,
      updated_at: updatedBooking.updated_at,
    }

    return createApiResponse({
      code: 200,
      message: 'Booking updated successfully',
      data: transformedData,
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

export async function DELETE(_request: Request, { params }: { params: { identifier: string } }): Promise<Response> {
  try {
    const { identifier } = params
    const supabase = await createClient()

    // Check if booking exists
    const { error: fetchError } = await supabase.from('booking').select('id').eq('id', identifier).single()

    if (fetchError) {
      return createErrorResponse({
        code: fetchError.code === 'PGRST116' ? 404 : 400,
        message: fetchError.code === 'PGRST116' ? 'Booking not found' : fetchError.message,
        errors: [fetchError.message],
      })
    }

    // Delete booking rooms
    const { error: deleteRoomsError } = await supabase.from('booking_room').delete().eq('booking_id', identifier)

    if (deleteRoomsError) {
      return createErrorResponse({
        code: 400,
        message: 'Error deleting booking rooms',
        errors: [deleteRoomsError.message],
      })
    }

    // Delete booking addons
    const { error: deleteAddonsError } = await supabase.from('booking_addon').delete().eq('booking_id', identifier)

    if (deleteAddonsError) {
      return createErrorResponse({
        code: 400,
        message: 'Error deleting booking addons',
        errors: [deleteAddonsError.message],
      })
    }

    // Delete booking
    const { error: deleteError } = await supabase.from('booking').delete().eq('id', identifier)

    if (deleteError) {
      return createErrorResponse({
        code: 400,
        message: 'Error deleting booking',
        errors: [deleteError.message],
      })
    }

    return createApiResponse({
      code: 200,
      message: 'Booking deleted successfully',
      data: null,
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
