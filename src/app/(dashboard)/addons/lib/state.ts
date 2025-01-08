import { AddonListItem } from '@/types/addon'
import { createGlobalState } from '@/utils/createGlobalState'

export const addonDetailStore = createGlobalState<AddonListItem>({
  queryKey: ['ADDON_DETAIL'],
  initialData: null,
})
