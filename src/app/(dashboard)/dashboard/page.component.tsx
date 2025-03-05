'use client'

import { useQuery } from '@tanstack/react-query'
import { Col, Row, theme, Typography } from 'antd'
import dayjs from 'dayjs'

import AnalyticsCard from './components/AnalyticsCard'
import { queryKey } from './lib/constants'
import { getRevenueAnalytics, RevenueAnalyticsParams } from './services/get'

export default function HomePage() {
  const { token } = theme.useToken()
  const { colorBgContainer } = token

  const currentDate = dayjs()
  const currentMonth = currentDate.month() + 1
  const currentYear = currentDate.year()

  const dailyRevenueParams: RevenueAnalyticsParams = {
    period: 'daily',
    month: currentMonth,
    year: currentYear,
  }
  const { data: dailyRevenueResponse, isFetching: isDailyRevenueFetching } = useQuery({
    queryKey: [queryKey.RES_ANALYTICS_REVENUE, dailyRevenueParams],
    queryFn: () => getRevenueAnalytics(dailyRevenueParams),
  })
  const { data: dailyRevenueData } = dailyRevenueResponse ?? {}
  const dailyRevenueSummary = dailyRevenueData?.summary ?? []
  const todayRevenue = dailyRevenueSummary.find((item) => {
    const date = dayjs(item.period)
    const isToday = date.isSame(currentDate, 'day')
    return isToday
  })

  const monthlyRevenueParams: RevenueAnalyticsParams = {
    period: 'monthly',
    month: currentMonth,
    year: currentYear,
  }
  const { data: monthlyRevenueResponse, isFetching: isMonthlyRevenueFetching } = useQuery({
    queryKey: [queryKey.RES_ANALYTICS_REVENUE, monthlyRevenueParams],
    queryFn: () => getRevenueAnalytics(monthlyRevenueParams),
  })
  const { data: monthlyRevenueData } = monthlyRevenueResponse ?? {}
  const monthlyRevenueSummary = monthlyRevenueData?.summary ?? []
  const monthlyRevenue = monthlyRevenueSummary.find((item) => {
    const date = dayjs(item.period)
    const isCurrentMonth = date.month() === currentMonth - 1
    return isCurrentMonth
  })

  const annuallyRevenueParams: RevenueAnalyticsParams = {
    period: 'annually',
    year: currentYear,
  }
  const { data: annuallyRevenueResponse, isFetching: isAnnuallyRevenueFetching } = useQuery({
    queryKey: [queryKey.RES_ANALYTICS_REVENUE, annuallyRevenueParams],
    queryFn: () => getRevenueAnalytics(annuallyRevenueParams),
  })
  const { data: annuallyRevenueData } = annuallyRevenueResponse ?? {}
  const annuallyRevenueSummary = annuallyRevenueData?.summary ?? []
  const annuallyRevenue = annuallyRevenueSummary.find((item) => {
    const date = dayjs(item.period)
    const isCurrentYear = date.year() === currentYear
    return isCurrentYear
  })

  return (
    <main className="p-4">
      <div className="p-4 rounded-lg" style={{ backgroundColor: colorBgContainer }}>
        <Typography.Title level={2} className="font-semibold">
          Welcome back, Admin!
        </Typography.Title>
        <Row gutter={[16, 16]} className="mt-4">
          <Col xs={24} md={12} lg={8}>
            <AnalyticsCard
              isLoading={isDailyRevenueFetching}
              title="Today Revenue"
              amount={todayRevenue?.revenue ?? 0}
              trend={todayRevenue?.trend ?? undefined}
              percentage={todayRevenue?.percentage}
              dateRange={currentDate.format('MMM DD, YYYY')}
            />
          </Col>
          <Col xs={24} md={12} lg={8}>
            <AnalyticsCard
              isLoading={isMonthlyRevenueFetching}
              title="Monthly Revenue"
              amount={monthlyRevenue?.revenue ?? 0}
              trend={monthlyRevenue?.trend ?? undefined}
              percentage={monthlyRevenue?.percentage}
              dateRange={`${currentDate.startOf('month').format('MMM DD')}, ${currentDate.format('YYYY')} - ${currentDate.endOf('month').format('MMM DD')}, ${currentDate.format('YYYY')}`}
            />
          </Col>
          <Col xs={24} md={12} lg={8}>
            <AnalyticsCard
              isLoading={isAnnuallyRevenueFetching}
              title="Annually Revenue"
              amount={annuallyRevenue?.revenue ?? 0}
              trend={annuallyRevenue?.trend ?? undefined}
              percentage={annuallyRevenue?.percentage}
              dateRange={`${currentDate.startOf('year').format('MMM DD')}, ${currentDate.format('YYYY')} - ${currentDate.endOf('year').format('MMM DD')}, ${currentDate.format('YYYY')}`}
            />
          </Col>
        </Row>
      </div>
    </main>
  )
}
