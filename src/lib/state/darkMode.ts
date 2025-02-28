import { queryKeyDarkMode } from '../constants'

import { createGlobalState } from '@/utils/createGlobalState'

export const darkModeState = createGlobalState<boolean>({
  queryKey: [queryKeyDarkMode],
  initialData: false,
})
