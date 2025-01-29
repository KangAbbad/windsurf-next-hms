import { createClient } from '@/providers/supabase/server'
import { createApiResponse, createErrorResponse, PaginatedDataResponse } from '@/services/apiResponse'
import { BED_TYPE_NAME_MAX_LENGTH, BedTypeListItem, type CreateBedTypeBody } from '@/types/bed-type'

export async function GET(request: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') ?? '1', 10)
    const limit = parseInt(searchParams.get('limit') ?? '10', 10)
    const search = searchParams.get('search') ?? ''

    const offset = (page - 1) * limit

    const supabase = await createClient()

    let query = supabase.from('bed_type').select('*', { count: 'exact' })

    // Apply search filter if provided
    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    const {
      data: items,
      error,
      count,
    } = await query.range(offset, offset + limit - 1).order('name', { ascending: true })

    if (error) {
      return createErrorResponse({
        code: 400,
        message: error.message,
        errors: [error.message],
      })
    }

    const response: PaginatedDataResponse<BedTypeListItem> = {
      items,
      meta: {
        page,
        limit,
        total: count ?? 0,
        total_pages: Math.ceil((count ?? 0) / limit),
      },
    }

    return createApiResponse<PaginatedDataResponse<BedTypeListItem>>({
      code: 200,
      message: 'Bed types retrieved successfully',
      data: response,
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

export async function POST(request: Request): Promise<Response> {
  try {
    const supabase = await createClient()
    const newBedType: CreateBedTypeBody = await request.json()
    const bedTypeName = newBedType.name?.trim()

    // Validate required fields
    if (!bedTypeName) {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: ['name is required'],
      })
    }

    // Validate bed type name length
    if (bedTypeName.length > BED_TYPE_NAME_MAX_LENGTH) {
      return createErrorResponse({
        code: 400,
        message: 'Invalid bed type name',
        errors: [`name must not exceed ${BED_TYPE_NAME_MAX_LENGTH} characters`],
      })
    }

    // Check if bed type name already exists
    const { data: existingBedType } = await supabase.from('bed_type').select('id').ilike('name', bedTypeName).single()

    if (existingBedType) {
      return createErrorResponse({
        code: 409,
        message: 'Bed type name already exists',
        errors: ['Bed type name must be unique'],
      })
    }

    // Create bed type
    const { data, error } = await supabase
      .from('bed_type')
      .insert([{ name: bedTypeName }])
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
