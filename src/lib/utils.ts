import { CURRENCY_SYMBOLS } from './constants'

export const formatCurrency = (
  amount: number,
  currency: string = 'USD'
): string => {
  const symbol = CURRENCY_SYMBOLS[currency] || currency
  return `${symbol} ${amount.toFixed(2)}`
}

export const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export const formatTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const truncateEmail = (email: string): string => {
  const [name, domain] = email.split('@')
  const truncated = name.substring(0, 3) + '***'
  return `${truncated}@${domain}`
}

export const generateTransactionId = (): string => {
  return `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const formatPhoneNumber = (phone: string): string => {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  return phone
}
