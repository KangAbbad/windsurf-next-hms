import { createClient } from '@/providers/supabase/server'
import { createApiResponse, createErrorResponse } from '@/services/apiResponse'
import type { UpdateRoomClassBody } from '@/types/room-class'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ identifier: string }> }
): Promise<Response> {
  try {
    const supabase = await createClient()
    const { identifier } = await params

    const { data, error } = await supabase
      .from('room_class')
      .select(
        `
        id,
        class_name,
        base_price,
        created_at,
        updated_at
      `
      )
      .eq('id', identifier)
      .single()

    if (error) {
      return createErrorResponse({
        code: 404,
        message: 'Room class not found',
        errors: [error.message],
      })
    }

    return createApiResponse({
      code: 200,
      message: 'Room class details retrieved successfully',
      data,
    })
  } catch (error) {
    console.error('Get room class details error:', error)
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
    const updateData: UpdateRoomClassBody = await request.json()

    // Validate required fields
    const validationErrors: string[] = []
    if (!updateData.class_name) validationErrors.push('class_name is required')
    if (!updateData.base_price) validationErrors.push('base_price is required')

    if (validationErrors.length > 0) {
      return createErrorResponse({
        code: 400,
        message: 'Missing required fields',
        errors: validationErrors,
      })
    }

    // Validate base_price is a positive number
    if (typeof updateData.base_price !== 'number' || updateData.base_price <= 0) {
      return createErrorResponse({
        code: 400,
        message: 'Invalid base price',
        errors: ['Base price must be a positive number'],
      })
    }

    // Check if room class name already exists (excluding current room class)
    const { data: existingRoomClass } = await supabase
      .from('room_class')
      .select('id')
      .ilike('class_name', updateData.class_name ?? '')
      .neq('id', identifier)
      .single()

    if (existingRoomClass) {
      return createErrorResponse({
        code: 400,
        message: 'Room class name already exists',
        errors: ['Room class name must be unique'],
      })
    }

    // Update room class
    const { data: updatedRoomClass, error } = await supabase
      .from('room_class')
      .update({
        class_name: updateData.class_name,
        base_price: updateData.base_price,
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

    return createApiResponse({
      code: 200,
      message: 'Room class updated successfully',
      data: updatedRoomClass,
    })
  } catch (error) {
    console.error('Update room class error:', error)
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

    const { error } = await supabase.from('room_class').delete().eq('id', identifier)

    if (error) {
      return createErrorResponse({
        code: 400,
        message: error.message,
        errors: [error.message],
      })
    }

    return createApiResponse({
      code: 200,
      message: 'Room class deleted successfully',
    })
  } catch (error) {
    console.error('Delete room class error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}
