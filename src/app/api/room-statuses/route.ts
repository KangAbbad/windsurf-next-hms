import { createClient } from '@/providers/supabase/server'
import { createApiResponse, createErrorResponse, PaginatedDataResponse } from '@/services/apiResponse'
import type { CreateRoomStatusBody, RoomStatusListItem } from '@/types/room-status'

export async function GET(request: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') ?? '1', 10)
    const limit = parseInt(searchParams.get('limit') ?? '10', 10)
    const search = searchParams.get('search') ?? ''

    const offset = (page - 1) * limit

    const supabase = await createClient()

    let query = supabase.from('room_status').select('*', { count: 'exact' })

    // Apply search filter if provided
    if (search) {
      query = query.ilike('status_name', `%${search}%`)
    }

    const {
      data: items,
      error,
      count,
    } = await query.range(offset, offset + limit - 1).order('status_number', { ascending: true })

    if (error) {
      return createErrorResponse({
        code: 400,
        message: error.message,
        errors: [error.message],
      })
    }

    const response: PaginatedDataResponse<RoomStatusListItem> = {
      items,
      meta: {
        page,
        limit,
        total: count ?? 0,
        total_pages: Math.ceil((count ?? 0) / limit),
      },
    }

    return createApiResponse<PaginatedDataResponse<RoomStatusListItem>>({
      code: 200,
      message: 'Room status list retrieved successfully',
      data: response,
    })
  } catch (error) {
    console.error('Get room status list error:', error)
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
    const body: CreateRoomStatusBody = await request.json()

    // Validate required fields
    const validationErrors: string[] = []
    if (!body.status_name) validationErrors.push('status_name is required')
    if (typeof body.status_number !== 'number') validationErrors.push('status_number must be a number')

    if (validationErrors.length > 0) {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: validationErrors,
      })
    }

    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from('room_status')
      .insert({
        status_name: body.status_name,
        status_number: body.status_number,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single()

    if (error) {
      return createErrorResponse({
        code: 400,
        message: error.message,
        errors: [error.message],
      })
    }

    return createApiResponse<RoomStatusListItem>({
      code: 201,
      message: 'Room status created successfully',
      data,
    })
  } catch (error) {
    console.error('Create room status error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}
