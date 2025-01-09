import { queryKey } from './constants'

import { BedTypeListItem } from '@/types/bedType'
import { createGlobalState } from '@/utils/createGlobalState'

export const bedTypeDetailStore = createGlobalState<BedTypeListItem>({
  queryKey: [queryKey.BED_TYPE_DETAIL],
  initialData: null,
})
