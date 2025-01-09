import { queryKey } from './constants'

import { FeatureListItem } from '@/types/feature'
import { createGlobalState } from '@/utils/createGlobalState'

export const featureDetailStore = createGlobalState<FeatureListItem | null>({
  queryKey: [queryKey.FEATURE_DETAIL],
  initialData: null,
})
