import { createClient } from '@/providers/supabase/server'
import { createApiResponse, createErrorResponse, PaginatedDataResponse } from '@/services/apiResponse'
import { FEATURE_NAME_MAX_LENGTH, type CreateFeatureBody, type FeatureListItem } from '@/types/feature'

export async function GET(request: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') ?? '1', 10)
    const limit = parseInt(searchParams.get('limit') ?? '10', 10)
    const search = searchParams.get('search') ?? ''

    const offset = (page - 1) * limit

    const supabase = await createClient()

    let query = supabase.from('feature').select('*', { count: 'exact' })

    // Apply search filter if provided
    if (search) {
      query = query.ilike('feature_name', `%${search}%`)
    }

    const {
      data: items,
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
    const featureName = newFeature.feature_name?.trim()

    // Validate required fields
    if (!featureName) {
      return createErrorResponse({
        code: 400,
        message: 'Missing required fields',
        errors: ['feature_name is required'],
      })
    }

    // Validate feature name length
    if (featureName.length > FEATURE_NAME_MAX_LENGTH) {
      return createErrorResponse({
        code: 400,
        message: 'Invalid feature name',
        errors: [`feature_name must not exceed ${FEATURE_NAME_MAX_LENGTH} characters`],
      })
    }

    // Check if feature name already exists
    const { data: existingFeature } = await supabase
      .from('feature')
      .select('id')
      .ilike('feature_name', featureName)
      .single()

    if (existingFeature) {
      return createErrorResponse({
        code: 409,
        message: 'Feature name already exists',
        errors: ['Feature name must be unique'],
      })
    }

    const { data, error } = await supabase
      .from('feature')
      .insert([{ feature_name: featureName }])
      .select()
      .single()

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
