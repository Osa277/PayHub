export const SUPPORTED_CURRENCIES = [
  'USD',
  'EUR',
  'GBP',
  'JPY',
  'AUD',
  'CAD',
  'CHF',
  'CNY',
  'INR',
  'MXN',
  'SGD',
  'HKD',
]

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  AUD: 'A$',
  CAD: 'C$',
  CHF: 'CHF',
  CNY: '¥',
  INR: '₹',
  MXN: '$',
  SGD: 'S$',
  HKD: 'HK$',
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
  USERS: '/api/users',
  TRANSACTIONS: '/api/transactions',
  WALLETS: '/api/wallets',
  INVOICES: '/api/invoices',
  EXCHANGE_RATES: '/api/exchange-rates',
}
