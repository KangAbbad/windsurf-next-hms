import { FEATURE_NAME_MAX_LENGTH, type CreateFeatureBody, type FeatureListItem } from './types'

import { createClient } from '@/providers/supabase/server'
import { createApiResponse, createErrorResponse, PaginatedDataResponse } from '@/services/apiResponse'

export async function GET(request: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') ?? '1', 10)
    const limit = parseInt(searchParams.get('limit') ?? '10', 10)
    const search = searchParams.get('search') ?? ''
    const minPrice = parseFloat(searchParams.get('min_price') ?? '0')
    const maxPrice = parseFloat(searchParams.get('max_price') ?? '0')

    const offset = (page - 1) * limit

    const supabase = await createClient()

    let query = supabase.from('feature').select('*', { count: 'exact' })

    // Apply search filter if provided
    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    // Apply price range filter if provided
    if (maxPrice > 0) {
      query = query.lte('price', maxPrice)
    }
    if (minPrice > 0) {
      query = query.gte('price', minPrice)
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

    const response: PaginatedDataResponse<FeatureListItem> = {
      items,
      meta: {
        page,
        limit,
        total: count ?? 0,
        total_pages: Math.ceil((count ?? 0) / limit),
      },
    }

    return createApiResponse<PaginatedDataResponse<FeatureListItem>>({
      code: 200,
      message: 'Feature list retrieved successfully',
      data: response,
    })
  } catch (error) {
    console.error('Get features error:', error)
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
    const newFeature: CreateFeatureBody = await request.json()

    // Validate required fields
    if (!newFeature.name && !newFeature.image_url && typeof newFeature.price !== 'number') {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: ['All fields are required'],
      })
    }

    // Validate feature name
    if (!newFeature.name) {
      return createErrorResponse({
        code: 400,
        message: 'Invalid feature name',
        errors: ['Feature name is required'],
      })
    }

    // Validate feature name length
    if (newFeature.name.length > FEATURE_NAME_MAX_LENGTH) {
      return createErrorResponse({
        code: 400,
        message: 'Invalid feature name',
        errors: [`name must not exceed ${FEATURE_NAME_MAX_LENGTH} characters`],
      })
    }

    // Validate image URL
    if (!newFeature.image_url) {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: ['Image URL is required'],
      })
    }

    // Validate price
    if (typeof newFeature.price !== 'number') {
      return createErrorResponse({
        code: 400,
        message: 'Invalid feature price',
        errors: ['Price must be a number'],
      })
    }

    // Check if feature name already exists
    const { data: existingFeature } = await supabase
      .from('feature')
      .select('id')
      .ilike('name', newFeature.name)
      .single()

    if (existingFeature) {
      return createErrorResponse({
        code: 409,
        message: 'Feature name already exists',
        errors: ['Feature name must be unique'],
      })
    }

    const { data, error } = await supabase.from('feature').insert([newFeature]).select().single()

    if (error) {
      return createErrorResponse({
        code: 400,
        message: error.message,
        errors: [error.message],
      })
    }

    return createApiResponse<FeatureListItem>({
      code: 201,
      message: 'Feature created successfully',
      data,
    })
  } catch (error) {
    console.error('Create feature error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}
