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

    let query = supabase.from('room').select(
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
