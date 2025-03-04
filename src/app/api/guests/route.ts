import type { CreateGuestBody, GuestListItem } from './types'

import { createClient } from '@/providers/supabase/server'
import { createApiResponse, createErrorResponse, PaginatedDataResponse } from '@/services/apiResponse'

export async function GET(request: Request): Promise<Response> {
  const startHrtime = process.hrtime()

  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const page = Number(searchParams.get('page')) || 1
    const limit = Number(searchParams.get('limit')) || 10
    const search = searchParams.get('search')?.toLowerCase() ?? ''
    const offset = (page - 1) * limit

    let query = supabase.from('guest').select('*', { count: 'exact' })

    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    const {
      data: items,
      error,
      count,
    } = await query.range(offset, offset + limit - 1).order('created_at', { ascending: false })

    if (error) {
      return createErrorResponse({
        code: 400,
        message: error.message,
        errors: [error.message],
      })
    }

    const response: PaginatedDataResponse<GuestListItem> = {
      items,
      meta: {
        page,
        limit,
        total: count ?? 0,
        total_pages: Math.ceil((count ?? 0) / limit),
      },
    }

    return createApiResponse<PaginatedDataResponse<GuestListItem>>({
      code: 200,
      message: 'Guest list retrieved successfully',
      start_hrtime: startHrtime,
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
    const newGuest: CreateGuestBody = await request.json()

    if (
      !newGuest.nationality &&
      !newGuest.id_card_type &&
      !newGuest.id_card_number &&
      !newGuest.name &&
      !newGuest.phone
    ) {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: ['All fields are required'],
      })
    }

    // Validate guest nationality
    if (!newGuest.nationality) {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: ['Guest nationality is required'],
      })
    }

    // Validate ID card type
    if (!newGuest.id_card_type) {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: ['ID card type is required'],
      })
    }

    // Validate ID card number
    if (!newGuest.id_card_number) {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: ['ID card number is required'],
      })
    }

    // Validate guest name
    if (!newGuest.name) {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: ['Guest name is required'],
      })
    }

    // Validate phone number
    if (!newGuest.phone) {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: ['Phone number is required'],
      })
    }

    // Check if ID card number already exists
    const { data: existingIdCardNumber } = await supabase
      .from('guest')
      .select('id')
      .eq('id_card_number', newGuest.id_card_number)
      .single()

    if (existingIdCardNumber) {
      return createErrorResponse({
        code: 400,
        message: 'ID card number already exists',
        errors: ['ID card number must be unique'],
      })
    }

    // Check if email already exists
    if (newGuest.email) {
      const { data: existingEmail } = await supabase.from('guest').select('id').ilike('email', newGuest.email).single()

      if (existingEmail) {
        return createErrorResponse({
          code: 400,
          message: 'Guest email already exists',
          errors: ['Guest email must be unique'],
        })
      }
    }

    const { data, error } = await supabase.from('guest').insert([newGuest]).select().single()

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
      data,
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
