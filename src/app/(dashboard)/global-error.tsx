'use client'

import { Button, Result } from 'antd'

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Result
      status="500"
      title="500"
      subTitle="Sorry, something went wrong."
      extra={
        <Button type="primary" onClick={reset}>
          Back Home
        </Button>
      }
    />
  )
}
