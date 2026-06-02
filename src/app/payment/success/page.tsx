'use client'
import React, { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { AuthGuard } from '@/components/AuthGuard'
import { formatCurrency } from '@/lib/utils'

function SuccessContent() {
  const searchParams = useSearchParams()
  const amount = parseFloat(searchParams.get('amount') || '0')
  const currency = searchParams.get('currency') || 'USD'
  const txnId = searchParams.get('txnId') || ''
  const date = new Date()

  return (
    <AuthGuard>
      <div className="max-w-lg mx-auto space-y-6">
        {/* Success Animation */}
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-4 animate-fade-in">
            <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-black">Payment Successful!</h1>
          <p className="text-black mt-2">Your payment has been processed through Paystack</p>
          <p className="text-3xl font-bold text-blue-900 mt-4">{formatCurrency(amount, currency)}</p>
        </div>

        {/* Receipt */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-blue-100">
            <h2 className="text-lg font-semibold text-black">Transaction Receipt</h2>
          </div>
          <div className="p-6 space-y-3">
            <div className="flex justify-between py-2">
              <span className="text-black">Transaction ID</span>
              <span className="text-black font-mono text-sm">{txnId.slice(0, 20) || 'N/A'}...</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-black">Date & Time</span>
              <span className="text-black">
                {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <div className="flex justify-between py-2 border-t border-gray-200 pt-3">
              <span className="text-black font-semibold">Total Paid</span>
              <span className="text-black font-semibold">{formatCurrency(amount, currency)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link
            href="/dashboard"
            className="block w-full bg-blue-900 text-white text-center font-semibold py-3 rounded-lg hover:bg-blue-800 transition-colors"
          >
            Back to Dashboard
          </Link>
          <Link
            href="/transactions"
            className="block w-full border-2 border-blue-900 text-blue-900 text-center font-semibold py-3 rounded-lg hover:bg-blue-50 transition-colors"
          >
            View All Transactions
          </Link>
        </div>
      </div>
    </AuthGuard>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="text-center p-8">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  )
}
