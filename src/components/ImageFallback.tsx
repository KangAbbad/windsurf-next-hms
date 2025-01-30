'use client'

import Image, { ImageProps, StaticImageData } from 'next/image'
import { useEffect, useState } from 'react'

import EmptyPlaceholder from '@/assets/images/empty-placeholder.png'

interface StaticRequire {
  default: StaticImageData
}
type StaticImport = StaticRequire | StaticImageData
type ImageFallbackProps = {
  fallbackSrc?: string | StaticImport
} & ImageProps

export const ImageFallback = ({ src, fallbackSrc, alt, ...rest }: ImageFallbackProps) => {
  const [imgSrc, set_imgSrc] = useState(src)

  useEffect(() => {
    set_imgSrc(src)
  }, [src])

  return (
    <Image
      alt={alt || 'image'}
      src={imgSrc}
      onLoad={(event) => {
        if ((event.target as HTMLImageElement).naturalWidth === 0) {
          set_imgSrc(fallbackSrc ?? EmptyPlaceholder)
        }
      }}
      onError={() => {
        set_imgSrc(fallbackSrc ?? EmptyPlaceholder)
      }}
      {...rest}
    />
  )
}
