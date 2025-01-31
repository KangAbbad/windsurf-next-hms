import { queryKey } from './constants'

import { GuestListItem } from '@/app/api/guests/types'
import { createGlobalState } from '@/utils/createGlobalState'

export const guestDetailStore = createGlobalState<GuestListItem>({
  queryKey: [queryKey.GUEST_DETAIL],
  initialData: null,
})
