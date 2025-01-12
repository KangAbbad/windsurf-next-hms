import { createClient } from '@/providers/supabase/server'
import { createApiResponse, createErrorResponse, PaginatedDataResponse } from '@/services/apiResponse'
import type { RoomListItem, CreateRoomBody } from '@/types/room'

export async function GET(request: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') ?? '1', 10)
    const limit = parseInt(searchParams.get('limit') ?? '10', 10)
    const search = searchParams.get('search') ?? ''

    const offset = (page - 1) * limit

    const supabase = await createClient()

    // Get rooms with basic relations
    let roomsQuery = supabase.from('room').select(
      `
        *,
        floor:floor_id(*),
        room_class:room_class_id(*),
        room_status:status_id(*)
      `,
      { count: 'exact' }
    )

    // Apply search filter if provided
    if (search) {
      roomsQuery = roomsQuery.ilike('room_number', `%${search}%`)
    }

    const {
      data: rooms,
      error: roomsError,
      count,
    } = await roomsQuery.range(offset, offset + limit - 1).order('room_number', { ascending: true })

    if (roomsError) {
      return createErrorResponse({
        code: 400,
        message: roomsError.message,
        errors: [roomsError.message],
      })
    }

    // Get all unique room class IDs
    const roomClassIds = [...new Set(rooms?.map((room) => room.room_class.id) ?? [])]

    // Get bed types for all room classes
    const { data: bedTypes, error: bedTypesError } = await supabase
      .from('room_class_bed_types')
      .select(
        `
        room_class_id,
        num_beds,
        bed_type:bed_type_id(
          id,
          bed_type_name
        )
      `
      )
      .in('room_class_id', roomClassIds)

    if (bedTypesError) {
      return createErrorResponse({
        code: 400,
        message: bedTypesError.message,
        errors: [bedTypesError.message],
      })
    }

    // Get features for all room classes
    const { data: features, error: featuresError } = await supabase
      .from('room_class_features')
      .select(
        `
        room_class_id,
        feature:feature_id(
          id,
          feature_name
        )
      `
      )
      .in('room_class_id', roomClassIds)

    if (featuresError) {
      return createErrorResponse({
        code: 400,
        message: featuresError.message,
        errors: [featuresError.message],
      })
    }

    // Combine all data
    const items = rooms?.map((room) => ({
      ...room,
      room_class: {
        ...room.room_class,
        bed_types: bedTypes?.filter((bt) => bt.room_class_id === room.room_class.id),
        features: features?.filter((f) => f.room_class_id === room.room_class.id),
      },
    }))

    const response: PaginatedDataResponse<RoomListItem> = {
      items: items ?? [],
      meta: {
        page,
        limit,
        total: count ?? 0,
        total_pages: Math.ceil((count ?? 0) / limit),
      },
    }

    return createApiResponse<PaginatedDataResponse<RoomListItem>>({
      code: 200,
      message: 'Room list retrieved successfully',
      data: response,
    })
  } catch (error) {
    console.error('[GET /api/rooms]:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as CreateRoomBody

    // Validate required fields
    const requiredFields = ['room_number', 'room_class_id', 'status_id', 'floor_id']
    const missingFields = requiredFields.filter((field) => !body[field as keyof CreateRoomBody])
    if (missingFields.length > 0) {
      return createErrorResponse({
        code: 400,
        message: 'Missing required fields',
        errors: missingFields.map((field) => `${field} is required`),
      })
    }

    const supabase = await createClient()

    // Check if room number already exists
    const { data: existingRoom } = await supabase.from('room').select('id').eq('room_number', body.room_number).single()

    if (existingRoom) {
      return createErrorResponse({
        code: 400,
        message: 'Room number already exists',
        errors: ['Room number must be unique'],
      })
    }

    // Create new room
    const { data: room, error } = await supabase
      .from('room')
      .insert({
        room_number: body.room_number,
        room_class_id: body.room_class_id,
        status_id: body.status_id,
        floor_id: body.floor_id,
      })
      .select('*, room_class(*), room_status(*), floor(*)')
      .single()

    if (error) {
      return createErrorResponse({
        code: 400,
        message: error.message,
        errors: [error.message],
      })
    }

    return createApiResponse<RoomListItem>({
      code: 201,
      message: 'Room created successfully',
      data: room,
    })
  } catch (error) {
    console.error('[POST /api/rooms]:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}
