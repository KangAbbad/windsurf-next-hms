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

    let query = supabase.from('room').select('*, room_class(*), room_status(*), floor(*)', { count: 'exact' })

    // Apply search filter if provided
    if (search) {
      query = query.ilike('room_number', `%${search}%`)
    }

    const {
      data: items,
      error,
      count,
    } = await query.range(offset, offset + limit - 1).order('room_number', { ascending: true })

    if (error) {
      return createErrorResponse({
        code: 400,
        message: error.message,
        errors: [error.message],
      })
    }

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
    console.error('Get rooms error:', error)
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
    if (!newRoom.room_number || !newRoom.room_class_id || !newRoom.room_status_id || !newRoom.floor_id) {
      return createErrorResponse({
        code: 400,
        message: 'Missing required fields',
        errors: ['room_number, room_class_id, room_status_id and floor_id are required'],
      })
    }

    // Check if room number already exists
    const { data: existingRoom } = await supabase
      .from('room')
      .select('id')
      .ilike('room_number', newRoom.room_number)
      .single()

    if (existingRoom) {
      return createErrorResponse({
        code: 400,
        message: 'Room number already exists',
        errors: ['Room number must be unique'],
      })
    }

    const { data, error } = await supabase
      .from('room')
      .insert([newRoom])
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
      data,
    })
  } catch (error) {
    console.error('Create room error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}
