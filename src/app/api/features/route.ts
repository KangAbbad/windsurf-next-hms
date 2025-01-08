import { createClient } from '@/providers/supabase/server'
import { createApiResponse, createErrorResponse } from '@/services/apiResponse'
import type { CreateFeatureInput, Feature, FeatureResponse } from '@/types/feature'

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

    let query = supabase.from('feature').select('*', { count: 'exact' })

    // Apply search filter if provided
    if (search) {
      query = query.ilike('feature_name', `%${search}%`)
    }

    const {
      data: features,
      error,
      count,
    } = await query.range(offset, offset + limit - 1).order('feature_name', { ascending: true })

    if (error) {
      return createErrorResponse({
        code: 400,
        message: error.message,
        errors: [error.message],
      })
    }

    const response: FeatureResponse = {
      features: features as Feature[],
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
    const newFeature: CreateFeatureInput = await request.json()

    // Validate required fields
    if (!newFeature.feature_name) {
      return createErrorResponse({
        code: 400,
        message: 'Missing required fields',
        errors: ['feature_name is required'],
      })
    }

    // Check if feature name already exists
    const { data: existingFeature } = await supabase
      .from('feature')
      .select('id')
      .ilike('feature_name', newFeature.feature_name)
      .single()

    if (existingFeature) {
      return createErrorResponse({
        code: 400,
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

    return createApiResponse({
      code: 201,
      message: 'Feature created successfully',
      data: data as Feature,
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
