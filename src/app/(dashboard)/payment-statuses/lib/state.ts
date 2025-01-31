import { queryKey } from './constants'

import { PaymentStatusListItem } from '@/app/api/payment-statuses/types'
import { createGlobalState } from '@/utils/createGlobalState'

export const paymentStatusDetailStore = createGlobalState<PaymentStatusListItem>({
  queryKey: [queryKey.PAYMENT_STATUS_DETAIL],
  initialData: null,
})
