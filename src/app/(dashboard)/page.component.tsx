'use client'

import { Card, Col, Flex, Row, Typography } from 'antd'
import { FaArrowTrendUp } from 'react-icons/fa6'

export default function HomePage() {
  return (
    <main className="p-4">
      <div className="bg-white p-4 rounded-lg">
        <Typography.Title level={2} className="font-semibold">
          Welcome back, Admin!
        </Typography.Title>
        <Row gutter={[16, 16]} className="mt-4">
          <Col xs={24} md={12} lg={8}>
            <Card classNames={{ body: 'overflow-hidden !p-0' }}>
              <Flex align="center" className="p-3">
                <div>
                  <Typography.Paragraph className="!mb-2">Revenue</Typography.Paragraph>
                  <Typography.Title level={3} className="!m-0">
                    Rp 850,000,000
                  </Typography.Title>
                </div>
                <Flex gap={16} align="center" className="rounded-md bg-green-50 py-1 px-3 ml-auto">
                  <FaArrowTrendUp className="text-lg text-green-500 font-semibold" />
                  <Typography.Paragraph className="!text-green-500 font-semibold !mb-0">20%</Typography.Paragraph>
                </Flex>
              </Flex>
              <div className="bg-gray-100 py-2 px-4 mt-1">
                <Typography.Paragraph className="!text-gray-500 !m-0">
                  From Jan 01, 2025 - Dec 01, 2025
                </Typography.Paragraph>
              </div>
            </Card>
          </Col>
          <Col xs={24} md={12} lg={8}>
            <Card classNames={{ body: 'overflow-hidden !p-0' }}>
              <Flex align="center" className="p-3">
                <div>
                  <Typography.Paragraph className="!mb-2">Guests</Typography.Paragraph>
                  <Typography.Title level={3} className="!m-0">
                    378
                  </Typography.Title>
                </div>
                <Flex gap={16} align="center" className="rounded-md bg-green-50 py-1 px-3 ml-auto">
                  <FaArrowTrendUp className="text-lg text-green-500 font-semibold" />
                  <Typography.Paragraph className="!text-green-500 font-semibold !mb-0">10%</Typography.Paragraph>
                </Flex>
              </Flex>
              <div className="bg-gray-100 py-2 px-4 mt-1">
                <Typography.Paragraph className="!text-gray-500 !m-0">
                  From Jan 01, 2025 - Dec 01, 2025
                </Typography.Paragraph>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </main>
  )
}
