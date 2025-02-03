export const queryKey = {
  RES_PAYMENT_STATUS_LIST: 'RES_PAYMENT_STATUS_LIST',
  PAYMENT_STATUS_DETAIL: 'PAYMENT_STATUS_DETAIL',
}

export const paymentStatusTagColor: { [key: string]: string } = {
  PENDING: 'orange',
  PAID: 'green',
  REFUNDED: 'blue',
  CANCELED: 'red',
}
