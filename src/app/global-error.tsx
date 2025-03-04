'use client'

import { Button, Result } from 'antd'

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex items-center justify-center h-screen">
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
    </div>
  )
}
