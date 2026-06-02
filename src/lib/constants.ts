export const SUPPORTED_CURRENCIES = ['NGN']

export const CURRENCY_SYMBOLS: Record<string, string> = {
  NGN: '₦',
}

export const TRANSACTION_TYPES = {
  PAYMENT: 'payment',
  TRANSFER: 'transfer',
  DEPOSIT: 'deposit',
  WITHDRAWAL: 'withdrawal',
}

export const TRANSACTION_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
}

export const API_ENDPOINTS = {
  PAYMENTS: '/api/payments',
  TRANSACTIONS: '/api/transactions',
}
