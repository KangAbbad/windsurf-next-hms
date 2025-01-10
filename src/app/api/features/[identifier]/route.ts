import { createClient } from '@/providers/supabase/server'
import { createApiResponse, createErrorResponse } from '@/services/apiResponse'
import { FEATURE_NAME_MAX_LENGTH, type FeatureListItem, type UpdateFeatureBody } from '@/types/feature'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ identifier: string }> }
): Promise<Response> {
  try {
    const supabase = await createClient()
    const { identifier } = await params

    const { data, error } = await supabase.from('feature').select('*').eq('id', identifier).single()

    if (error) {
      return createErrorResponse({
        code: 404,
        message: 'Feature not found',
        errors: [error.message],
      })
    }

    return createApiResponse<FeatureListItem>({
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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ identifier: string }> }
): Promise<Response> {
  try {
    const supabase = await createClient()
    const { identifier } = await params
    const updates: UpdateFeatureBody = await request.json()
    const featureName = updates.feature_name?.trim()

    // Validate required fields
    if (!featureName) {
      return createErrorResponse({
        code: 400,
        message: 'Missing required fields',
        errors: ['feature_name is required'],
      })
    }

    // Validate feature name length
    if (featureName.length > FEATURE_NAME_MAX_LENGTH) {
      return createErrorResponse({
        code: 400,
        message: 'Invalid feature name',
        errors: [`feature_name must not exceed ${FEATURE_NAME_MAX_LENGTH} characters`],
      })
    }

    // Check if feature exists
    const { data: existingFeature } = await supabase.from('feature').select('id').eq('id', identifier).single()

    if (!existingFeature) {
      return createErrorResponse({
        code: 404,
        message: 'Feature not found',
        errors: ['The specified feature does not exist'],
      })
    }

    // Check if feature name already exists (excluding current feature)
    const { data: duplicateFeature } = await supabase
      .from('feature')
      .select('id')
      .ilike('feature_name', featureName)
      .neq('id', identifier)
      .single()

    if (duplicateFeature) {
      return createErrorResponse({
        code: 409,
        message: 'Feature name already exists',
        errors: ['Feature name must be unique'],
      })
    }

    const { data, error } = await supabase
      .from('feature')
      .update({ feature_name: featureName })
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

    return createApiResponse<FeatureListItem>({
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

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ identifier: string }> }
): Promise<Response> {
  try {
    const supabase = await createClient()
    const { identifier } = await params

    // Check if feature exists
    const { data: existingFeature } = await supabase.from('feature').select('id').eq('id', identifier).single()

    if (!existingFeature) {
      return createErrorResponse({
        code: 404,
        message: 'Feature not found',
        errors: ['The specified feature does not exist'],
      })
    }

    // Check if feature is used in any room classes
    const { data: usedFeatures } = await supabase
      .from('room_class_feature')
      .select('room_class_id')
      .eq('feature_id', identifier)
      .limit(1)

    if (usedFeatures && usedFeatures.length > 0) {
      return createErrorResponse({
        code: 409,
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
