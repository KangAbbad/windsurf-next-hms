import { createApiResponse, createErrorResponse } from '@/lib/api-response'
import { createClient } from '@/providers/supabase/server'
import type { CreateGuestInput, Guest, GuestResponse, UpdateGuestInput } from '@/types/guest'

// GET /api/guests - List all guests
export async function GET(request: Request): Promise<Response> {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    // Get query parameters
    const search = searchParams.get('search')
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    const page = parseInt(searchParams.get('page') || '1', 10)
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const offset = (page - 1) * limit

    // Build query
    let query = supabase.from('guest').select('*', { count: 'exact' })

    // Apply search filter if provided
    if (search) {
      const searchTerm = `%${search}%`
      query = query.or(
        `first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email_address.ilike.${searchTerm},phone_number.ilike.${searchTerm}`
      )
    }

    // Apply pagination and ordering
    query = query.range(offset, offset + limit - 1).order('first_name', { ascending: true })

    // Execute query
    const { data: guests, error, count } = await query

    if (error) {
      return createErrorResponse({
        code: 400,
        message: 'Error fetching guests',
        errors: [error.message],
      })
    }

    const response: GuestResponse = {
      guests: guests as Guest[],
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
      message: 'Guests retrieved successfully',
      data: response,
    })
  } catch (error) {
    console.error('List guests error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}

// POST /api/guests - Create new guest
export async function POST(request: Request): Promise<Response> {
  try {
    const supabase = await createClient()
    const newGuest: CreateGuestInput = await request.json()
    const { first_name, last_name, email_address, phone_number } = newGuest

    // Validate required fields
    const errors: string[] = []
    if (!first_name?.trim()) errors.push('First name is required')
    if (!last_name?.trim()) errors.push('Last name is required')
    if (!email_address?.trim()) errors.push('Email address is required')
    if (!phone_number?.trim()) errors.push('Phone number is required')

    if (errors.length > 0) {
      return createErrorResponse({
        code: 400,
        message: 'Missing required fields',
        errors,
      })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email_address)) {
      return createErrorResponse({
        code: 400,
        message: 'Invalid email format',
        errors: ['Please provide a valid email address'],
      })
    }

    // Validate phone number format (basic validation, adjust as needed)
    const phoneRegex = /^\+?[\d\s-]{10,}$/
    if (!phoneRegex.test(phone_number)) {
      return createErrorResponse({
        code: 400,
        message: 'Invalid phone number format',
        errors: ['Please provide a valid phone number'],
      })
    }

    // Check for duplicate email
    const { data: existingEmail, error: emailError } = await supabase
      .from('guest')
      .select('id')
      .ilike('email_address', email_address.trim())
      .single()

    if (emailError && emailError.code !== 'PGRST116') {
      return createErrorResponse({
        code: 400,
        message: 'Error checking email',
        errors: [emailError.message],
      })
    }

    if (existingEmail) {
      return createErrorResponse({
        code: 400,
        message: 'Email already registered',
        errors: ['A guest with this email address already exists'],
      })
    }

    // Create guest
    const { data: created, error: createError } = await supabase
      .from('guest')
      .insert({
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        email_address: email_address.trim().toLowerCase(),
        phone_number: phone_number.trim(),
      })
      .select()
      .single()

    if (createError) {
      return createErrorResponse({
        code: 400,
        message: 'Error creating guest',
        errors: [createError.message],
      })
    }

    return createApiResponse({
      code: 201,
      message: 'Guest created successfully',
      data: created as Guest,
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

// PUT /api/guests - Update guest
export async function PUT(request: Request): Promise<Response> {
  try {
    const supabase = await createClient()
    const updateGuest: UpdateGuestInput = await request.json()
    const { id, first_name, last_name, email_address, phone_number } = updateGuest

    // Validate required fields
    const errors: string[] = []
    if (!id) errors.push('Guest ID is required')
    if (!first_name?.trim()) errors.push('First name is required')
    if (!last_name?.trim()) errors.push('Last name is required')
    if (!email_address?.trim()) errors.push('Email address is required')
    if (!phone_number?.trim()) errors.push('Phone number is required')

    if (errors.length > 0) {
      return createErrorResponse({
        code: 400,
        message: 'Missing required fields',
        errors,
      })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email_address)) {
      return createErrorResponse({
        code: 400,
        message: 'Invalid email format',
        errors: ['Please provide a valid email address'],
      })
    }

    // Validate phone number format (basic validation, adjust as needed)
    const phoneRegex = /^\+?[\d\s-]{10,}$/
    if (!phoneRegex.test(phone_number)) {
      return createErrorResponse({
        code: 400,
        message: 'Invalid phone number format',
        errors: ['Please provide a valid phone number'],
      })
    }

    // Check if guest exists
    const { error: guestError } = await supabase.from('guest').select('id').eq('id', id).single()

    if (guestError) {
      return createErrorResponse({
        code: 404,
        message: 'Guest not found',
        errors: ['Invalid guest ID'],
      })
    }

    // Check for duplicate email (excluding current guest)
    const { data: existingEmail, error: emailError } = await supabase
      .from('guest')
      .select('id')
      .neq('id', id)
      .ilike('email_address', email_address.trim())
      .single()

    if (emailError && emailError.code !== 'PGRST116') {
      return createErrorResponse({
        code: 400,
        message: 'Error checking email',
        errors: [emailError.message],
      })
    }

    if (existingEmail) {
      return createErrorResponse({
        code: 400,
        message: 'Email already registered',
        errors: ['This email address is already used by another guest'],
      })
    }

    // Update guest
    const { data: updated, error: updateError } = await supabase
      .from('guest')
      .update({
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        email_address: email_address.trim().toLowerCase(),
        phone_number: phone_number.trim(),
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      return createErrorResponse({
        code: 400,
        message: 'Error updating guest',
        errors: [updateError.message],
      })
    }

    return createApiResponse({
      code: 200,
      message: 'Guest updated successfully',
      data: updated as Guest,
    })
  } catch (error) {
    console.error('Update guest error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}

// DELETE /api/guests - Delete guest
export async function DELETE(request: Request): Promise<Response> {
  try {
    const supabase = await createClient()
    const { id } = await request.json()

    if (!id) {
      return createErrorResponse({
        code: 400,
        message: 'Missing required fields',
        errors: ['Guest ID is required'],
      })
    }

    // Check if guest exists
    const { error: guestError } = await supabase.from('guest').select('id').eq('id', id).single()

    if (guestError) {
      return createErrorResponse({
        code: 404,
        message: 'Guest not found',
        errors: ['Invalid guest ID'],
      })
    }

    // Delete guest
    const { error: deleteError } = await supabase.from('guest').delete().eq('id', id)

    if (deleteError) {
      return createErrorResponse({
        code: 400,
        message: 'Error deleting guest',
        errors: [deleteError.message],
      })
    }

    return createApiResponse({
      code: 200,
      message: 'Guest deleted successfully',
    })
  } catch (error) {
    console.error('Delete guest error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}
