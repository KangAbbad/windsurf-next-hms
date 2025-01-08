import { createClient } from '@/providers/supabase/server'
import { createApiResponse, createErrorResponse } from '@/services/apiResponse'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    // Input validation
    if (!email || !password) {
      return createErrorResponse({
        code: 400,
        message: 'Email and password are required',
        errors: ['Missing required fields'],
      })
    }

    const supabase = await createClient()

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      return createErrorResponse({
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        code: error.status || 500,
        message: error.message,
        errors: [error.message],
      })
    }

    return createApiResponse({
      code: 201,
      message: 'Signup successful! Please check your email for verification.',
      data: data.user,
    })
  } catch (error) {
    console.error('Signup error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}
