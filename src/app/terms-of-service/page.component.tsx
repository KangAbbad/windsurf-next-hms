'use client'

import { Typography, Divider, List, Card, Layout } from 'antd'
import dayjs from 'dayjs'

const { Title, Paragraph, Text } = Typography
const { Content } = Layout

export default function TermsOfServicePage() {
  const lastUpdateDate = dayjs('2025-03-15').format('YYYY/MM/DD')

  return (
    <Layout>
      <Content className="p-6 md:p-8 max-w-4xl mx-auto">
        <Card bordered={false} className="shadow-sm">
          <Typography>
            <Title level={1} className="text-center mb-6">
              Terms of Service
            </Title>
            <Paragraph>
              Welcome to our Hotel Management System. These Terms of Service govern your use of our website, services,
              and applications. By accessing or using our services, you agree to be bound by these Terms.
            </Paragraph>

            <Divider />

            <Title level={2}>1. Acceptance of Terms</Title>
            <Paragraph>
              By accessing or using our Hotel Management System, you acknowledge that you have read, understood, and
              agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our
              services.
            </Paragraph>

            <Title level={2}>2. Reservation and Booking</Title>
            <Paragraph>
              <Text strong>2.1 Booking Process:</Text> All reservations made through our system are subject to
              availability and confirmation. A booking is only confirmed after you receive a confirmation notice and,
              where applicable, after any required deposit or payment has been processed.
            </Paragraph>
            <Paragraph>
              <Text strong>2.2 Accurate Information:</Text> You agree to provide accurate, current, and complete
              information during the booking process. The hotel reserves the right to cancel or refuse any reservation
              if fraud or an unauthorized or illegal transaction is suspected.
            </Paragraph>
            <Paragraph>
              <Text strong>2.3 Rates and Charges:</Text> All rates displayed are per room per night unless otherwise
              specified. Rates are subject to change until a reservation is confirmed. Additional charges such as taxes,
              service fees, or resort fees may apply and will be disclosed prior to confirmation.
            </Paragraph>

            <Title level={2}>3. Cancellation and Modification Policy</Title>
            <Paragraph>
              <Text strong>3.1 Cancellation:</Text> Cancellation policies vary depending on the rate plan and room type.
              Please review the specific cancellation policy provided at the time of booking.
            </Paragraph>
            <Paragraph>
              <Text strong>3.2 Modification:</Text> Modifications to existing reservations are subject to availability
              and potential rate changes. Some reservations may not be modifiable after confirmation.
            </Paragraph>
            <Paragraph>
              <Text strong>3.3 No-Show:</Text> Failure to check in on the scheduled arrival date without prior notice
              may result in the cancellation of your entire reservation and applicable fees.
            </Paragraph>

            <Title level={2}>4. Check-in and Check-out</Title>
            <Paragraph>
              <Text strong>4.1 Check-in Time:</Text> Standard check-in time is 2:00 PM local time. Early check-in may be
              available upon request but cannot be guaranteed.
            </Paragraph>
            <Paragraph>
              <Text strong>4.2 Check-out Time:</Text> Standard check-out time is 12:00 PM local time. Late check-out may
              be available upon request and may incur additional charges.
            </Paragraph>
            <Paragraph>
              <Text strong>4.3 Identification:</Text> Valid government-issued photo identification is required at
              check-in.
            </Paragraph>

            <Title level={2}>5. User Accounts</Title>
            <Paragraph>
              <Text strong>5.1 Account Creation:</Text> You may be required to create an account to access certain
              features of our system. You are responsible for maintaining the confidentiality of your account
              credentials.
            </Paragraph>
            <Paragraph>
              <Text strong>5.2 Account Security:</Text> You are solely responsible for all activities that occur under
              your account. Notify us immediately of any unauthorized use of your account.
            </Paragraph>

            <Title level={2}>6. Prohibited Activities</Title>
            <Paragraph>You agree not to:</Paragraph>
            <List
              bordered
              dataSource={[
                'Use our system for any illegal purpose or in violation of any laws',
                'Interfere with or disrupt the operation of our system or servers',
                'Attempt to gain unauthorized access to any part of our system',
                'Use our system to transmit any viruses, malware, or other harmful code',
                'Impersonate any person or entity or falsely state your affiliation',
                'Collect or harvest any information from our system without authorization',
              ]}
              renderItem={(item) => <List.Item>{item}</List.Item>}
              className="mb-6"
            />

            <Title level={2}>7. Intellectual Property</Title>
            <Paragraph>
              All content, features, and functionality of our Hotel Management System, including but not limited to
              text, graphics, logos, icons, images, audio clips, and software, are the exclusive property of our company
              and are protected by copyright, trademark, and other intellectual property laws.
            </Paragraph>

            <Title level={2}>8. Limitation of Liability</Title>
            <Paragraph>
              To the maximum extent permitted by law, our company shall not be liable for any indirect, incidental,
              special, consequential, or punitive damages, including but not limited to loss of profits, data, use, or
              other intangible losses, resulting from your access to or use of our system.
            </Paragraph>

            <Title level={2}>9. Indemnification</Title>
            <Paragraph>
              You agree to indemnify, defend, and hold harmless our company and its officers, directors, employees,
              agents, and affiliates from and against any claims, liabilities, damages, losses, costs, expenses, or fees
              (including reasonable attorneys' fees) arising from your use of our system or violation of these Terms.
            </Paragraph>

            <Title level={2}>10. Modifications to Terms</Title>
            <Paragraph>
              We reserve the right to modify these Terms of Service at any time. Changes will be effective immediately
              upon posting on our website. Your continued use of our system after any changes constitutes your
              acceptance of the revised Terms.
            </Paragraph>

            <Title level={2}>11. Governing Law</Title>
            <Paragraph>
              These Terms shall be governed by and construed in accordance with the laws of Indonesia, without regard to
              its conflict of law provisions.
            </Paragraph>

            <Title level={2}>12. Contact Information</Title>
            <Paragraph>If you have any questions about these Terms of Service, please contact us at:</Paragraph>
            <Paragraph strong>
              Email: legal@hotelmanagementsystem.com
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
