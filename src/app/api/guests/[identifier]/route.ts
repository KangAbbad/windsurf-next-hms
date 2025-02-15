import type { GuestListItem, UpdateGuestBody } from '../types'

import { createClient } from '@/providers/supabase/server'
import { createApiResponse, createErrorResponse } from '@/services/apiResponse'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ identifier: string }> }
): Promise<Response> {
  try {
    const supabase = await createClient()
    const { identifier } = await params

    const { data: guest, error } = await supabase.from('guest').select('*').eq('id', identifier).single()

    if (error) {
      return createErrorResponse({
        code: 404,
        message: 'Guest not found',
        errors: [error.message],
      })
    }

    return createApiResponse<GuestListItem>({
      code: 200,
      message: 'Guest retrieved successfully',
      data: guest,
    })
  } catch (error) {
    console.error('Get guest error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ identifier: string }> }
): Promise<Response> {
  try {
    const supabase = await createClient()
    const { identifier } = await params
    const updateData: UpdateGuestBody = await request.json()

    // Validate required fields
    if (
      !updateData.nationality &&
      !updateData.id_card_type &&
      !updateData.id_card_number &&
      !updateData.name &&
      !updateData.phone
    ) {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: ['All fields are required'],
      })
    }

    // Validate guest nationality
    if (!updateData.nationality) {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: ['Guest nationality is required'],
      })
    }

    // Validate ID card type
    if (!updateData.id_card_type) {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: ['ID card type is required'],
      })
    }

    // Validate ID card number
    if (!updateData.id_card_number) {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: ['ID card number is required'],
      })
    }

    // Validate guest name
    if (!updateData.name) {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: ['Guest name is required'],
      })
    }

    // Validate phone number
    if (!updateData.phone) {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: ['Phone number is required'],
      })
    }

    // Check if guest exists
    const { data: existingGuest } = await supabase.from('guest').select('id').eq('id', identifier).single()

    if (!existingGuest) {
      return createErrorResponse({
        code: 404,
        message: 'Guest not found',
        errors: ['Guest with the specified ID does not exist'],
      })
    }

    const { data: existingIdCardNumber } = await supabase
      .from('guest')
      .select('id')
      .eq('id_card_number', updateData.id_card_number)
      .neq('id', identifier)
      .single()

    if (existingIdCardNumber) {
      return createErrorResponse({
        code: 400,
        message: 'ID Card number already exists',
        errors: ['ID Card number must be unique'],
      })
    }

    // Check email uniqueness if email is being updated
    if (updateData.email) {
      const { data: existingEmail } = await supabase
        .from('guest')
        .select('id')
        .eq('email', updateData.email)
        .neq('id', identifier)
        .single()

      if (existingEmail) {
        return createErrorResponse({
          code: 400,
          message: 'Email address already exists',
          errors: ['Email address must be unique'],
        })
      }
    }

    // Update guest
    const { data, error } = await supabase.from('guest').update(updateData).eq('id', identifier).select().single()

    if (error) {
      return createErrorResponse({
        code: 400,
        message: error.message,
        errors: [error.message],
      })
    }

    return createApiResponse<GuestListItem>({
      code: 200,
      message: 'Guest updated successfully',
      data,
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

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ identifier: string }> }
): Promise<Response> {
  try {
    const supabase = await createClient()
    const { identifier } = await params

    // Check if guest has any bookings
    const { data: bookings } = await supabase.from('booking').select('id').eq('guest_id', identifier).limit(1)

    if (bookings && bookings.length > 0) {
      return createErrorResponse({
        code: 400,
        message: 'Cannot delete guest with existing bookings',
        errors: ['Please delete all associated bookings first'],
      })
    }

    // Delete guest
    const { error } = await supabase.from('guest').delete().eq('id', identifier)

    if (error) {
      return createErrorResponse({
        code: 400,
        message: error.message,
        errors: [error.message],
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
