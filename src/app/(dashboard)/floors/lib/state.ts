import { queryKey } from './constants'

import { FloorListItem } from '@/types/floor'
import { createGlobalState } from '@/utils/createGlobalState'

export const floorDetailStore = createGlobalState<FloorListItem | null>({
  queryKey: [queryKey.FLOOR_DETAIL],
  initialData: null,
})
