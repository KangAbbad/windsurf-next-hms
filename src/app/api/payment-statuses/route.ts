import { PAYMENT_STATUS_NAME_LENGTH, type CreatePaymentStatusBody, type PaymentStatusListItem } from './types'

import { createClient } from '@/providers/supabase/server'
import { createApiResponse, createErrorResponse, PaginatedDataResponse } from '@/services/apiResponse'
import { parseSearchParamsToNumber } from '@/utils/parseSearchParamsToNumber'

export async function GET(request: Request): Promise<Response> {
  const startHrtime = process.hrtime()

  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const page = parseSearchParamsToNumber(searchParams.get('page'), 1) ?? 1
    const limit = parseSearchParamsToNumber(searchParams.get('limit'), 10) ?? 10
    const offset = (page - 1) * limit

    const query = supabase.from('payment_status').select('*', { count: 'exact' })

    const {
      data: items,
      error,
      count,
    } = await query.range(offset, offset + limit - 1).order('number', { ascending: true })

    if (error) {
      return createErrorResponse({
        code: 400,
        message: error.message,
        errors: [error.message],
      })
    }

    const response: PaginatedDataResponse<PaymentStatusListItem> = {
      items,
      meta: {
        page,
        limit,
        total: count ?? 0,
        total_pages: Math.ceil((count ?? 0) / limit),
      },
    }

    return createApiResponse<PaginatedDataResponse<PaymentStatusListItem>>({
      code: 200,
      message: 'Payment status list retrieved successfully',
      start_hrtime: startHrtime,
      data: response,
    })
  } catch (error) {
    console.error('Get payment statuses error:', error)
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
    const newPaymentStatus: CreatePaymentStatusBody = await request.json()

    // Validate required fields
    if (!newPaymentStatus.name && typeof newPaymentStatus.number !== 'number' && !newPaymentStatus.color) {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: ['All fields are required'],
      })
    }

    // Validate payment status name
    if (!newPaymentStatus.name) {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: ['Payment status name field is required'],
      })
    }

    // Validate payment status name length
    if (newPaymentStatus.name.length > PAYMENT_STATUS_NAME_LENGTH) {
      return createErrorResponse({
        code: 400,
        message: 'Invalid payment status name',
        errors: [`Payment status name must be less than ${PAYMENT_STATUS_NAME_LENGTH} characters`],
      })
    }

    // Validate payment status number is a number
    if (typeof newPaymentStatus.number !== 'number') {
      return createErrorResponse({
        code: 400,
        message: 'Invalid payment status number',
        errors: ['Payment status number must be a number'],
      })
    }

    // Validate payment_status_color
    if (!newPaymentStatus.color) {
      return createErrorResponse({
        code: 400,
        message: 'Missing or invalid required fields',
        errors: ['Payment status color field is required'],
      })
    }

    // Check if payment status name already exists
    const { data: existingName } = await supabase
      .from('payment_status')
      .select('id')
      .ilike('name', newPaymentStatus.name)
      .single()

    if (existingName) {
      return createErrorResponse({
        code: 400,
        message: 'Payment status name already exists',
        errors: ['Payment status name must be unique'],
      })
    }

    // Check if payment status number already exists
    const { data: existingNumber } = await supabase
      .from('payment_status')
      .select('id')
      .eq('number', newPaymentStatus.number)
      .single()

    if (existingNumber) {
      return createErrorResponse({
        code: 400,
        message: 'Payment status number already exists',
        errors: ['Payment status number must be unique'],
      })
    }

    // Check if payment status color already exists
    const { data: existingColor } = await supabase
      .from('payment_status')
      .select('id')
      .ilike('color', newPaymentStatus.color)
      .single()

    if (existingColor) {
      return createErrorResponse({
        code: 400,
        message: 'Payment status color already exists',
        errors: ['Payment status color must be unique'],
      })
    }

    const { data, error } = await supabase.from('payment_status').insert([newPaymentStatus]).select().single()

    if (error) {
      return createErrorResponse({
        code: 400,
        message: error.message,
        errors: [error.message],
      })
    }

    return createApiResponse<PaymentStatusListItem>({
      code: 201,
      message: 'Payment status created successfully',
      data,
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
