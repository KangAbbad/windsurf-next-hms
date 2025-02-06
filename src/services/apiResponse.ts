import { NextResponse } from 'next/server'

export type ApiResponse<T = unknown> = {
  code: number
  message: string
  success: boolean
  response_time: string
  errors: string[]
  data: T | null
}

export type PaginatedDataResponse<T> = {
  items: T[]
  meta: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}

export function createApiResponse<T>({
  code = 200,
  message = '',
  success = true,
  errors = [],
  data = null,
}: Partial<ApiResponse<T>>): NextResponse {
  const startTime = performance.now()
  const responseTime = Math.round(performance.now() - startTime)

  const response: ApiResponse<T> = {
    code,
    message,
    success,
    response_time: `${responseTime} ms`,
    errors,
    data,
  }

  return NextResponse.json(response, { status: code })
}

export function createErrorResponse({
  code = 500,
  message = 'Internal server error',
  errors = [],
}: {
  code?: number
  message?: string
  errors?: string[]
}): NextResponse {
  return createApiResponse({
    code,
    message,
    success: false,
    errors,
  })
}
