export interface User {
  id: string
  email: string
  name: string
  phone?: string
  country?: string
  walletBalance: number
  currency: string
  avatar?: string
  isVerified: boolean
  createdAt: Date
  updatedAt: Date
}

export interface AuthCredentials {
  email: string
  password: string
}

export interface SignupData {
  name: string
  email: string
  password: string
  confirmPassword: string
  phone?: string
  country?: string
  acceptTerms: boolean
}

export interface AuthResponse {
  user: User
  token: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

export interface PaymentMethod {
  id: string
  userId: string
  type: 'crypto'
  cryptoCurrency?: 'BTC' | 'ETH' | 'USDT' | 'USDC'
  walletAddress?: string
  isDefault: boolean
  createdAt: Date
}

export interface Transaction {
  id: string
  userId: string
  type: 'payment' | 'transfer' | 'deposit' | 'withdrawal'
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed'
  description: string
  fee?: number
  paymentMethodId?: string
  recipientId?: string
  recipientEmail?: string
  recipientName?: string
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface Invoice {
  id: string
  userId: string
  transactionId: string
  amount: number
  currency: string
  status: 'draft' | 'sent' | 'paid' | 'overdue'
  items: InvoiceItem[]
  dueDate: Date
  createdAt: Date
  updatedAt: Date
}

export interface InvoiceItem {
  description: string
  quantity: number
  unitPrice: number
  total: number
}

export interface Wallet {
  id: string
  userId: string
  balance: number
  currency: string
  transactions: Transaction[]
  createdAt: Date
  updatedAt: Date
}

export interface PaymentSession {
  sessionId: string
  userId: string
  amount: number
  currency: string
  paymentProvider: 'crypto'
  cryptoCurrency?: 'BTC' | 'ETH' | 'USDT' | 'USDC'
  walletAddress?: string
  cryptoAmount?: number
  exchangeRate?: number
  txHash?: string
  status: 'pending' | 'awaiting_payment' | 'confirming' | 'completed' | 'failed' | 'cancelled' | 'expired'
  expiresAt: Date
}

export interface ExchangeRate {
  from: string
  to: string
  rate: number
  timestamp: Date
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}
