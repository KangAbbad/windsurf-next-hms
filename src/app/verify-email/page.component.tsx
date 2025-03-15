'use client'

import { Flex, Typography } from 'antd'
import Image from 'next/image'
import Link from 'next/link'

export default function VerifyEmailPage() {
  return (
    <Flex vertical align="center" justify="center" className="bg-ant-color-container !h-screen">
      <Image
        src="/v4-hotel-management-landscape-logo.png"
        alt="Hotel Logo"
        priority
        height={72}
        width={192}
        className="object-contain"
      />
      <Typography.Title level={3} className="!mt-6 !mb-3">
        Verify Your Email Address
      </Typography.Title>
      <Typography.Paragraph className="!mb-0">
        Your account cannot be used until your email address has been verified.
      </Typography.Paragraph>
      <Typography.Paragraph className="!mb-0">
        To verify your email address, please visit your email inbox.
      </Typography.Paragraph>
      <Flex vertical align="center" className="rounded-lg bg-green-50 dark:bg-green-900/30 py-8 px-12 my-10">
        <Typography.Title level={5}>Check your email</Typography.Title>
        <Typography.Paragraph className="!mb-0">
          We've sent you a magic link to sign in to your account
        </Typography.Paragraph>
      </Flex>
      <Flex gap={8} align="center">
        <Typography.Paragraph className="!mb-0">
          Already have an account? <Link href="/sign-in">Sign in now!</Link>
        </Typography.Paragraph>
      </Flex>
    </Flex>
  )
}
