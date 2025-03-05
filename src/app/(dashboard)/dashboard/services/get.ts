import { RevenueAnalyticsResponse } from '@/app/api/analytics/revenue/types'
import { ApiResponse } from '@/services/apiResponse'
import { axiosInstance } from '@/services/axiosInstance'

export type RevenueAnalyticsParams = {
  period?: 'daily' | 'weekly' | 'monthly' | 'annually'
  month?: number
  year?: number
}

export const getRevenueAnalytics = async (params: RevenueAnalyticsParams) => {
  const { data } = await axiosInstance.get<ApiResponse<RevenueAnalyticsResponse>>('/analytics/revenue', { params })
  return data
}
