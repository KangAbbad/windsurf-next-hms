import { queryKey } from './constants'

import { BedTypeListItem } from '@/app/api/bed-types/types'
import { createGlobalState } from '@/utils/createGlobalState'

export const bedTypeDetailStore = createGlobalState<BedTypeListItem>({
  queryKey: [queryKey.BED_TYPE_DETAIL],
  initialData: null,
})
