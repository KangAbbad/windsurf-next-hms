import { createApiResponse, createErrorResponse } from '@/lib/api-response'
import { createClient } from '@/providers/supabase/server'

export async function GET(_request: Request, { params }: { params: { identifier: string } }) {
  try {
    const supabase = await createClient()
    const { identifier } = params

    const { data, error } = await supabase.from('feature').select('*').eq('id', identifier).single()

    if (error) {
      return createErrorResponse({
        code: 404,
        message: 'Feature not found',
        errors: [error.message],
      })
    }

    return createApiResponse({
      code: 200,
      message: 'Feature details retrieved successfully',
      data,
    })
  } catch (error) {
    console.error('Get feature details error:', error)
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
    if (!updates.feature_name) {
      return createErrorResponse({
        code: 400,
        message: 'Missing required fields',
        errors: ['feature_name is required'],
      })
    }

    // Check if feature name already exists (excluding current feature)
    const { data: existingFeature } = await supabase
      .from('feature')
      .select('id')
      .ilike('feature_name', updates.feature_name)
      .neq('id', identifier)
      .single()

    if (existingFeature) {
      return createErrorResponse({
        code: 400,
        message: 'Feature name already exists',
        errors: ['Feature name must be unique'],
      })
    }

    // Remove protected fields from updates
    const { id, created_at, updated_at, ...safeUpdates } = updates

    const { data, error } = await supabase.from('feature').update(safeUpdates).eq('id', identifier).select().single()

    if (error) {
      return createErrorResponse({
        code: 400,
        message: error.message,
        errors: [error.message],
      })
    }

    return createApiResponse({
      code: 200,
      message: 'Feature updated successfully',
      data,
    })
  } catch (error) {
    console.error('Update feature error:', error)
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

    // Check if feature is used in any room classes
    const { data: usedFeatures } = await supabase
      .from('room_class_feature')
      .select('room_class_id')
      .eq('feature_id', identifier)
      .limit(1)

    if (usedFeatures && usedFeatures.length > 0) {
      return createErrorResponse({
        code: 400,
        message: 'Cannot delete feature that is used in room classes',
        errors: ['Feature is associated with one or more room classes'],
      })
    }

    const { error } = await supabase.from('feature').delete().eq('id', identifier)

    if (error) {
      return createErrorResponse({
        code: 400,
        message: error.message,
        errors: [error.message],
      })
    }

    return createApiResponse({
      code: 200,
      message: 'Feature deleted successfully',
    })
  } catch (error) {
    console.error('Delete feature error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}
