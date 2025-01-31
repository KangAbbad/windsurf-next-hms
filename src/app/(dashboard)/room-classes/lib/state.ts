import { queryKey } from './constants'

import type { RoomClassListItem } from '@/app/api/room-classes/types'
import { createGlobalState } from '@/utils/createGlobalState'

export const roomClassDetailStore = createGlobalState<RoomClassListItem>({
  queryKey: [queryKey.ROOM_CLASS_DETAIL],
  initialData: null,
})
