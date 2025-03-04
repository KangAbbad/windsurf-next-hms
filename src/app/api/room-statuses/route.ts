import type { CreateRoomStatusBody, RoomStatusListItem } from './types'

import { createClient } from '@/providers/supabase/server'
import { createApiResponse, createErrorResponse, PaginatedDataResponse } from '@/services/apiResponse'
import { parseSearchParamsToNumber } from '@/utils/parseSearchParamsToNumber'

export async function GET(request: Request): Promise<Response> {
  const startHrtime = process.hrtime()

  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const page = parseSearchParamsToNumber(searchParams.get('page'), 1) ?? 1
    const limit = parseSearchParamsToNumber(searchParams.get('limit'), 10) ?? 10
    const offset = (page - 1) * limit

    const query = supabase.from('room_status').select('*', { count: 'exact' })

    const {
      data: items,
      error,
      count,
    } = await query.range(offset, offset + limit - 1).order('number', { ascending: true })

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
      start_hrtime: startHrtime,
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
  const startHrtime = process.hrtime()

  try {
    const supabase = await createClient()
    const newRoomStatus: CreateRoomStatusBody = await request.json()

    // Validate required fields
    if (!newRoomStatus.name && typeof newRoomStatus.number !== 'number' && !newRoomStatus.color) {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: ['All fields are required'],
      })
    }

    // Validate name
    if (!newRoomStatus.name || typeof newRoomStatus.name !== 'string' || newRoomStatus.name.trim() === '') {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: ['Room status name is required'],
      })
    }

    // Validate number
    if (typeof newRoomStatus.number !== 'number') {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: ['Room status number is required'],
      })
    }

    // Validate color
    if (!newRoomStatus.color) {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: ['Room status color is required'],
      })
    }

    // Check if room status name already exists
    const { data: existingName } = await supabase
      .from('room_status')
      .select('id')
      .ilike('name', newRoomStatus.name)
      .single()

    if (existingName) {
      return createErrorResponse({
        code: 400,
        message: 'Room status name already exists',
        errors: ['Room status name must be unique'],
      })
    }

    // Check if room status number already exists
    const { data: existingNumber } = await supabase
      .from('room_status')
      .select('id')
      .eq('number', newRoomStatus.number)
      .single()

    if (existingNumber) {
      return createErrorResponse({
        code: 400,
        message: 'Room status number already exists',
        errors: ['Room status number must be unique'],
      })
    }

    // Check if payment status color already exists
    const { data: existingColor } = await supabase
      .from('room_status')
      .select('id')
      .eq('color', newRoomStatus.color)
      .single()

    if (existingColor) {
      return createErrorResponse({
        code: 400,
        message: 'Room status color already exists',
        errors: ['Room status color must be unique'],
      })
    }

    const { data, error } = await supabase.from('room_status').insert([newRoomStatus]).select().single()

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
      start_hrtime: startHrtime,
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
