'use client'

import { useRouter } from '@bprogress/next'
import { useSignUp } from '@clerk/nextjs'
import { isClerkAPIResponseError } from '@clerk/nextjs/errors'
import { Button, Flex, Form, Input, message, Typography } from 'antd'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'

import GoogleSignInButton from '@/app/sign-in/components/GoogleSignInButton'

type FormType = {
  username: string
  email: string
  password: string
}

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const signInUrl = `/sign-in${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
  const [messageApi, messageContextHolder] = message.useMessage()
  const [isSignUpLoading, setSignUpLoading] = useState<boolean>(false)
  const [form] = Form.useForm<FormType>()

  const { isLoaded: isSignInLoaded, signUp } = useSignUp()

  const onSubmit = async (values: FormType) => {
    if (!isSignInLoaded || isSignUpLoading) return
    setSignUpLoading(true)

    try {
      await signUp.create({
        username: values.username,
        emailAddress: values.email,
        password: values.password,
      })
      await signUp.prepareEmailAddressVerification({
        strategy: 'email_link',
        redirectUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL ?? '',
      })

      setSignUpLoading(false)
      router.push('/verify-email')
    } catch (err: any) {
      setSignUpLoading(false)
      if (isClerkAPIResponseError(err)) {
        const errorMessage = err.errors?.[0].message
        messageApi.error(errorMessage)
      }
    }
  }

  return (
    <>
      {messageContextHolder}
      <Flex align="center" justify="center" className="bg-ant-color-container h-screen">
        <Flex vertical gap={8} align="center" justify="center" className="rounded-xl w-[35vw] p-4">
          <Image
            src="/v4-hotel-management-landscape-logo.png"
            alt="Hotel Logo"
            priority
            height={72}
            width={192}
            className="object-contain"
          />
          <Form form={form} layout="vertical" className="w-full !mt-2" onFinish={onSubmit}>
            <Form.Item<FormType>
              name="username"
              label="Username"
              rules={[{ required: true, message: 'Please enter username' }]}
              className="!mb-3"
            >
              <Input size="large" placeholder="Enter username" className="!text-sm" />
            </Form.Item>
            <Form.Item<FormType>
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Please enter email' },
                {
                  type: 'email',
                  message: 'Please enter a valid email address',
                },
              ]}
              className="!mb-3"
            >
              <Input size="large" placeholder="Enter email" className="!text-sm" />
            </Form.Item>
            <Form.Item<FormType>
              name="password"
              label="Password"
              rules={[{ required: true, message: 'Please enter password' }]}
              className="!mb-3"
            >
              <Input.Password size="large" placeholder="Enter password" className="!text-sm" />
            </Form.Item>
            <Button
              type="primary"
              block
              loading={isSignUpLoading}
              htmlType="submit"
              className="!h-auto !py-2 mt-4"
              onClick={form.submit}
            >
              Continue with email
            </Button>
          </Form>
          <Flex gap={16} align="center" className="w-full">
            <div className="border-t border-gray-300 dark:border-neutral-700 flex-1" />
            <Typography.Paragraph className="!mb-0">or</Typography.Paragraph>
            <div className="border-t border-gray-300 dark:border-neutral-700 flex-1" />
          </Flex>
          <GoogleSignInButton />
          <Flex gap={4} align="center" className="mt-2">
            <Typography.Text>Already have an account?</Typography.Text>
            <Link href={signInUrl} className="text-sm mb-[1px]">
              Sign in now!
            </Link>
          </Flex>
        </Flex>
      </Flex>
    </>
  )
}
