import { queryKey } from './constants'

import { AddonListItem } from '@/app/api/addons/types'
import { createGlobalState } from '@/utils/createGlobalState'

export const addonDetailStore = createGlobalState<AddonListItem>({
  queryKey: [queryKey.ADDON_DETAIL],
  initialData: null,
})
