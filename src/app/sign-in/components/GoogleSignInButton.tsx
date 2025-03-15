'use client'

import { useSignIn } from '@clerk/nextjs'
import { isClerkAPIResponseError } from '@clerk/nextjs/errors'
import { Button, Typography } from 'antd'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { FcGoogle } from 'react-icons/fc'

import { useAntdContextHolder } from '@/lib/context/AntdContextHolder'

const GoogleSignInButton = () => {
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get('redirect_url')
  const { antdMessage } = useAntdContextHolder()
  const [isGoogleSignInLoading, setGoogleSignInLoading] = useState<boolean>(false)
  const { isLoaded: isSignInLoaded, signIn } = useSignIn()

  const onSubmit = () => {
    if (!isSignInLoaded || isGoogleSignInLoading) return
    setGoogleSignInLoading(true)
    return signIn
      .authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sign-in/sso-callback',
        redirectUrlComplete: redirectUrl ?? '/',
      })
      .then((res) => {
        console.log({ res })
        setGoogleSignInLoading(false)
      })
      .catch((err) => {
        setGoogleSignInLoading(false)
        if (isClerkAPIResponseError(err)) {
          const errorMessage = err.errors?.[0].message
          antdMessage?.error(errorMessage)
        }
      })
  }

  return (
    <Button
      type="text"
      block
      loading={isGoogleSignInLoading}
      className="border !border-gray-300 dark:!border-neutral-700 !h-12 !p-0"
      onClick={onSubmit}
    >
      <FcGoogle className="text-xl" />
      <Typography.Text className="!self-center">Continue with Google</Typography.Text>
    </Button>
  )
}

export default GoogleSignInButton
