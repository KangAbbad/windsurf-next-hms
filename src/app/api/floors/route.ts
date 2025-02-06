import type { CreateFloorBody, FloorListItem } from './types'

import { createClient } from '@/providers/supabase/server'
import { createApiResponse, createErrorResponse, PaginatedDataResponse } from '@/services/apiResponse'

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

    let query = supabase.from('floor').select('*', { count: 'exact' })

    // Apply search filter if provided
    if (search) {
      query = query.ilike('number', `%${search}%`)
    }

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

    const response: PaginatedDataResponse<FloorListItem> = {
      items,
      meta: {
        page,
        limit,
        total: count ?? 0,
        total_pages: Math.ceil((count ?? 0) / limit),
      },
    }

    return createApiResponse<PaginatedDataResponse<FloorListItem>>({
      code: 200,
      message: 'Floor list retrieved successfully',
      data: response,
    })
  } catch (error) {
    console.error('Get floors error:', error)
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
    const newFloor: CreateFloorBody = await request.json()

    // Validate required fields
    if (typeof newFloor.number !== 'number') {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: ['Floor number must be a number'],
      })
    }

    // Check if floor number already exists
    const { data: existingFloor } = await supabase.from('floor').select('id').eq('number', newFloor.number).single()

    if (existingFloor) {
      return createErrorResponse({
        code: 409,
        message: 'Floor number already exists',
        errors: ['Floor number must be unique'],
      })
    }

    const { data, error } = await supabase.from('floor').insert([newFloor]).select().single()

    if (error) {
      return createErrorResponse({
        code: 400,
        message: error.message,
        errors: [error.message],
      })
    }

    return createApiResponse<FloorListItem>({
      code: 201,
      message: 'Floor created successfully',
      data,
    })
  } catch (error) {
    console.error('Create floor error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}
