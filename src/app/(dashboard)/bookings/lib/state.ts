import { queryKey } from './constants'

import { BookingListItem } from '@/types/booking'
import { createGlobalState } from '@/utils/createGlobalState'

export const bookingDetailStore = createGlobalState<BookingListItem>({
  queryKey: [queryKey.BOOKING_DETAIL],
  initialData: null,
})
