import { createClient } from '@/providers/supabase/server'
import { createApiResponse, createErrorResponse } from '@/services/apiResponse'

export async function GET(_request: Request, { params }: { params: { identifier: string } }) {
  try {
    const supabase = await createClient()
    const { identifier } = params

    const { data, error } = await supabase.from('bed_type').select('*').eq('id', identifier).single()

    if (error) {
      return createErrorResponse({
        code: 404,
        message: 'Bed type not found',
        errors: [error.message],
      })
    }

    return createApiResponse({
      code: 200,
      message: 'Bed type details retrieved successfully',
      data,
    })
  } catch (error) {
    console.error('Get bed type details error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}

export async function PUT(request: Request, { params }: { params: { identifier: string } }) {
  try {
    const supabase = await createClient()
    const { identifier } = params
    const updates = await request.json()

    // Validate required fields
    if (!updates.bed_type_name) {
      return createErrorResponse({
        code: 400,
        message: 'Missing required fields',
        errors: ['bed_type_name is required'],
      })
    }

    // Check if bed type name already exists (excluding current bed type)
    const { data: existingBedType } = await supabase
      .from('bed_type')
      .select('id')
      .ilike('bed_type_name', updates.bed_type_name)
      .neq('id', identifier)
      .single()

    if (existingBedType) {
      return createErrorResponse({
        code: 400,
        message: 'Bed type name already exists',
        errors: ['Bed type name must be unique'],
      })
    }

    // Remove protected fields from updates
    const { id, created_at, updated_at, ...safeUpdates } = updates

    const { data, error } = await supabase.from('bed_type').update(safeUpdates).eq('id', identifier).select().single()

    if (error) {
      return createErrorResponse({
        code: 400,
        message: error.message,
        errors: [error.message],
      })
    }

    return createApiResponse({
      code: 200,
      message: 'Bed type updated successfully',
      data,
    })
  } catch (error) {
    console.error('Update bed type error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}

export async function DELETE(_request: Request, { params }: { params: { identifier: string } }) {
  try {
    const supabase = await createClient()
    const { identifier } = params

    // Check if bed type is used in any room class bed types
    const { data: usedBedTypes } = await supabase
      .from('room_class_bed_type')
      .select('room_class_id')
      .eq('bed_type_id', identifier)
      .limit(1)

    if (usedBedTypes && usedBedTypes.length > 0) {
      return createErrorResponse({
        code: 400,
        message: 'Cannot delete bed type that is used in room classes',
        errors: ['Bed type is associated with one or more room classes'],
      })
    }

    const { error } = await supabase.from('bed_type').delete().eq('id', identifier)

    if (error) {
      return createErrorResponse({
        code: 400,
        message: error.message,
        errors: [error.message],
      })
    }

    return createApiResponse({
      code: 200,
      message: 'Bed type deleted successfully',
    })
  } catch (error) {
    console.error('Delete bed type error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}
