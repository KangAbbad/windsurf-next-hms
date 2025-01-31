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
    const body: UpdateGuestBody = await request.json()

    // Check if guest exists
    const { data: existingGuest } = await supabase.from('guest').select('id').eq('id', identifier).single()

    if (!existingGuest) {
      return createErrorResponse({
        code: 404,
        message: 'Guest not found',
        errors: ['Guest with the specified ID does not exist'],
      })
    }

    // Check email uniqueness if email is being updated
    if (body.email_address) {
      const { data: emailExists } = await supabase
        .from('guest')
        .select('id')
        .eq('email_address', body.email_address)
        .neq('id', identifier)
        .single()

      if (emailExists) {
        return createErrorResponse({
          code: 400,
          message: 'Email address already exists',
          errors: ['Email address must be unique'],
        })
      }
    }

    // Update guest
    const { data: updatedGuest, error } = await supabase
      .from('guest')
      .update({
        first_name: body.first_name,
        last_name: body.last_name,
        email_address: body.email_address,
        phone_number: body.phone_number,
      })
      .eq('id', identifier)
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
      code: 200,
      message: 'Guest updated successfully',
      data: updatedGuest,
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
  request: Request,
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
