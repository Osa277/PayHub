import { z } from 'zod'

export const signupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  phone: z.string().max(20).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  currency: z.enum(['NGN', 'USD', 'EUR', 'GBP', 'CAD']).default('NGN'), // Default to NGN for Paystack
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
})

export const paymentSchema = z.object({
  amount: z.number().positive('Amount must be greater than 0').max(100000),
  currency: z.string().min(1).max(10),
  cryptoCurrency: z.enum(['btc', 'eth', 'usdttrc20', 'usdcerc20'], {
    message: 'Unsupported cryptocurrency',
  }),
  recipientEmail: z.string().email().optional().nullable(),
  description: z.string().max(500).optional(),
})

export const transferSchema = z.object({
  recipientEmail: z.string().email('Valid recipient email is required'),
  amount: z.number().positive('Amount must be greater than 0').max(100000),
  description: z.string().max(500).optional(),
  currency: z.enum(['NGN', 'USD', 'EUR', 'GBP', 'CAD']).optional(),
})

export const topupSchema = z.object({
  amount: z.number().positive('Amount must be greater than 0').max(50000),
})

export const invoiceSchema = z.object({
  transactionId: z.string().min(1, 'Transaction ID is required'),
  amount: z.number().positive(),
  currency: z.string().min(1).max(10),
  items: z.array(z.object({
    description: z.string(),
    quantity: z.number().positive(),
    unitPrice: z.number().nonnegative(),
  })).min(1),
  dueDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
})

export const profileUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  avatar: z.string().url().max(500).optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  currency: z.string().max(10).optional(),
})

export const processPaymentSchema = z.object({
  transactionId: z.string().min(1, 'Transaction ID is required'),
})

export const transactionCreateSchema = z.object({
  type: z.enum(['payment', 'transfer', 'deposit', 'withdrawal']),
  amount: z.number().positive().max(100000),
  currency: z.string().min(1).max(10),
  description: z.string().max(500).optional(),
  recipientEmail: z.string().email().optional().nullable(),
})

export const bankAccountSchema = z.object({
  accountNumber: z.string().min(8, 'Account number must be at least 8 digits').max(20),
  bankCode: z.string().min(2, 'Bank code is required').max(10),
  bankName: z.string().min(1, 'Bank name is required').max(100),
  accountName: z.string().min(1, 'Account name is required').max(100),
})

export const withdrawalSchema = z.object({
  amount: z.number().positive('Amount must be greater than 0').max(100000),
  bankAccountId: z.string().min(1, 'Bank account is required'),
  description: z.string().max(500).optional(),
})
