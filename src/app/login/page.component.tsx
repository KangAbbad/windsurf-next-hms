'use client'

import { Button, Flex, Form, Input, Typography } from 'antd'
import Image from 'next/image'
import Link from 'next/link'
import { FcGoogle } from 'react-icons/fc'

type FormType = {
  email: string
  password: string
}

const LoginPage = () => {
  const [form] = Form.useForm<FormType>()

  const onSubmit = (values: FormType) => {
    console.log(values)
  }

  return (
    <Flex align="center" justify="center" className="h-screen">
      <Flex vertical gap={8} align="center" justify="center" className="border border-gray-200 rounded-xl w-[25vw] p-4">
        <Image
          src="/v3-hotel-management-landscape-logo.png"
          alt="Hotel Logo"
          priority
          height={192}
          width={192}
          className="object-contain"
        />
        <Form form={form} layout="vertical" className="w-full" onFinish={onSubmit}>
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
          <Button type="primary" block className="!py-4 mt-4" onClick={form.submit}>
            Login
          </Button>
        </Form>
        <Flex gap={16} align="center" className="w-full">
          <div className="border-t border-gray-300 flex-1" />
          <Typography.Paragraph className="!mb-0">or</Typography.Paragraph>
          <div className="border-t border-gray-300 flex-1" />
        </Flex>
        <Button type="default" block className="!h-10 !p-0" onClick={form.submit}>
          <FcGoogle className="text-xl" />
          <Typography.Text className="!self-center">Login with Google</Typography.Text>
        </Button>
        <Flex gap={4} align="center" className="mt-2">
          <Typography.Text>Don't have an account?</Typography.Text>
          <Link href="/register" className="text-sm mb-[1px]">
            Register now!
          </Link>
        </Flex>
      </Flex>
    </Flex>
  )
}

export default LoginPage
