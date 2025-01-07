import { createApiResponse, createErrorResponse } from '@/lib/api-response'
import { createClient } from '@/providers/supabase/server'
import type {
  CreatePaymentStatusInput,
  PaymentStatus,
  PaymentStatusResponse,
  UpdatePaymentStatusInput,
} from '@/types/payment-status'

// GET /api/payment-statuses - List all payment statuses
export async function GET(request: Request): Promise<Response> {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    // Get query parameters
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    const page = parseInt(searchParams.get('page') || '1', 10)
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const offset = (page - 1) * limit

    // Build query
    const query = supabase
      .from('payment_status')
      .select('id, payment_status_name', { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order('payment_status_name', { ascending: true })

    // Execute query
    const { data: paymentStatuses, error, count } = await query

    if (error) {
      return createErrorResponse({
        code: 400,
        message: 'Error fetching payment statuses',
        errors: [error.message],
      })
    }

    const response: PaymentStatusResponse = {
      payment_statuses: paymentStatuses as PaymentStatus[],
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
      message: 'Payment statuses retrieved successfully',
      data: response,
    })
  } catch (error) {
    console.error('List payment statuses error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}

// POST /api/payment-statuses - Create new payment status
export async function POST(request: Request): Promise<Response> {
  try {
    const supabase = await createClient()
    const newPaymentStatus: CreatePaymentStatusInput = await request.json()
    const { payment_status_name } = newPaymentStatus

    // Validate required fields
    if (!payment_status_name || typeof payment_status_name !== 'string' || !payment_status_name.trim()) {
      return createErrorResponse({
        code: 400,
        message: 'Missing required fields',
        errors: ['payment_status_name is required and must be a non-empty string'],
      })
    }

    // Check for duplicate name
    const { data: existing, error: checkError } = await supabase
      .from('payment_status')
      .select('id')
      .ilike('payment_status_name', payment_status_name.trim())
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 means no rows returned, which is what we want
      return createErrorResponse({
        code: 400,
        message: 'Error checking existing payment status',
        errors: [checkError.message],
      })
    }

    if (existing) {
      return createErrorResponse({
        code: 400,
        message: 'Payment status already exists',
        errors: [`Payment status "${payment_status_name}" already exists`],
      })
    }

    // Create payment status
    const { data: created, error: createError } = await supabase
      .from('payment_status')
      .insert({ payment_status_name: payment_status_name.trim() })
      .select()
      .single()

    if (createError) {
      return createErrorResponse({
        code: 400,
        message: 'Error creating payment status',
        errors: [createError.message],
      })
    }

    return createApiResponse({
      code: 201,
      message: 'Payment status created successfully',
      data: created as PaymentStatus,
    })
  } catch (error) {
    console.error('Create payment status error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}

// PUT /api/payment-statuses - Update payment status
export async function PUT(request: Request): Promise<Response> {
  try {
    const supabase = await createClient()
    const updatePaymentStatus: UpdatePaymentStatusInput = await request.json()
    const { id, payment_status_name } = updatePaymentStatus

    // Validate required fields
    if (!id) {
      return createErrorResponse({
        code: 400,
        message: 'Missing required fields',
        errors: ['id is required'],
      })
    }

    if (!payment_status_name || typeof payment_status_name !== 'string' || !payment_status_name.trim()) {
      return createErrorResponse({
        code: 400,
        message: 'Missing required fields',
        errors: ['payment_status_name is required and must be a non-empty string'],
      })
    }

    // Check if payment status exists
    const { error: checkError } = await supabase.from('payment_status').select('id').eq('id', id).single()

    if (checkError) {
      return createErrorResponse({
        code: 404,
        message: 'Payment status not found',
        errors: ['Invalid payment status ID'],
      })
    }

    // Check for duplicate name (excluding current record)
    const { data: duplicate, error: duplicateError } = await supabase
      .from('payment_status')
      .select('id')
      .neq('id', id)
      .ilike('payment_status_name', payment_status_name.trim())
      .single()

    if (duplicateError && duplicateError.code !== 'PGRST116') {
      return createErrorResponse({
        code: 400,
        message: 'Error checking duplicate payment status',
        errors: [duplicateError.message],
      })
    }

    if (duplicate) {
      return createErrorResponse({
        code: 400,
        message: 'Payment status already exists',
        errors: [`Payment status "${payment_status_name}" already exists`],
      })
    }

    // Update payment status
    const { data: updated, error: updateError } = await supabase
      .from('payment_status')
      .update({ payment_status_name: payment_status_name.trim() })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      return createErrorResponse({
        code: 400,
        message: 'Error updating payment status',
        errors: [updateError.message],
      })
    }

    return createApiResponse({
      code: 200,
      message: 'Payment status updated successfully',
      data: updated as PaymentStatus,
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

// DELETE /api/payment-statuses - Delete payment status
export async function DELETE(request: Request): Promise<Response> {
  try {
    const supabase = await createClient()
    const { id } = await request.json()

    if (!id) {
      return createErrorResponse({
        code: 400,
        message: 'Missing required fields',
        errors: ['id is required'],
      })
    }

    // Check if payment status exists
    const { error: checkError } = await supabase.from('payment_status').select('id').eq('id', id).single()

    if (checkError) {
      return createErrorResponse({
        code: 404,
        message: 'Payment status not found',
        errors: ['Invalid payment status ID'],
      })
    }

    // Check if payment status is being used by any bookings
    const { data: bookings, error: bookingError } = await supabase
      .from('booking')
      .select('id')
      .eq('payment_status_id', id)
      .limit(1)
      .single()

    if (bookingError && bookingError.code !== 'PGRST116') {
      return createErrorResponse({
        code: 400,
        message: 'Error checking payment status usage',
        errors: [bookingError.message],
      })
    }

    if (bookings) {
      return createErrorResponse({
        code: 400,
        message: 'Payment status in use',
        errors: ['Cannot delete payment status that is being used by bookings'],
      })
    }

    // Delete payment status
    const { error: deleteError } = await supabase.from('payment_status').delete().eq('id', id)

    if (deleteError) {
      return createErrorResponse({
        code: 400,
        message: 'Error deleting payment status',
        errors: [deleteError.message],
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
