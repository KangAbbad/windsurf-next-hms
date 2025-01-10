import { createClient } from '@/providers/supabase/server'
import { createApiResponse, createErrorResponse, PaginatedDataResponse } from '@/services/apiResponse'
import type { CreateRoomStatusBody, RoomStatusListItem } from '@/types/room-status'

export async function GET(request: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url)
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    const page = parseInt(searchParams.get('page') || '1', 10)
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    const search = searchParams.get('search') || ''

    const offset = (page - 1) * limit

    const supabase = await createClient()

    let query = supabase.from('room_status').select(
      `
        id,
        status_name,
        description,
        is_available,
        color_code,
        created_at,
        updated_at
      `,
      { count: 'exact' }
    )

    // Apply search filter if provided
    if (search) {
      query = query.ilike('status_name', `%${search}%`)
    }

    const {
      data: roomStatuses,
      error,
      count,
    } = await query.range(offset, offset + limit - 1).order('status_name', { ascending: true })

    if (error) {
      return createErrorResponse({
        code: 400,
        message: error.message,
        errors: [error.message],
      })
    }

    const response: PaginatedDataResponse<any> = {
      items: roomStatuses ?? [],
      meta: {
        total: count ?? 0,
        page,
        limit,
        total_pages: count ? Math.ceil(count / limit) : 0,
      },
    }

    return createApiResponse({
      code: 200,
      message: 'Room status list retrieved successfully',
      data: response,
    })
  } catch (error) {
    console.error('Get room statuses error:', error)
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
    const newRoomStatus: CreateRoomStatusBody = await request.json()

    // Validate required fields
    const validationErrors: string[] = []
    if (!newRoomStatus.status_name) validationErrors.push('status_name is required')
    if (typeof newRoomStatus.is_available !== 'boolean') validationErrors.push('is_available must be a boolean')
    if (newRoomStatus.color_code && !/^#[0-9A-Fa-f]{6}$/.test(newRoomStatus.color_code)) {
      validationErrors.push('color_code must be a valid hex color code (e.g., #FF0000)')
    }

    if (validationErrors.length > 0) {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: validationErrors,
      })
    }

    // Check if status name already exists
    const { data: existingStatus, error: checkError } = await supabase
      .from('room_status')
      .select('id')
      .ilike('status_name', newRoomStatus.status_name)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      return createErrorResponse({
        code: 400,
        message: checkError.message,
        errors: [checkError.message],
      })
    }

    if (existingStatus) {
      return createErrorResponse({
        code: 400,
        message: 'Room status name already exists',
        errors: ['Room status name must be unique'],
      })
    }

    // Create room status
    const { data: created, error: createError } = await supabase
      .from('room_status')
      .insert([newRoomStatus])
      .select()
      .single()

    if (createError) {
      return createErrorResponse({
        code: 400,
        message: createError.message,
        errors: [createError.message],
      })
    }

    return createApiResponse({
      code: 201,
      message: 'Room status created successfully',
      data: created as RoomStatusListItem,
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
