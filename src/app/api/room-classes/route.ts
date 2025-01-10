import { createClient } from '@/providers/supabase/server'
import { createApiResponse, createErrorResponse, PaginatedDataResponse } from '@/services/apiResponse'
import type { CreateRoomClassBody, RoomClassListItem } from '@/types/room-class'

export async function GET(request: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') ?? '1', 10)
    const limit = parseInt(searchParams.get('limit') ?? '10', 10)
    const search = searchParams.get('search') ?? ''

    const offset = (page - 1) * limit

    const supabase = await createClient()

    let query = supabase.from('room_class').select(
      `
      id,
      class_name,
      base_price,
      created_at,
      updated_at
    `,
      { count: 'exact' }
    )

    // Apply search filter if provided
    if (search) {
      query = query.ilike('class_name', `%${search}%`)
    }

    const {
      data: items,
      error,
      count,
    } = await query.range(offset, offset + limit - 1).order('class_name', { ascending: true })

    if (error) {
      return createErrorResponse({
        code: 400,
        message: error.message,
        errors: [error.message],
      })
    }

    const response: PaginatedDataResponse<RoomClassListItem> = {
      items: items ?? [],
      meta: {
        page,
        limit,
        total: count ?? 0,
        total_pages: count ? Math.ceil(count / limit) : 1,
      },
    }

    return createApiResponse({
      code: 200,
      message: 'Room class list retrieved successfully',
      data: response,
    })
  } catch (error) {
    console.error('Get room classes error:', error)
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
    const newRoomClass: CreateRoomClassBody = await request.json()

    // Validate required fields
    if (!newRoomClass.class_name || !newRoomClass.base_price) {
      return createErrorResponse({
        code: 400,
        message: 'Missing required fields',
        errors: ['class_name and base_price are required'],
      })
    }

    // Validate base_price is a positive number
    if (typeof newRoomClass.base_price !== 'number' || newRoomClass.base_price <= 0) {
      return createErrorResponse({
        code: 400,
        message: 'Invalid base price',
        errors: ['Base price must be a positive number'],
      })
    }

    // Check if room class name already exists
    const { data: existingRoomClass } = await supabase
      .from('room_class')
      .select('id')
      .ilike('class_name', newRoomClass.class_name)
      .single()

    if (existingRoomClass) {
      return createErrorResponse({
        code: 400,
        message: 'Room class name already exists',
        errors: ['Room class name must be unique'],
      })
    }

    // Create new room class
    const { data: roomClass, error } = await supabase
      .from('room_class')
      .insert([
        {
          class_name: newRoomClass.class_name,
          base_price: newRoomClass.base_price,
        },
      ])
      .select()
      .single()

    if (error) {
      return createErrorResponse({
        code: 400,
        message: error.message,
        errors: [error.message],
      })
    }

    return createApiResponse({
      code: 201,
      message: 'Room class created successfully',
      data: roomClass,
    })
  } catch (error) {
    console.error('Create room class error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}
