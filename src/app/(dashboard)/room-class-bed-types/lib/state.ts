import { queryKey } from './constants'

import { RoomClassBedTypeListItem } from '@/types/room-class-bed-type'
import { createGlobalState } from '@/utils/createGlobalState'

export const roomClassBedTypeDetailStore = createGlobalState<RoomClassBedTypeListItem | null>({
  queryKey: [queryKey.ROOM_CLASS_BED_TYPE_DETAIL],
  initialData: null,
})
