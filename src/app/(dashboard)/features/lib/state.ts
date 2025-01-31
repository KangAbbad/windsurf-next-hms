import { queryKey } from './constants'

import { FeatureListItem } from '@/app/api/features/types'
import { createGlobalState } from '@/utils/createGlobalState'

export const featureDetailStore = createGlobalState<FeatureListItem | null>({
  queryKey: [queryKey.FEATURE_DETAIL],
  initialData: null,
})
