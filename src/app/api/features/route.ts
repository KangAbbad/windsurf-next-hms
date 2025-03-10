import { FEATURE_NAME_MAX_LENGTH, type CreateFeatureBody, type FeatureListItem } from './types'

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
    const searchName = searchParams.get('search[name]')
    const searchPrice = searchParams.get('search[price]')

    let query = supabase.from('feature').select('*', { count: 'exact' })

    if (searchName) {
      query = query.ilike('name', `%${searchName}%`)
    }
    if (searchPrice) {
      let minPrice: number = 0
      let maxPrice: number | null = null

      const cleanPriceFormat = searchPrice.trim()

      if (cleanPriceFormat.includes('-')) {
        const parts = cleanPriceFormat.split('-').map((part) => part.trim())
        if (parts.length === 2) {
          minPrice = parseFloat(parts[0]) || 0
          maxPrice = parseFloat(parts[1]) || null
        }
      } else {
        minPrice = parseFloat(cleanPriceFormat) || 0
      }

      if (maxPrice !== null && minPrice > maxPrice) {
        ;[minPrice, maxPrice] = [maxPrice, minPrice]
      }

      query = query.gte('price', minPrice)
      if (maxPrice !== null) query = query.lte('price', maxPrice)
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
      start_hrtime: startHrtime,
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
  const startHrtime = process.hrtime()

  try {
    const supabase = await createClient()
    const newFeature: CreateFeatureBody = await request.json()

    // Validate required fields
    if (!newFeature.name && typeof newFeature.price !== 'number' && !newFeature.image_url) {
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
        message: 'Missing or invalid required fields',
        errors: ['Feature name is required'],
      })
    }

    // Validate feature name length
    if (newFeature.name.length > FEATURE_NAME_MAX_LENGTH) {
      return createErrorResponse({
        code: 400,
        message: 'Invalid feature name',
        errors: [`Feature name must not exceed ${FEATURE_NAME_MAX_LENGTH} characters`],
      })
    }

    // Validate feature price
    if (typeof newFeature.price !== 'number') {
      return createErrorResponse({
        code: 400,
        message: 'Invalid feature price',
        errors: ['Feature price must be a number'],
      })
    }

    // Validate feature image url
    if (!newFeature.image_url) {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: ['Feature image url is required'],
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
      start_hrtime: startHrtime,
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
