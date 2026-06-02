'use client'
import React, { useState } from 'react'
import { PaymentForm, PaymentFormData } from '@/components/PaymentForm'
import { AuthGuard } from '@/components/AuthGuard'

export default function PaymentPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const handlePaymentSubmit = async (_formData: PaymentFormData) => {
    setIsLoading(true)
    setMessage({
      type: 'error',
      text: 'Crypto payments are deprecated. Please use Paystack for all transactions.',
    })
    setIsLoading(false)
  }

  return (
    <AuthGuard>
      <div className="max-w-2xl mx-auto p-8">
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}
        <PaymentForm onSubmit={handlePaymentSubmit} isLoading={isLoading} />
      </div>
    </AuthGuard>
  )
}
