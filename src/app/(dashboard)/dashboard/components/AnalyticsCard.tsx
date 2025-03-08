'use client'

import { Card, Flex, Spin, Typography } from 'antd'
import CountUp from 'react-countup'
import { FaArrowTrendDown, FaArrowTrendUp } from 'react-icons/fa6'

type Props = {
  isLoading?: boolean
  title: string
  amount: number
  dateRange: string
  trend?: 'up' | 'down'
  percentage?: number
}

const AnalyticsCard = (props: Props) => {
  const { isLoading, title, amount, dateRange, trend, percentage = 0 } = props
  const isTrendUp = trend === 'up'
  const isTrendDown = trend === 'down'

  return (
    <Card classNames={{ body: 'overflow !p-0' }}>
      <Flex align="center" justify="space-between" className="p-3">
        <div>
          <Typography.Paragraph className="!mb-2">{title}</Typography.Paragraph>
          <CountUp prefix="Rp " separator="." decimal="," start={0} end={amount} className="font-semibold text-2xl" />
        </div>
        {isLoading && (
          <div className="pr-2">
            <Spin />
          </div>
        )}
        {!isLoading && percentage > 0 && (
          <Flex
            gap={16}
            align="center"
            className={
              isTrendUp
                ? 'rounded-md bg-green-50 dark:bg-green-900/30 py-1 px-2 ml-auto'
                : isTrendDown
                  ? 'rounded-md bg-red-50 dark:bg-red-900/30 py-1 px-2 ml-auto'
                  : 'rounded-md py-1 px-3 ml-auto'
            }
          >
            {isTrendUp && <FaArrowTrendUp className="text-lg text-green-500 font-semibold" />}
            {isTrendDown && <FaArrowTrendDown className="text-lg text-red-500 font-semibold" />}
            <Typography.Paragraph
              className={
                isTrendUp
                  ? '!text-green-500 font-semibold !mb-0'
                  : isTrendDown
                    ? '!text-red-500 font-semibold !mb-0'
                    : 'font-semibold !mb-0'
              }
            >
              {percentage}%
            </Typography.Paragraph>
          </Flex>
        )}
      </Flex>
      <div className="bg-ant-color-border-secondary py-2 px-4 mt-1">
        <Typography.Paragraph className="text-black/65 dark:text-white/65 !m-0">{dateRange}</Typography.Paragraph>
      </div>
    </Card>
  )
}

export default AnalyticsCard
