import { PresetColors } from 'antd/es/theme/interface/presetColors'
import { Redirect } from 'next/dist/lib/load-custom-routes'

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

export const tagColorOptions: { label: string; value: string }[] = PresetColors.map((color) => ({
  label: color,
  value: color,
}))
