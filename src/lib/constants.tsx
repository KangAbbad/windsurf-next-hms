import { Tag } from 'antd'
import { PresetColors } from 'antd/es/theme/interface/presetColors'
import { Redirect } from 'next/dist/lib/load-custom-routes'
import { ReactNode } from 'react'

export const supabaseConfig = {
  url: process.env.SUPABASE_URL ?? '',
  anonKey: process.env.SUPABASE_ANON_KEY ?? '',
}

export const queryKeyUpload = {
  UPLOAD_IMAGE: 'UPLOAD_IMAGE',
}

export const parentRoutesException: Redirect[] = [
  {
    source: '/stocks',
    destination: '/stocks/manage',
    permanent: true,
  },
  {
    source: '/products',
    destination: '/products/manage',
    permanent: true,
  },
]

export const tagColorOptions: { label: ReactNode; value: ReactNode }[] = PresetColors.map((color) => ({
  label: (
    <Tag color={color ?? 'default'} className="capitalize">
      {color}
    </Tag>
  ),
  value: color,
}))

export const queryKeyDarkMode: string = 'IS_DARK_MODE'
export const themeCookiesName: string = 'theme'
