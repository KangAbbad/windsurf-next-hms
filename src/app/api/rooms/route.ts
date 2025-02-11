import type { RoomListItem, CreateRoomBody } from './types'

import { createClient } from '@/providers/supabase/server'
import { createApiResponse, createErrorResponse, PaginatedDataResponse } from '@/services/apiResponse'

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
        floor(*),
        room_class(*),
        room_status(*)
      `,
      { count: 'exact' }
    )

    // Apply search filter if provided
    if (search) {
      roomsQuery = roomsQuery.ilike('number', `%${search}%`)
    }

    const {
      data: rooms,
      error: roomsError,
      count,
    } = await roomsQuery.range(offset, offset + limit - 1).order('number', { ascending: true })

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
      .from('room_class_bed_type')
      .select('*, bed_type(*)')
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
      .from('room_class_feature')
      .select('*, feature(*)')
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
      items,
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
    const supabase = await createClient()
    const newRoom: CreateRoomBody = await request.json()

    // Validate required fields
    if (typeof newRoom.number !== 'number' && !newRoom.floor_id && !newRoom.room_class_id && !newRoom.room_status_id) {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: ['All fields are required'],
      })
    }

    // Validate room number
    if (typeof newRoom.number !== 'number') {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: ['Room number is required'],
      })
    }

    // Validate floor_id
    if (!newRoom.floor_id) {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: ['Floor is required'],
      })
    }

    // Validate room_class_id
    if (!newRoom.room_class_id) {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: ['Room class is required'],
      })
    }

    // Validate room_status_id
    if (!newRoom.room_status_id) {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: ['Room status is required'],
      })
    }

    // Check if room number already exists on the same floor
    const { data: existingRoom } = await supabase
      .from('room')
      .select('id')
      .eq('number', newRoom.number)
      .eq('floor_id', newRoom.floor_id)
      .single()

    if (existingRoom) {
      return createErrorResponse({
        code: 409,
        message: 'Room number already exists',
        errors: ['Room number must be unique per floor'],
      })
    }

    // Create new room with relations
    const { data: room, error } = await supabase
      .from('room')
      .insert([newRoom])
      .select('*, floor(*), room_class(*), room_status(*)')
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
