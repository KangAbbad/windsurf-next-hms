'use client'

import { Button } from 'antd'
import { ItemType } from 'antd/es/breadcrumb/Breadcrumb'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CSSProperties } from 'react'
import { FaHome } from 'react-icons/fa'

import { parentRoutesException } from '@/lib/constants'
import { urlPathnameToStringSlash } from '@/utils/urlPathnameCodec'

export const toPascalCase = (text: string) => {
  return text.replace(/\w+/g, (w) => {
    return w[0].toUpperCase() + w.slice(1).toLowerCase()
  })
}

const pathStyles: CSSProperties = {
  height: 'auto',
  lineHeight: 1,
  padding: 0,
}

const homepageIconStyles: CSSProperties = {
  display: 'flex',
  marginTop: '3px',
}

const HomepageLink = () => {
  return (
    <Link href="/" aria-label="Home">
      <div style={homepageIconStyles}>
        <FaHome />
      </div>
    </Link>
  )
}

type LinkProps = {
  href: string
  path: string
}

const LinkItem = ({ href, path }: LinkProps) => {
  return <Link href={href}>{path}</Link>
}

const LinkItemBtn = ({ href, path }: LinkProps) => {
  return (
    <Link href={href}>
      <Button type="link" style={pathStyles}>
        {path}
      </Button>
    </Link>
  )
}

export const useBreadcrumbs = () => {
  const pathname = usePathname()
  const removeParams = pathname.replace(/\?g/, '/')
  const removeEquals = removeParams.replace(/=/g, '/')
  // const pathToPascalCase = toPascalCase(removeEquals)
  // const routes = pathToPascalCase.split('/')
  const routes = removeEquals.split('/')
  const filterRoutes = routes.every((route) => !route) ? [] : routes
  const breadcrumbs: ItemType[] = filterRoutes.map((path, pathIndex) => {
    const decodedPath = urlPathnameToStringSlash(decodeURI(path))
    const href = routes.slice(0, pathIndex + 1).join('/') || '/'
    const latestLinkIndex = pathIndex === routes.length - 1
    if (decodedPath) {
      const findRouteException = parentRoutesException.find((route) => route.source.includes(decodedPath))
      if (findRouteException) return { title: <LinkItem href={findRouteException.destination} path={decodedPath} /> }
      if (latestLinkIndex) return { title: <LinkItemBtn href={href} path={decodedPath} /> }
      return { title: <LinkItem href={href} path={path} /> }
    }
    return { title: <HomepageLink /> }
  })

  return breadcrumbs
}
