import { createClient } from '@/providers/supabase/server'
import { createApiResponse, createErrorResponse } from '@/services/apiResponse'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Input validation
    if (!email || !password) {
      return createErrorResponse({
        code: 400,
        message: 'Email and password are required',
        errors: ['Missing required fields'],
      })
    }

    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    })

    if (error) {
      return createErrorResponse({
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        code: error.status || 500,
        message: error.message,
        errors: [error.message],
      })
    }

    const { user, ...restSession } = data.session

    return createApiResponse({
      code: 200,
      message: 'Sign in successful',
      data: restSession,
    })
  } catch (error) {
    console.error('Sign in error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}
