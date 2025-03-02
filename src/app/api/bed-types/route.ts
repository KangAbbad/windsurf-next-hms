import { BED_TYPE_NAME_MAX_LENGTH, BedTypeListItem, type CreateBedTypeBody } from '@/app/api/bed-types/types'
import { createClient } from '@/providers/supabase/server'
import { createApiResponse, createErrorResponse, PaginatedDataResponse } from '@/services/apiResponse'

export async function GET(request: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') ?? '1', 10)
    const limit = parseInt(searchParams.get('limit') ?? '10', 10)
    const searchName = searchParams.get('search[name]')
    const searchMaterial = searchParams.get('search[material]')
    const searchDimension = searchParams.get('search[dimension]')

    const offset = (page - 1) * limit

    const supabase = await createClient()

    let query = supabase.from('bed_type').select('*', { count: 'exact' })

    if (searchName) {
      query = query.ilike('name', `%${searchName}%`)
    }
    if (searchMaterial) {
      query = query.ilike('material', `%${searchMaterial}%`)
    }
    if (searchDimension) {
      const parts = searchDimension
        .replace(/[^\d\sx]/g, '') // Remove non-numeric and non-'x' characters
        .split('x')
        .map((part) => parseFloat(part.trim()))
        .filter((num) => !isNaN(num))

      const length = parts[0] || null // Length (first number)
      const width = parts[1] || null // Width (second number)
      const height = parts[2] || null // Height (third number)

      // Apply filters only for non-null values, searching across all dimensions if it's a single number
      if (length !== null) {
        query = query.or(`length.eq.${length},width.eq.${length},height.eq.${length}`)
      }
      // Avoid redundant checks if width matches length from single number
      if (width !== null && width !== length) {
        query = query.or(`length.eq.${width},width.eq.${width},height.eq.${width}`)
      }
      // Avoid redundant checks
      if (height !== null && height !== length && height !== width) {
        query = query.or(`length.eq.${height},width.eq.${height},height.eq.${height}`)
      }
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

    // Validate required fields
    if (
      !newBedType.name &&
      !newBedType.image_url &&
      !newBedType.length &&
      !newBedType.width &&
      !newBedType.height &&
      !newBedType.material
    ) {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: ['All fields are required'],
      })
    }

    // Validate bed type name
    if (!newBedType.name) {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: ['Bed type name is required'],
      })
    }

    // Validate bed type name length
    if (newBedType.name.length > BED_TYPE_NAME_MAX_LENGTH) {
      return createErrorResponse({
        code: 400,
        message: 'Invalid bed type name',
        errors: [`Bed type name must not exceed ${BED_TYPE_NAME_MAX_LENGTH} characters`],
      })
    }

    // Validate image URL
    if (!newBedType.image_url) {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: ['Bed type image url is required'],
      })
    }

    // Validate length
    if (typeof newBedType.length !== 'number') {
      return createErrorResponse({
        code: 400,
        message: 'Invalid bed type length',
        errors: ['Bed type length must be a number'],
      })
    }

    // Validate width
    if (typeof newBedType.width !== 'number') {
      return createErrorResponse({
        code: 400,
        message: 'Invalid bed type width',
        errors: ['Bed type width must be a number'],
      })
    }

    // Validate height
    if (typeof newBedType.height !== 'number') {
      return createErrorResponse({
        code: 400,
        message: 'Invalid bed type height',
        errors: ['Bed type height must be a number'],
      })
    }

    // Validate material
    if (!newBedType.material) {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: ['Bed type material is required'],
      })
    }

    // Check if bed type name already exists
    const { data: existingBedType } = await supabase
      .from('bed_type')
      .select('id')
      .ilike('name', newBedType.name)
      .single()

    if (existingBedType) {
      return createErrorResponse({
        code: 409,
        message: 'Bed type name already exists',
        errors: ['Bed type name must be unique'],
      })
    }

    // Create bed type
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
