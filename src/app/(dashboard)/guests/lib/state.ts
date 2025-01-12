import { queryKey } from './constants'

import { GuestListItem } from '@/types/guest'
import { createGlobalState } from '@/utils/createGlobalState'

export const guestDetailStore = createGlobalState<GuestListItem>({
  queryKey: [queryKey.GUEST_DETAIL],
  initialData: null,
})
