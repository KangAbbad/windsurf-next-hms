import { createApiResponse, createErrorResponse } from '@/lib/api-response'
import { createClient } from '@/providers/supabase/server'

// Get profile list
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

    let query = supabase.from('profiles').select('*', { count: 'exact' })

    if (search) {
      query = query.or(`username.ilike.%${search}%,full_name.ilike.%${search}%`)
    }

    const { data, error, count } = await query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    if (error) {
      return createErrorResponse({
        code: 400,
        message: error.message,
        errors: [error.message],
      })
    }

    return createApiResponse({
      code: 200,
      message: 'Profile list retrieved successfully',
      data: {
        profiles: data,
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
    console.error('Get profiles error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}
