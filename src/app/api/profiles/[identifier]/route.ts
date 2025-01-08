import { createClient } from '@/providers/supabase/server'
import { createApiResponse, createErrorResponse } from '@/services/apiResponse'

// Get profile by id or username
export async function GET(_request: Request, { params }: { params: { identifier: string } }) {
  try {
    const supabase = await createClient()
    const identifier = params.identifier

    // Try to find by ID first (assuming UUID format)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    const isUuid = uuidRegex.test(identifier)

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(isUuid ? `id.eq.${identifier}` : `username.eq.${identifier}`)
      .single()

    if (error) {
      return createErrorResponse({
        code: 404,
        message: 'Profile not found',
        errors: [error.message],
      })
    }

    return createApiResponse({
      code: 200,
      message: 'Profile retrieved successfully',
      data,
    })
  } catch (error) {
    console.error('Get profile error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}

// Update profile
export async function PUT(request: Request, { params }: { params: { identifier: string } }) {
  try {
    const supabase = await createClient()
    const { identifier } = params
    const updates = await request.json()

    // Remove protected fields from updates
    const { id, email, created_at, updated_at, ...safeUpdates } = updates

    const { data, error } = await supabase.from('profiles').update(safeUpdates).eq('id', identifier).select().single()

    if (error) {
      return createErrorResponse({
        code: 400,
        message: error.message,
        errors: [error.message],
      })
    }

    return createApiResponse({
      code: 200,
      message: 'Profile updated successfully',
      data,
    })
  } catch (error) {
    console.error('Update profile error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}
