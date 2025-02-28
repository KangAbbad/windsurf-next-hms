'use server'

import { cookies } from 'next/headers'

import { themeCookiesName } from '@/lib/constants'

type ThemeOptionsType = 'dark' | 'light'

export async function getTheme(): Promise<ThemeOptionsType> {
  const theme = (await cookies()).get(themeCookiesName)
  return theme?.value as ThemeOptionsType
}

export async function setTheme(theme: ThemeOptionsType): Promise<void> {
  ;(await cookies()).set(themeCookiesName, theme)
}
