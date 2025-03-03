import { ADDON_NAME_MAX_LENGTH, AddonListItem, CreateAddonBody } from './types'

import { createClient } from '@/providers/supabase/server'
import { createApiResponse, createErrorResponse, PaginatedDataResponse } from '@/services/apiResponse'

export async function GET(request: Request): Promise<Response> {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') ?? '1', 10)
    const limit = parseInt(searchParams.get('limit') ?? '10', 10)
    const offset = (page - 1) * limit
    const searchName = searchParams.get('search[name]')
    const searchPrice = searchParams.get('search[price]')

    let query = supabase.from('addon').select('*', { count: 'exact' })

    if (searchName) {
      query = query.ilike('name', `%${searchName}%`)
    }
    if (searchPrice) {
      let minPrice: number = 0
      let maxPrice: number = 0

      const cleanPriceFormat = searchPrice.trim()

      if (cleanPriceFormat.includes('-')) {
        const parts = cleanPriceFormat.split('-').map((part) => part.trim())
        if (parts.length === 2) {
          minPrice = parseFloat(parts[0]) || 0
          maxPrice = parseFloat(parts[1]) || Infinity
        }
      } else {
        minPrice = parseFloat(cleanPriceFormat) || 0
        maxPrice = minPrice
      }

      if (minPrice > maxPrice) {
        ;[minPrice, maxPrice] = [maxPrice, minPrice]
      }

      query = query.gte('price', minPrice).lte('price', maxPrice)
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

    const response: PaginatedDataResponse<AddonListItem> = {
      items,
      meta: {
        page,
        limit,
        total: count ?? 0,
        total_pages: Math.ceil((count ?? 0) / limit),
      },
    }

    return createApiResponse<PaginatedDataResponse<AddonListItem>>({
      code: 200,
      message: 'Addon list retrieved successfully',
      data: response,
    })
  } catch (error) {
    console.error('Get addons error:', error)
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
    const newAddon: CreateAddonBody = await request.json()

    // Validate required fields
    if (!newAddon.name && typeof newAddon.price !== 'number' && !newAddon.image_url) {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: ['All fields are required'],
      })
    }

    // Validate addon name
    if (!newAddon.name) {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: ['Addon name is required'],
      })
    }

    // Validate addon name length
    if (newAddon.name.length > ADDON_NAME_MAX_LENGTH) {
      return createErrorResponse({
        code: 400,
        message: 'Invalid addon name',
        errors: [`Addon name must not exceed ${ADDON_NAME_MAX_LENGTH} characters`],
      })
    }

    // Validate addon price
    if (typeof newAddon.price !== 'number') {
      return createErrorResponse({
        code: 400,
        message: 'Invalid addon price',
        errors: ['Addon price must be a number'],
      })
    }

    // Validate addon image url
    if (!newAddon.image_url) {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: ['Addon image url is required'],
      })
    }

    // Check if addon name already exists
    const { data: existingAddon } = await supabase.from('addon').select('id').ilike('name', newAddon.name).single()

    if (existingAddon) {
      return createErrorResponse({
        code: 400,
        message: 'Addon name already exists',
        errors: ['Addon name must be unique'],
      })
    }

    const { data, error } = await supabase.from('addon').insert([newAddon]).select().single()

    if (error) {
      return createErrorResponse({
        code: 400,
        message: error.message,
        errors: [error.message],
      })
    }

    return createApiResponse({
      code: 201,
      message: 'Addon created successfully',
      data,
    })
  } catch (error) {
    console.error('Create addon error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}
