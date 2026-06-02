'use client'

import { AuthGuard } from '@/components/AuthGuard'

export default function ConfirmPage() {
  return (
    <AuthGuard>
      <div className="max-w-lg mx-auto p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Payment Confirmation</h1>
        <p className="mt-4 text-gray-600">Crypto payments have been deprecated. Please use Paystack for all transactions.</p>
      </div>
    </AuthGuard>
  )
}
