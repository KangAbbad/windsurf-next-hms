import type { PaymentStatusListItem, UpdatePaymentStatusBody } from '../types'

import { createClient } from '@/providers/supabase/server'
import { createApiResponse, createErrorResponse } from '@/services/apiResponse'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ identifier: string }> }
): Promise<Response> {
  try {
    const supabase = await createClient()
    const { identifier } = await params

    const { data, error } = await supabase.from('payment-status').select('*').eq('id', identifier).single()

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
  try {
    const supabase = await createClient()
    const { identifier } = await params
    const updates: UpdatePaymentStatusBody = await request.json()

    // Validate required fields
    if (!updates.payment_status_name) {
      return createErrorResponse({
        code: 400,
        message: 'Missing required fields',
        errors: ['payment_status_name is required'],
      })
    }

    // Validate payment_status_number if provided
    if (updates.payment_status_number !== undefined) {
      if (typeof updates.payment_status_number !== 'number' || updates.payment_status_number <= 0) {
        return createErrorResponse({
          code: 400,
          message: 'Invalid payment status number',
          errors: ['Payment status number must be a positive number'],
        })
      }

      // Check if payment status number already exists (excluding current status)
      const { data: existingNumber } = await supabase
        .from('payment_status')
        .select('id')
        .eq('payment_status_number', updates.payment_status_number)
        .neq('id', identifier)
        .single()

      if (existingNumber) {
        return createErrorResponse({
          code: 400,
          message: 'Payment status number already exists',
          errors: ['Payment status number must be unique'],
        })
      }
    }

    // Check if payment status name already exists (excluding current status)
    if (updates.payment_status_name) {
      const { data: existingStatus } = await supabase
        .from('payment_status')
        .select('id')
        .ilike('payment_status_name', updates.payment_status_name)
        .neq('id', identifier)
        .single()

      if (existingStatus) {
        return createErrorResponse({
          code: 400,
          message: 'Payment status name already exists',
          errors: ['Payment status name must be unique'],
        })
      }
    }

    // Check if payment status exists
    const { data: existingPaymentStatus, error: checkError } = await supabase
      .from('payment_status')
      .select('id')
      .eq('id', identifier)
      .single()

    if (checkError || !existingPaymentStatus) {
      return createErrorResponse({
        code: 404,
        message: 'Payment status not found',
        errors: ['Payment status with the specified ID does not exist'],
      })
    }

    const { data, error } = await supabase
      .from('payment_status')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
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

    return createApiResponse<PaymentStatusListItem>({
      code: 200,
      message: 'Payment status updated successfully',
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
