export type RevenueSummary = {
  period: string
  revenue: number
  count: number
  percentage: number
  trend: 'up' | 'down' | null
}

export type RevenueAnalyticsResponse = {
  summary: RevenueSummary[]
  total_revenue: number
  average_revenue: number
  period_type: string
}
