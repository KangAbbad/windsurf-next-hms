import { RevenueAnalyticsResponse, RevenueSummary } from './types'

import { createClient } from '@/providers/supabase/server'
import { createApiResponse, createErrorResponse } from '@/services/apiResponse'

const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

export async function GET(request: Request): Promise<Response> {
  const startHrtime = process.hrtime()

  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const periodType = searchParams.get('period') as string
    const year = parseInt(searchParams.get('year') ?? new Date().getFullYear().toString(), 10)
    const month = searchParams.get('month') ? parseInt(searchParams.get('month') ?? '', 10) - 1 : null

    if (!['daily', 'weekly', 'monthly', 'annually'].includes(periodType)) {
      return createErrorResponse({
        code: 400,
        message: 'Invalid period type',
        errors: ['Period type must be one of: daily, weekly, monthly, annually'],
      })
    }

    // Calculate date range for fetching both current and previous period data
    let startDate: Date
    const endDate = new Date(year, month !== null ? month + 1 : 11, 31)

    if (periodType === 'daily') {
      startDate = new Date(year, month ?? 0, 1)
      startDate.setDate(startDate.getDate() - 1) // Include previous day
    } else if (periodType === 'weekly') {
      startDate = new Date(year, 0, 1)
      startDate.setDate(startDate.getDate() - 7) // Include previous week
    } else if (periodType === 'monthly') {
      startDate = new Date(year, (month ?? 0) - 1, 1) // Include previous month
    } else {
      startDate = new Date(year - 1, 0, 1) // Include previous year
    }

    const { data: bookings, error: bookingsError } = await supabase
      .from('booking')
      .select(
        `
          id,
          booking_amount,
          created_at,
          payment_status!inner(
            number
          )
        `
      )
      .eq('payment_status.number', 2)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true })

    if (bookingsError) {
      return createErrorResponse({
        code: 500,
        message: 'Failed to fetch booking data',
        errors: [bookingsError.message],
      })
    }

    if (!bookings || bookings.length === 0) {
      return createApiResponse({
        code: 200,
        message: 'No booking data available',
        start_hrtime: startHrtime,
        data: {
          summary: [],
          total_revenue: 0,
          average_revenue: 0,
          period_type: periodType,
        },
      })
    }

    const revenueMap = new Map<string, { revenue: number; count: number }>()

    // Process bookings
    bookings?.forEach((booking) => {
      const bookingDate = new Date(booking.created_at)
      let periodKey: string

      if (periodType === 'daily') {
        periodKey = bookingDate.toISOString().split('T')[0]
      } else if (periodType === 'weekly') {
        const weekNumber = getWeekNumber(bookingDate)
        periodKey = `${bookingDate.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`
      } else if (periodType === 'monthly') {
        periodKey = `${bookingDate.getFullYear()}-${String(bookingDate.getMonth() + 1).padStart(2, '0')}`
      } else {
        periodKey = bookingDate.getFullYear().toString()
      }

      const current = revenueMap.get(periodKey) ?? { revenue: 0, count: 0 }
      current.revenue += booking.booking_amount
      current.count += 1
      revenueMap.set(periodKey, current)
    })

    // Calculate trends
    const revenueSummary: RevenueSummary[] = Array.from(revenueMap.entries())
      .filter(([period]) => {
        // Only include current period data in final summary
        const [periodYear, periodRest] = period.split('-')
        const yearMatch = parseInt(periodYear, 10) === year
        if (!month) return yearMatch
        return yearMatch && periodRest === String(month + 1).padStart(2, '0')
      })
      .map(([period, data]) => {
        let previousPeriod: string
        const [currentYear, currentRest] = period.split('-')

        if (periodType === 'daily') {
          const currentDate = new Date(period)
          const prevDate = new Date(currentDate)
          prevDate.setDate(currentDate.getDate() - 1)
          previousPeriod = prevDate.toISOString().split('T')[0]
        } else if (periodType === 'weekly') {
          const weekNum = parseInt(currentRest.substring(1), 10)
          const currentDate = new Date(parseInt(currentYear, 10), 0, 1)
          currentDate.setDate(currentDate.getDate() + (weekNum - 1) * 7)
          const prevDate = new Date(currentDate)
          prevDate.setDate(currentDate.getDate() - 7)
          const prevWeekNum = getWeekNumber(prevDate)
          previousPeriod = `${prevDate.getFullYear()}-W${String(prevWeekNum).padStart(2, '0')}`
        } else if (periodType === 'monthly') {
          const currentMonth = parseInt(currentRest, 10)
          const prevDate = new Date(parseInt(currentYear, 10), currentMonth - 2, 1)
          previousPeriod = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`
        } else {
          previousPeriod = (parseInt(currentYear, 10) - 1).toString()
        }

        const previousData = revenueMap.get(previousPeriod)
        let percentage = 0
        let trend: 'up' | 'down' | null = null

        if (previousData && previousData.revenue > 0) {
          const change = ((data.revenue - previousData.revenue) / previousData.revenue) * 100
          percentage = Math.abs(Math.round(change))
          trend = change >= 0 ? 'up' : 'down'
        }

        return {
          period,
          revenue: data.revenue,
          count: data.count,
          percentage,
          trend,
        }
      })

    revenueSummary.sort((a, b) => a.period.localeCompare(b.period))

    const totalRevenue = revenueSummary.reduce((sum, item) => sum + item.revenue, 0)
    const averageRevenue = revenueSummary.length > 0 ? totalRevenue / revenueSummary.length : 0

    return createApiResponse<RevenueAnalyticsResponse>({
      code: 200,
      message: 'Revenue analytics retrieved successfully',
      start_hrtime: startHrtime,
      data: {
        summary: revenueSummary,
        total_revenue: totalRevenue,
        average_revenue: averageRevenue,
        period_type: periodType,
      },
    })
  } catch (error) {
    console.error('Get revenue analytics error:', error)
    return createErrorResponse({
      code: 500,
      message: 'Internal server error',
      errors: [(error as Error).message],
    })
  }
}
