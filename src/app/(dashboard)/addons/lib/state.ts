import { queryKey } from './constants'

import { AddonListItem } from '@/types/addon'
import { createGlobalState } from '@/utils/createGlobalState'

export const addonDetailStore = createGlobalState<AddonListItem>({
  queryKey: [queryKey.ADDON_DETAIL],
  initialData: null,
})
