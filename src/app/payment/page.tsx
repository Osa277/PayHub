'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PaymentForm, PaymentFormData } from '@/components/PaymentForm'
import { AuthGuard } from '@/components/AuthGuard'

export default function PaymentPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const handlePaymentSubmit = async (formData: PaymentFormData) => {
    setIsLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: formData.amount,
          currency: formData.currency,
          cryptoCurrency: formData.cryptoCurrency,
          recipientEmail: formData.recipientEmail,
          description: formData.description || 'Crypto payment via PayHub',
        }),
      })

      const data = await response.json()

      if (data.success && data.data) {
        // Redirect to confirm page with payment details
        const params = new URLSearchParams({
          sessionId: data.data.sessionId,
          transactionId: data.data.transactionId,
          amount: formData.amount.toString(),
          currency: formData.currency,
          provider: 'crypto',
          cryptoCurrency: formData.cryptoCurrency || 'btc',
          walletAddress: data.data.walletAddress || '',
          cryptoAmount: (data.data.cryptoAmount || 0).toString(),
          exchangeRate: (data.data.exchangeRate || 0).toString(),
          network: data.data.network || '',
          recipientEmail: formData.recipientEmail || '',
          description: formData.description || 'Crypto payment via PayHub',
        })
        router.push(`/payment/confirm?${params.toString()}`)
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Payment initiation failed',
        })
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'An error occurred',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthGuard>
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Send Money</h1>

      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PaymentForm onSubmit={handlePaymentSubmit} isLoading={isLoading} />
        </div>

        <div className="bg-white rounded-lg shadow p-6 h-fit">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Supported Crypto
          </h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>₿ BTC - Bitcoin</li>
            <li>Ξ ETH - Ethereum</li>
            <li>₮ USDT - Tether</li>
            <li>$ USDC - USD Coin</li>
          </ul>
          <div className="mt-4 p-3 bg-orange-50 rounded-lg">
            <p className="text-xs text-orange-700">Low fees (1%) &bull; Fast settlement &bull; No chargebacks</p>
          </div>
        </div>
      </div>
    </div>
    </AuthGuard>
  )
}
