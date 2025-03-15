'use client'

import { Typography, Divider, List, Card, Layout } from 'antd'
import dayjs from 'dayjs'
import Image from 'next/image'

const { Title, Paragraph } = Typography
const { Content } = Layout

export default function PrivacyPolicyPage() {
  const lastUpdateDate = dayjs('2025-03-15').format('YYYY/MM/DD')

  return (
    <Layout>
      <Content className="p-6 md:p-8 max-w-4xl mx-auto">
        <Card bordered={false} className="shadow-sm">
          <Image
            src="/v3-hotel-management-landscape-logo.png"
            alt="Hotel Logo"
            priority
            height={72}
            width={192}
            className="object-contain mx-auto mb-6"
          />
          <Typography>
            <Title level={1} className="text-center mb-6">
              Privacy Policy
            </Title>
            <Paragraph>
              This privacy policy describes how your personal information is collected, used, and shared when you visit
              or make a booking through our hotel management system.
            </Paragraph>

            <Divider />

            <Title level={2}>Personal Information We Collect</Title>
            <Paragraph>
              When you use our hotel management system, we collect the following personal information:
            </Paragraph>
            <List
              bordered
              dataSource={[
                'Full name and title',
                'Contact information (email address, phone number)',
                'Address and country of residence',
                'Payment information and billing details',
                'Identification documents (passport/ID for check-in)',
                'Stay preferences and special requests',
                'Booking history and accommodation details',
                'Feedback and reviews you provide',
              ]}
              renderItem={(item) => <List.Item>{item}</List.Item>}
              className="mb-6"
            />

            <Title level={2}>How We Use Your Personal Information</Title>
            <Paragraph>We use your personal information to:</Paragraph>
            <List
              bordered
              dataSource={[
                'Process and manage your hotel reservations',
                'Provide personalized accommodation services',
                'Process payments and handle billing',
                'Communicate with you about your booking',
                'Comply with legal requirements for guest registration',
                'Improve our services and guest experience',
                'Send you relevant updates about our services (with your consent)',
                'Protect the security of our guests and property',
              ]}
              renderItem={(item) => <List.Item>{item}</List.Item>}
              className="mb-6"
            />

            <Title level={2}>How We Share Your Personal Information</Title>
            <Paragraph>
              We do not sell, trade, or rent your personal information to third parties. However, we may share your
              information with:
            </Paragraph>
            <List
              bordered
              dataSource={[
                'Service providers who help us operate our hotel (payment processors, IT services)',
                'Legal authorities when required by law',
                'Affiliated properties if you transfer your booking',
                'Third-party services you explicitly request (e.g., airport transfers)',
              ]}
              renderItem={(item) => <List.Item>{item}</List.Item>}
              className="mb-6"
            />

            <Title level={2}>Data Security</Title>
            <Paragraph>
              We implement appropriate security measures to protect your personal information against unauthorized
              access, alteration, disclosure, or destruction. All payment information is encrypted using
              industry-standard protocols.
            </Paragraph>

            <Title level={2}>Your Rights</Title>
            <Paragraph>Depending on your location, you may have rights to:</Paragraph>
            <List
              bordered
              dataSource={[
                'Access the personal information we hold about you',
                'Correct inaccurate or incomplete information',
                'Request deletion of your personal information',
                'Object to certain processing of your data',
                'Request a copy of your data in a portable format',
                'Withdraw consent where processing is based on consent',
              ]}
              renderItem={(item) => <List.Item>{item}</List.Item>}
              className="mb-6"
            />

            <Title level={2}>Cookies and Tracking</Title>
            <Paragraph>
              Our website uses cookies and similar technologies to enhance your browsing experience, analyze usage
              patterns, and deliver personalized content. You can control cookie settings through your browser
              preferences.
            </Paragraph>

            <Title level={2}>Changes to This Policy</Title>
            <Paragraph>
              We may update this privacy policy from time to time to reflect changes in our practices or legal
              requirements. We will notify you of any significant changes by posting the new policy on this page.
            </Paragraph>

            <Title level={2}>Contact Us</Title>
            <Paragraph>
              If you have any questions about this privacy policy or our data practices, please contact us at:
            </Paragraph>
            <Paragraph strong>
              Email: privacy@hotelmanagementsystem.com
              <br />
              Phone: +6282109876543
              <br />
              Address: Puno Street, Trono, Probolinggo, Indonesia
            </Paragraph>

            <Divider />

            <Paragraph type="secondary" className="text-center">
              Last updated: {lastUpdateDate}
            </Paragraph>
          </Typography>
        </Card>
      </Content>
    </Layout>
  )
}
