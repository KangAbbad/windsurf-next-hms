import { createClient } from '@/providers/supabase/server'
import { createApiResponse, createErrorResponse } from '@/services/apiResponse'

export async function GET(request: Request) {
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

    let query = supabase.from('bed_type').select('*', { count: 'exact' })

    // Apply search filter if provided
    if (search) {
      query = query.ilike('bed_type_name', `%${search}%`)
    }

    const {
      data: bedTypes,
      error,
      count,
    } = await query.range(offset, offset + limit - 1).order('bed_type_name', { ascending: true })

    if (error) {
      return createErrorResponse({
        code: 400,
        message: error.message,
        errors: [error.message],
      })
    }

    return createApiResponse({
      code: 200,
      message: 'Bed type list retrieved successfully',
      data: {
        bed_types: bedTypes,
        pagination: {
          total: count,
          page,
          limit,
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          total_pages: Math.ceil((count || 0) / limit),
        },
      },
    })
  } catch (error) {
    console.error('Get bed types error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const newBedType = await request.json()

    // Validate required fields
    if (!newBedType.bed_type_name) {
      return createErrorResponse({
        code: 400,
        message: 'Missing required fields',
        errors: ['bed_type_name is required'],
      })
    }

    // Check if bed type name already exists
    const { data: existingBedType } = await supabase
      .from('bed_type')
      .select('id')
      .ilike('bed_type_name', newBedType.bed_type_name)
      .single()

    if (existingBedType) {
      return createErrorResponse({
        code: 400,
        message: 'Bed type name already exists',
        errors: ['Bed type name must be unique'],
      })
    }

    const { data, error } = await supabase.from('bed_type').insert([newBedType]).select().single()

    if (error) {
      return createErrorResponse({
        code: 400,
        message: error.message,
        errors: [error.message],
      })
    }

    return createApiResponse({
      code: 201,
      message: 'Bed type created successfully',
      data,
    })
  } catch (error) {
    console.error('Create bed type error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}
