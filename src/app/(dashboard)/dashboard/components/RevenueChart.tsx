'use client'

import { useQuery } from '@tanstack/react-query'
import { Flex, Segmented, Spin } from 'antd'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import weekYear from 'dayjs/plugin/weekYear'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import * as echarts from 'echarts/core'
import { UniversalTransition } from 'echarts/features'
import { CanvasRenderer } from 'echarts/renderers'
import { ECBasicOption } from 'echarts/types/dist/shared'
import { useEffect, useRef, useState } from 'react'

import { queryKey } from '../lib/constants'
import { getRevenueAnalytics, RevenueAnalyticsParams } from '../services/get'

import { darkModeState } from '@/lib/state/darkMode'

type EChartsType = echarts.EChartsType
type FilterType = 'daily' | 'weekly' | 'monthly'

dayjs.extend(weekOfYear)
dayjs.extend(weekYear)
dayjs.extend(customParseFormat)

echarts.use([GridComponent, LineChart, CanvasRenderer, UniversalTransition, TooltipComponent])

const RevenueChart = () => {
  const [filterType, setFilterType] = useState<FilterType>('daily')
  const { data: isDarkMode } = darkModeState()

  const filterTypeMap: Record<string, FilterType> = {
    Daily: 'daily',
    Weekly: 'weekly',
    Monthly: 'monthly',
  }
  const filterTypeOptions = Object.keys(filterTypeMap)

  const revenueChartRef = useRef(null)
  let revenueChart: EChartsType | null = null

  const currentDate = dayjs()
  const currentMonth = currentDate.month() + 1
  const currentYear = currentDate.year()

  const revenueParams: RevenueAnalyticsParams = {
    period: filterType,
    month: filterType !== 'monthly' ? currentMonth : undefined,
    year: currentYear,
  }
  const {
    data: revenueResponse,
    isFetched: isRevenueFetched,
    isFetching: isRevenueFetching,
    refetch: refetchRevenue,
  } = useQuery({
    queryKey: [queryKey.RES_ANALYTICS_REVENUE, 'REVENUE_CHART'],
    queryFn: () => getRevenueAnalytics(revenueParams),
  })
  const { data: revenueData } = revenueResponse ?? {}
  const revenueSummary = revenueData?.summary ?? []
  const revenues = revenueSummary.map((item) => item.revenue)
  const revenueDates = revenueSummary.map((item) => {
    if (!item?.period) return ''

    if (/^\d{4}-\d{2}-\d{2}$/.test(item.period)) {
      return dayjs(item.period).format('MMM DD')
    }
    if (/^\d{4}-W\d{1,2}$/.test(item.period)) {
      const [year, weekPart] = item.period.split('-W')
      return dayjs().year(parseInt(year, 10)).week(parseInt(weekPart, 10)).startOf('week').format('MMM DD')
    }
    if (/^\d{4}-\d{2}$/.test(item.period)) {
      return dayjs(item.period).format('MMM')
    }

    return item.period
  })

  const chartOption: ECBasicOption = {
    series: [
      {
        data: revenues,
        type: 'line',
        smooth: true,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            {
              offset: 0,
              color: 'rgba(58,77,233,0.8)',
            },
            {
              offset: 1,
              color: 'rgba(58,77,233,0.3)',
            },
          ]),
        },
      },
    ],
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: revenueDates,
    },
    yAxis: {
      type: 'value',
    },
    grid: {
      top: 10,
      right: 20,
      bottom: 10,
      left: 10,
      containLabel: true,
    },
    backgroundColor: isDarkMode ? '#141414' : undefined,
    tooltip: {
      trigger: 'axis',
    },
  }

  useEffect(() => {
    if (revenueChartRef.current) {
      revenueChart = echarts.init(revenueChartRef.current, isDarkMode ? 'dark' : undefined)
      revenueChart.setOption(chartOption)
    }

    return () => {
      if (revenueChart) {
        revenueChart.dispose()
      }
    }
  }, [revenues.length, isDarkMode])

  useEffect(() => {
    if (!isRevenueFetched || isRevenueFetching) return
    refetchRevenue()
  }, [filterType])

  return (
    <Flex gap={16} vertical>
      <Flex gap={16} align="center" className="!ml-auto">
        {isRevenueFetching && <Spin />}
        <Segmented<string>
          options={filterTypeOptions}
          onChange={(value) => {
            setFilterType(filterTypeMap[value])
          }}
        />
      </Flex>
      <div className="rounded-lg overflow-hidden">
        <div ref={revenueChartRef} className="h-[300px]" />
      </div>
    </Flex>
  )
}

export default RevenueChart
