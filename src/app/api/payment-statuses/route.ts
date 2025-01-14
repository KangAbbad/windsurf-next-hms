import { createClient } from '@/providers/supabase/server'
import { createApiResponse, createErrorResponse, PaginatedDataResponse } from '@/services/apiResponse'
import type { CreatePaymentStatusBody, PaymentStatusListItem } from '@/types/payment-status'

export async function GET(request: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') ?? '1', 10)
    const limit = parseInt(searchParams.get('limit') ?? '10', 10)
    const search = searchParams.get('search') ?? ''

    const offset = (page - 1) * limit

    const supabase = await createClient()

    let query = supabase.from('payment_status').select('*', { count: 'exact' })

    // Apply search filter if provided
    if (search) {
      query = query.ilike('payment_status_name', `%${search}%`)
    }

    const {
      data: items,
      error,
      count,
    } = await query.range(offset, offset + limit - 1).order('payment_status_name', { ascending: true })

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
    if (!newPaymentStatus.payment_status_name || !newPaymentStatus.payment_status_number) {
      return createErrorResponse({
        code: 400,
        message: 'Missing required fields',
        errors: ['payment_status_name and payment_status_number are required'],
      })
    }

    // Validate payment_status_number is a positive number
    if (typeof newPaymentStatus.payment_status_number !== 'number' || newPaymentStatus.payment_status_number <= 0) {
      return createErrorResponse({
        code: 400,
        message: 'Invalid payment status number',
        errors: ['Payment status number must be a positive number'],
      })
    }

    // Check if payment status name already exists
    const { data: existingStatus } = await supabase
      .from('payment_status')
      .select('id')
      .ilike('payment_status_name', newPaymentStatus.payment_status_name)
      .single()

    if (existingStatus) {
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
      .eq('payment_status_number', newPaymentStatus.payment_status_number)
      .single()

    if (existingNumber) {
      return createErrorResponse({
        code: 400,
        message: 'Payment status number already exists',
        errors: ['Payment status number must be unique'],
      })
    }

    const { data, error } = await supabase
      .from('payment_status')
      .insert([
        {
          payment_status_name: newPaymentStatus.payment_status_name,
          payment_status_number: newPaymentStatus.payment_status_number,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
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
