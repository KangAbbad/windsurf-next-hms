import { queryKey } from './constants'

import { RoomClassFeatureListItem } from '@/types/room-class-feature'
import { createGlobalState } from '@/utils/createGlobalState'

export const roomClassFeatureDetailStore = createGlobalState<RoomClassFeatureListItem>({
  queryKey: [queryKey.ROOM_CLASS_FEATURE_DETAIL],
  initialData: null,
})
