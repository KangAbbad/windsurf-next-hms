'use client'

import { useSignIn } from '@clerk/nextjs'
import { isClerkAPIResponseError } from '@clerk/nextjs/errors'
import { Button, Flex, Form, Input, Typography } from 'antd'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

import GoogleSignInButton from '../components/GoogleSignInButton'

import { useAntdContextHolder } from '@/lib/context/AntdContextHolder'

type FormType = {
  email: string
  password: string
}

export default function SignInPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const signUpUrl = `/sign-up${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
  const { antdMessage } = useAntdContextHolder()
  const [isSignInLoading, setSignInLoading] = useState<boolean>(false)
  const { isLoaded: isSignInLoaded, signIn, setActive } = useSignIn()
  const [form] = Form.useForm<FormType>()

  const onSubmit = async (values: FormType) => {
    if (!isSignInLoaded || isSignInLoading) return
    setSignInLoading(true)

    try {
      const signInAttempt = await signIn.create({
        identifier: values.email,
        password: values.password,
      })

      setSignInLoading(false)

      await setActive({ session: signInAttempt.createdSessionId })
      router.push('/')
    } catch (err) {
      setSignInLoading(false)
      if (isClerkAPIResponseError(err)) {
        const errorMessage = err.errors?.[0].message
        antdMessage?.error(errorMessage)
      }
    }
  }

  return (
    <Flex align="center" justify="center" className="bg-ant-color-container h-screen">
      <Flex vertical gap={8} align="center" justify="center" className="rounded-xl w-[35vw] p-4">
        <Image
          src="/v3-hotel-management-landscape-logo.png"
          alt="Hotel Logo"
          priority
          height={72}
          width={192}
          className="object-contain"
        />
        <Form form={form} layout="vertical" className="w-full !mt-2" onFinish={onSubmit}>
          <Form.Item<FormType>
            name="email"
            label="Email or Username"
            rules={[
              { required: true, message: 'Please enter email or username' },
              {
                validator: (_, value) => {
                  if (!value || value.trim() === '') return Promise.resolve()

                  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
                  const isUsername = /^[a-zA-Z0-9_-]+$/.test(value)

                  if (isEmail || isUsername) return Promise.resolve()
                  return Promise.reject(new Error('Please enter a valid email or username'))
                },
              },
            ]}
            className="!mb-3"
          >
            <Input size="large" placeholder="Enter email or username" className="!text-sm" />
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
            loading={isSignInLoading}
            htmlType="submit"
            className="!h-auto !py-3 mt-4"
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
          <Typography.Text>Don't have an account?</Typography.Text>
          <Link href={signUpUrl} className="text-sm mb-[1px]">
            Sign up now!
          </Link>
        </Flex>
      </Flex>
    </Flex>
  )
}
