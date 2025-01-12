import { createClient } from '@/providers/supabase/server'
import { createApiResponse, createErrorResponse, PaginatedDataResponse } from '@/services/apiResponse'
import type { CreateGuestBody, GuestListItem } from '@/types/guest'

export async function GET(request: Request): Promise<Response> {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    // Pagination params
    const page = Number(searchParams.get('page')) || 1
    const limit = Number(searchParams.get('limit')) || 10
    const offset = (page - 1) * limit

    // Search params
    const search = searchParams.get('search')?.toLowerCase() ?? ''
    const searchBy = searchParams.get('searchBy') ?? 'name' // name, email, phone

    // Build query
    let query = supabase.from('guest').select('*', { count: 'exact' })

    // Apply search filters
    if (search) {
      switch (searchBy) {
        case 'name':
          query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%`)
          break
        case 'email':
          query = query.ilike('email_address', `%${search}%`)
          break
        case 'phone':
          query = query.ilike('phone_number', `%${search}%`)
          break
        default:
          // Default to searching all fields
          query = query.or(
            `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email_address.ilike.%${search}%,phone_number.ilike.%${search}%`
          )
      }
    }

    // Get total count for pagination
    const { count, error: countError } = await query

    if (countError || count === null) {
      return createErrorResponse({
        code: 500,
        message: 'Failed to get total count',
        errors: [countError?.message ?? 'Database error while counting guests'],
      })
    }

    // Get guests with pagination
    const { data: guests, error } = await query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    if (error) {
      return createErrorResponse({
        code: 400,
        message: error.message,
        errors: [error.message],
      })
    }

    const response: PaginatedDataResponse<GuestListItem> = {
      items: guests,
      meta: {
        page,
        limit,
        total: count,
        total_pages: Math.ceil(count / limit),
      },
    }

    return createApiResponse<PaginatedDataResponse<GuestListItem>>({
      code: 200,
      message: 'Guest list retrieved successfully',
      data: response,
    })
  } catch (error) {
    console.error('Get guests error:', error)
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
    const body: CreateGuestBody = await request.json()

    // Validate required fields
    const validationErrors: string[] = []
    if (!body.first_name) validationErrors.push('First name is required')
    if (!body.last_name) validationErrors.push('Last name is required')
    if (!body.email_address) validationErrors.push('Email address is required')
    if (!body.phone_number) validationErrors.push('Phone number is required')

    if (validationErrors.length > 0) {
      return createErrorResponse({
        code: 400,
        message: 'Missing required fields',
        errors: validationErrors,
      })
    }

    // Check if email already exists
    const { data: existingGuest } = await supabase
      .from('guest')
      .select('id')
      .eq('email_address', body.email_address)
      .single()

    if (existingGuest) {
      return createErrorResponse({
        code: 400,
        message: 'Email address already exists',
        errors: ['Email address must be unique'],
      })
    }

    // Create guest
    const { data: newGuest, error } = await supabase
      .from('guest')
      .insert({
        first_name: body.first_name,
        last_name: body.last_name,
        email_address: body.email_address,
        phone_number: body.phone_number,
      })
      .select()
      .single()

    if (error) {
      return createErrorResponse({
        code: 400,
        message: error.message,
        errors: [error.message],
      })
    }

    return createApiResponse<GuestListItem>({
      code: 201,
      message: 'Guest created successfully',
      data: newGuest,
    })
  } catch (error) {
    console.error('Create guest error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}
