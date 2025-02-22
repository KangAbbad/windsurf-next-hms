import { NextResponse } from 'next/server'

import { calculateApiResponseTime } from '@/utils/calculateApiResponseTime'

export type ApiResponse<T = unknown> = {
  code: number
  message: string
  success: boolean
  errors: string[]
  response_time: string
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

type CreateApiResponseType<T = unknown> = Partial<
  ApiResponse<T> & {
    start_hrtime: [number, number]
  }
>

export function createApiResponse<T>(args: CreateApiResponseType<T>): NextResponse {
  const {
    code = 200,
    message = '',
    success = true,
    errors = [],
    start_hrtime,
    response_time = '0ms',
    data = null,
  } = args

  const responseTime = start_hrtime ? calculateApiResponseTime(start_hrtime) : response_time

  const response: ApiResponse<T> = {
    code,
    message,
    success,
    errors,
    response_time: responseTime,
    data,
  }

  return NextResponse.json(response, { status: code })
}

export function createErrorResponse({
  code = 500,
  message = 'Internal server error',
  errors = [],
  response_time = '0ms',
}: {
  code?: number
  message?: string
  errors?: string[]
  response_time?: string
}): NextResponse {
  return createApiResponse({
    code,
    message,
    success: false,
    errors,
    response_time,
  })
}
