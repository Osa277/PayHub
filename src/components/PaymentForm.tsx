'use client'
import React from 'react'
import { SUPPORTED_CURRENCIES } from '@/lib/constants'

interface PaymentFormProps {
  onSubmit: (data: PaymentFormData) => Promise<void>
  isLoading?: boolean
}

export interface PaymentFormData {
  amount: number
  currency: string
  paymentProvider: string
  recipientEmail?: string
  description?: string
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  onSubmit,
  isLoading = false,
}: PaymentFormProps) => {
  const [formData, setFormData] = React.useState<PaymentFormData>({
    amount: 0,
    currency: 'USD',
    paymentProvider: 'paystack',
    recipientEmail: '',
    description: '',
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ): void => {
    const { name, value } = e.target
    setFormData((prev: PaymentFormData) => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    await onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
      <h2 className="text-2xl font-bold text-gray-900">Make a Payment</h2>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Amount</label>
        <input
          type="number"
          name="amount"
          value={formData.amount}
          onChange={handleChange}
          step="0.01"
          min="0"
          required
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
          placeholder="Enter amount"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Currency</label>
        <select
          name="currency"
          value={formData.currency}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
        >
          {SUPPORTED_CURRENCIES.map((currency) => (
            <option key={currency} value={currency}>
              {currency}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Recipient Email</label>
        <input
          type="email"
          name="recipientEmail"
          value={formData.recipientEmail}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
          placeholder="recipient@example.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <input
          type="text"
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
          placeholder="Payment description"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading || formData.amount <= 0}
        className="w-full bg-blue-900 text-white font-medium py-2 px-4 rounded-md hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Processing...' : 'Continue to Payment'}
      </button>

      <p className="text-sm text-gray-500 text-center">Crypto payments have been deprecated. This form now uses Paystack for all transactions.</p>
    </form>
  )
}
