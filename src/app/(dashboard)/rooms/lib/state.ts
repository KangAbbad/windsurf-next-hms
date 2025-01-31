import { queryKey } from './constants'

import { RoomListItem } from '@/app/api/rooms/types'
import { createGlobalState } from '@/utils/createGlobalState'

export const roomDetailStore = createGlobalState<RoomListItem>({
  queryKey: [queryKey.ROOM_DETAIL],
  initialData: null,
})
