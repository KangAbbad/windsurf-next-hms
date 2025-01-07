import { createApiResponse, createErrorResponse } from '@/lib/api-response'
import { createClient } from '@/providers/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signOut()

    if (error) {
      return createErrorResponse({
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        code: error.status || 500,
        message: error.message,
        errors: [error.message],
      })
    }

    return createApiResponse({
      code: 200,
      message: 'Successfully signed out',
    })
  } catch (error) {
    console.error('Sign out error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}
