import { queryKey } from './constants'

import { PaymentStatusListItem } from '@/types/payment-status'
import { createGlobalState } from '@/utils/createGlobalState'

export const paymentStatusDetailStore = createGlobalState<PaymentStatusListItem>({
  queryKey: [queryKey.PAYMENT_STATUS_DETAIL],
  initialData: null,
})
