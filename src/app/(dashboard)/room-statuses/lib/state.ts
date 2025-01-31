import { queryKey } from './constants'

import type { RoomStatusListItem } from '@/app/api/room-statuses/types'
import { createGlobalState } from '@/utils/createGlobalState'

export const roomStatusDetailStore = createGlobalState<RoomStatusListItem>({
  queryKey: [queryKey.RES_ROOM_STATUS_LIST],
  initialData: null,
})
