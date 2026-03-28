'use client'
import React, { useState, useEffect } from 'react'
import { SUPPORTED_CURRENCIES } from '@/lib/constants'
import { SUPPORTED_CRYPTOS, convertUsdToCrypto, formatCryptoAmount, type CryptoId } from '@/lib/crypto-payment'
import { useFormTracker, useTransactionTracker } from '@/lib/tracking-hooks'

interface PaymentFormProps {
  onSubmit: (data: PaymentFormData) => Promise<void>
  isLoading?: boolean
}

export interface PaymentFormData {
  amount: number
  currency: string
  paymentProvider: string
  cryptoCurrency: string
  recipientEmail?: string
  description?: string
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  onSubmit,
  isLoading = false,
}: PaymentFormProps) => {
  const trackForm = useFormTracker()
  const trackTxn = useTransactionTracker()
  
  const [formData, setFormData] = useState<PaymentFormData>({
    amount: 0,
    currency: 'USD',
    paymentProvider: 'crypto',
    cryptoCurrency: 'btc',
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
    
    const txnId = crypto.randomUUID()
    trackForm('PaymentForm', {
      amount: formData.amount,
      currency: formData.currency,
      cryptoCurrency: formData.cryptoCurrency,
      recipientEmail: formData.recipientEmail,
    })
    
    trackTxn('payment', {
      amount: formData.amount,
      currency: formData.currency,
      recipient: formData.recipientEmail,
      status: 'initiated',
      transactionId: txnId,
    })
    
    await onSubmit(formData)
  }

  // Live crypto conversion preview
  const [conversion, setConversion] = useState<{ cryptoAmount: number; rate: number } | null>(null)
  useEffect(() => {
    if (formData.amount > 0) {
      convertUsdToCrypto(formData.amount, formData.cryptoCurrency as CryptoId)
        .then(setConversion)
        .catch(() => setConversion(null))
    } else {
      setConversion(null)
    }
  }, [formData.amount, formData.cryptoCurrency])

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Send Crypto Payment
      </h3>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (USD)
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="0.00"
              step="0.01"
              min="0"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fiat Currency
            </label>
            <select
              name="currency"
              value={formData.currency}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {SUPPORTED_CURRENCIES.map((curr) => (
                <option key={curr} value={curr}>
                  {curr}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Crypto Currency Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pay with Cryptocurrency
          </label>
          <div className="grid grid-cols-2 gap-2">
            {SUPPORTED_CRYPTOS.map((crypto) => (
              <label
                key={crypto.id}
                className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition ${
                  formData.cryptoCurrency === crypto.id
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="cryptoCurrency"
                  value={crypto.id}
                  checked={formData.cryptoCurrency === crypto.id}
                  onChange={handleChange}
                  className="sr-only"
                />
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm mr-2"
                  style={{ backgroundColor: crypto.color }}
                >
                  {crypto.icon}
                </span>
                <div>
                  <span className="font-medium text-gray-700 text-sm">{crypto.name}</span>
                  <span className="block text-xs text-gray-400">{crypto.id}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Conversion Preview */}
        {conversion && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">You&apos;ll send</span>
              <span className="font-bold text-orange-700">
                {formatCryptoAmount(conversion.cryptoAmount, formData.cryptoCurrency as CryptoId)}
              </span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-gray-400">Rate</span>
              <span className="text-xs text-gray-500">
                1 {formData.cryptoCurrency.toUpperCase()} = ${conversion.rate.toLocaleString()} USD
              </span>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Recipient Email
          </label>
          <input
            type="email"
            name="recipientEmail"
            value={formData.recipientEmail}
            onChange={handleChange}
            placeholder="recipient@example.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description (optional)
          </label>
          <input
            type="text"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="What is this payment for?"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || formData.amount <= 0}
          className="w-full bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
        >
          {isLoading ? 'Processing...' : `Pay with ${formData.cryptoCurrency}`}
        </button>
      </div>
    </form>
  )
}
