import { queryKey } from './constants'

import type { RoomStatusListItem } from '@/types/room-status'
import { createGlobalState } from '@/utils/createGlobalState'

export const roomStatusDetailStore = createGlobalState<RoomStatusListItem>({
  queryKey: [queryKey.RES_ROOM_STATUS_LIST],
  initialData: null,
})
