import { createClient } from '@/providers/supabase/server'
import { createApiResponse, createErrorResponse } from '@/services/apiResponse'
import type { CreateFloorInput, Floor, FloorResponse } from '@/types/floor'

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
      query = query.ilike('floor_number', `%${search}%`)
    }

    const {
      data: floors,
      error,
      count,
    } = await query.range(offset, offset + limit - 1).order('floor_number', { ascending: true })

    if (error) {
      return createErrorResponse({
        code: 400,
        message: error.message,
        errors: [error.message],
      })
    }

    const response: FloorResponse = {
      floors: floors as Floor[],
      pagination: {
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        total: count || 0,
        page,
        limit,
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        total_pages: Math.ceil((count || 0) / limit),
      },
    }

    return createApiResponse({
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
    const newFloor: CreateFloorInput = await request.json()

    // Validate required fields
    if (typeof newFloor.floor_number !== 'number') {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: ['floor_number must be a number'],
      })
    }

    // Check if floor number already exists
    const { data: existingFloor } = await supabase
      .from('floor')
      .select('id')
      .eq('floor_number', newFloor.floor_number)
      .single()

    if (existingFloor) {
      return createErrorResponse({
        code: 400,
        message: 'Floor number already exists',
        errors: ['Floor number must be unique'],
      })
    }

    // Create floor
    const { data, error } = await supabase.from('floor').insert([newFloor]).select().single()

    if (error) {
      return createErrorResponse({
        code: 400,
        message: error.message,
        errors: [error.message],
      })
    }

    return createApiResponse({
      code: 201,
      message: 'Floor created successfully',
      data: data as Floor,
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
