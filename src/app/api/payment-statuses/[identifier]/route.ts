import type { PaymentStatusListItem, UpdatePaymentStatusBody } from '../types'

import { createClient } from '@/providers/supabase/server'
import { createApiResponse, createErrorResponse } from '@/services/apiResponse'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ identifier: string }> }
): Promise<Response> {
  const startHrtime = process.hrtime()

  try {
    const supabase = await createClient()
    const { identifier } = await params

    const { data, error } = await supabase.from('payment_status').select().eq('id', identifier).single()

    if (error) {
      return createErrorResponse({
        code: 404,
        message: 'Payment status not found',
        errors: [error.message],
      })
    }

    return createApiResponse<PaymentStatusListItem>({
      code: 200,
      message: 'Payment status details retrieved successfully',
      start_hrtime: startHrtime,
      data,
    })
  } catch (error) {
    console.error('Get payment status details error:', error)
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
  const startHrtime = process.hrtime()

  try {
    const supabase = await createClient()
    const { identifier } = await params
    const updateData: UpdatePaymentStatusBody = await request.json()

    // Validate all fields are provided
    if (!updateData.name && typeof updateData.number !== 'number' && !updateData.color) {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: ['All fields are required'],
      })
    }

    // Validate required fields
    if (!updateData.name) {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: ['Payment status name is required'],
      })
    }

    // Validate payment_status_number if provided
    if (typeof updateData.number !== 'number') {
      return createErrorResponse({
        code: 400,
        message: 'Invalid payment status number',
        errors: ['Payment status number must be a number'],
      })
    }

    // Validate payment status color
    if (!updateData.color) {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: ['Payment status color field is required'],
      })
    }

    // Check if payment status exists
    const { data: existingPaymentStatus } = await supabase
      .from('payment_status')
      .select('id')
      .eq('id', identifier)
      .single()

    if (!existingPaymentStatus) {
      return createErrorResponse({
        code: 404,
        message: 'Payment status not found',
        errors: ['Payment status with the specified ID does not exist'],
      })
    }

    // Check if payment status name already exists (excluding current status)
    const { data: existingName } = await supabase
      .from('payment_status')
      .select('id')
      .ilike('name', updateData.name)
      .neq('id', identifier)
      .single()

    if (existingName) {
      return createErrorResponse({
        code: 400,
        message: 'Payment status name already exists',
        errors: ['Payment status name must be unique'],
      })
    }

    // Check if payment status number already exists (excluding current status)
    const { data: existingNumber } = await supabase
      .from('payment_status')
      .select('id')
      .eq('number', updateData.number)
      .neq('id', identifier)
      .single()

    if (existingNumber) {
      return createErrorResponse({
        code: 400,
        message: 'Payment status number already exists',
        errors: ['Payment status number must be unique'],
      })
    }

    // Check if payment status color already exists (excluding current status)
    const { data: existingColor } = await supabase
      .from('payment_status')
      .select('id')
      .eq('color', updateData.color)
      .neq('id', identifier)
      .single()

    if (existingColor) {
      return createErrorResponse({
        code: 400,
        message: 'Payment status color already exists',
        errors: ['Payment status color must be unique'],
      })
    }

    const { data, error } = await supabase
      .from('payment_status')
      .update(updateData)
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

    return createApiResponse<PaymentStatusListItem>({
      code: 200,
      message: 'Payment status updated successfully',
      start_hrtime: startHrtime,
      data,
    })
  } catch (error) {
    console.error('Update payment status error:', error)
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
  const startHrtime = process.hrtime()

  try {
    const supabase = await createClient()
    const { identifier } = await params

    // Check if payment status exists
    const { data: existingStatus, error: checkError } = await supabase
      .from('payment_status')
      .select('id')
      .eq('id', identifier)
      .single()

    if (checkError || !existingStatus) {
      return createErrorResponse({
        code: 404,
        message: 'Payment status not found',
        errors: ['Payment status with the specified ID does not exist'],
      })
    }

    // Check if payment status is being used in any bookings
    const { data: bookings } = await supabase.from('booking').select('id').eq('payment_status_id', identifier).limit(1)

    if (bookings && bookings.length > 0) {
      return createErrorResponse({
        code: 400,
        message: 'Payment status is in use',
        errors: ['Cannot delete payment status that is being used in bookings'],
      })
    }

    const { error } = await supabase.from('payment_status').delete().eq('id', identifier)

    if (error) {
      return createErrorResponse({
        code: 400,
        message: error.message,
        errors: [error.message],
      })
    }

    return createApiResponse({
      code: 200,
      message: 'Payment status deleted successfully',
      start_hrtime: startHrtime,
    })
  } catch (error) {
    console.error('Delete payment status error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}
