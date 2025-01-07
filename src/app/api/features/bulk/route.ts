import { createApiResponse, createErrorResponse } from '@/lib/api-response'
import { createClient } from '@/providers/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { features } = await request.json()

    if (!Array.isArray(features) || features.length === 0) {
      return createErrorResponse({
        code: 400,
        message: 'Invalid request body',
        errors: ['features must be a non-empty array'],
      })
    }

    // Validate all features
    const validationErrors: string[] = []
    const featureNames = new Set<string>()

    features.forEach((feature, index) => {
      if (!feature.feature_name) {
        validationErrors.push(`Feature at index ${index} is missing feature_name`)
      }
      if (featureNames.has(feature.feature_name?.toLowerCase())) {
        validationErrors.push(`Duplicate feature name at index ${index}`)
      }
      if (feature.feature_name) {
        featureNames.add(feature.feature_name.toLowerCase())
      }
    })

    if (validationErrors.length > 0) {
      return createErrorResponse({
        code: 400,
        message: 'Validation failed',
        errors: validationErrors,
      })
    }

    // Check for existing feature names
    const { data: existingFeatures } = await supabase
      .from('feature')
      .select('feature_name')
      .in(
        'feature_name',
        features.map((f) => f.feature_name)
      )

    if (existingFeatures && existingFeatures.length > 0) {
      return createErrorResponse({
        code: 400,
        message: 'Duplicate feature names',
        errors: existingFeatures.map((f) => `Feature name '${f.feature_name}' already exists`),
      })
    }

    // Insert all features
    const { data, error } = await supabase.from('feature').insert(features).select()

    if (error) {
      return createErrorResponse({
        code: 400,
        message: error.message,
        errors: [error.message],
      })
    }

    return createApiResponse({
      code: 201,
      message: 'Features created successfully',
      data,
    })
  } catch (error) {
    console.error('Bulk create features error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    const { features } = await request.json()

    if (!Array.isArray(features) || features.length === 0) {
      return createErrorResponse({
        code: 400,
        message: 'Invalid request body',
        errors: ['features must be a non-empty array'],
      })
    }

    // Validate all features
    const validationErrors: string[] = []
    const featureNames = new Set<string>()
    const featureIds = new Set<string>()

    features.forEach((feature, index) => {
      if (!feature.id) {
        validationErrors.push(`Feature at index ${index} is missing id`)
      }
      if (!feature.feature_name) {
        validationErrors.push(`Feature at index ${index} is missing feature_name`)
      }
      if (featureNames.has(feature.feature_name?.toLowerCase())) {
        validationErrors.push(`Duplicate feature name at index ${index}`)
      }
      if (featureIds.has(feature.id)) {
        validationErrors.push(`Duplicate feature ID at index ${index}`)
      }
      if (feature.feature_name) {
        featureNames.add(feature.feature_name.toLowerCase())
      }
      if (feature.id) {
        featureIds.add(feature.id)
      }
    })

    if (validationErrors.length > 0) {
      return createErrorResponse({
        code: 400,
        message: 'Validation failed',
        errors: validationErrors,
      })
    }

    // Check for name conflicts (excluding current features)
    const nameConflicts = await Promise.all(
      features.map(async (feature) => {
        const { data } = await supabase
          .from('feature')
          .select('id')
          .eq('feature_name', feature.feature_name)
          .neq('id', feature.id)
          .single()
        return data ? feature.feature_name : null
      })
    )

    const conflictingNames = nameConflicts.filter(Boolean)
    if (conflictingNames.length > 0) {
      return createErrorResponse({
        code: 400,
        message: 'Name conflicts found',
        errors: conflictingNames.map((name) => `Feature name '${name}' already exists`),
      })
    }

    // Update features one by one to maintain atomicity
    const results = await Promise.all(
      features.map(async (feature) => {
        const { id, created_at, updated_at, ...updates } = feature
        const { data, error } = await supabase.from('feature').update(updates).eq('id', id).select().single()

        return { id, success: !error, data, error }
      })
    )

    const errors = results.filter((r) => !r.success).map((r) => `Failed to update feature ${r.id}: ${r.error?.message}`)
    if (errors.length > 0) {
      return createErrorResponse({
        code: 400,
        message: 'Some updates failed',
        errors,
      })
    }

    return createApiResponse({
      code: 200,
      message: 'Features updated successfully',
      data: results.map((r) => r.data),
    })
  } catch (error) {
    console.error('Bulk update features error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { ids } = await request.json()

    if (!Array.isArray(ids) || ids.length === 0) {
      return createErrorResponse({
        code: 400,
        message: 'Invalid request body',
        errors: ['ids must be a non-empty array'],
      })
    }

    // Check if any features are used in room classes
    const { data: usedFeatures } = await supabase
      .from('room_class_feature')
      .select('feature_id')
      .in('feature_id', ids)
      .limit(1)

    if (usedFeatures && usedFeatures.length > 0) {
      return createErrorResponse({
        code: 400,
        message: 'Cannot delete features that are used in room classes',
        errors: ['One or more features are associated with room classes'],
      })
    }

    const { error } = await supabase.from('feature').delete().in('id', ids)

    if (error) {
      return createErrorResponse({
        code: 400,
        message: error.message,
        errors: [error.message],
      })
    }

    return createApiResponse({
      code: 200,
      message: 'Features deleted successfully',
      data: { deleted_count: ids.length },
    })
  } catch (error) {
    console.error('Bulk delete features error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}
