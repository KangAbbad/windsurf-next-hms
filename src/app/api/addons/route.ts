import { createClient } from '@/providers/supabase/server'
import { createApiResponse, createErrorResponse, PaginatedDataResponse } from '@/services/apiResponse'
import type { AddonListItem, CreateAddonBody } from '@/types/addon'

export async function GET(request: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') ?? '1', 10)
    const limit = parseInt(searchParams.get('limit') ?? '10', 10)
    const search = searchParams.get('search') ?? ''

    const offset = (page - 1) * limit

    const supabase = await createClient()

    let query = supabase.from('addon').select('*', { count: 'exact' })

    // Apply search filter if provided
    if (search) {
      query = query.ilike('addon_name', `%${search}%`)
    }

    const {
      data: items,
      error,
      count,
    } = await query.range(offset, offset + limit - 1).order('addon_name', { ascending: true })

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
    if (!newAddon.addon_name || !newAddon.price) {
      return createErrorResponse({
        code: 400,
        message: 'Missing required fields',
        errors: ['addon_name and price are required'],
      })
    }

    // Validate price is a positive number
    if (typeof newAddon.price !== 'number' || newAddon.price <= 0) {
      return createErrorResponse({
        code: 400,
        message: 'Invalid price',
        errors: ['Price must be a positive number'],
      })
    }

    // Check if addon name already exists
    const { data: existingAddon } = await supabase
      .from('addon')
      .select('id')
      .ilike('addon_name', newAddon.addon_name)
      .single()

    if (existingAddon) {
      return createErrorResponse({
        code: 400,
        message: 'Addon name already exists',
        errors: ['Addon name must be unique'],
      })
    }

    const { data, error } = await supabase
      .from('addon')
      .insert([newAddon])
      .select(
        `
        id,
        addon_name,
        price,
        created_at,
        updated_at
        `
      )
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
