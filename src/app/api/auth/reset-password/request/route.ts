import { createClient } from '@/providers/supabase/server'
import { createApiResponse, createErrorResponse } from '@/services/apiResponse'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return createErrorResponse({
        code: 400,
        message: 'Email is required',
        errors: ['Missing email address'],
      })
    }

    const supabase = await createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
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
      code: 200,
      message: 'Password reset instructions have been sent to your email',
    })
  } catch (error) {
    console.error('Password reset request error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}
