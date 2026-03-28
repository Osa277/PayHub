'use client'
import React, { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { AuthGuard } from '@/components/AuthGuard'
import { formatCurrency } from '@/lib/utils'
import { formatCryptoAmount, type CryptoId } from '@/lib/crypto-payment'

function SuccessContent() {
  const searchParams = useSearchParams()

  const amount = parseFloat(searchParams.get('amount') || '0')
  const currency = searchParams.get('currency') || 'USD'
  const recipientEmail = searchParams.get('recipientEmail') || ''
  const description = searchParams.get('description') || ''
  const cryptoCurrency = (searchParams.get('cryptoCurrency') || 'btc') as CryptoId
  const cryptoAmount = parseFloat(searchParams.get('cryptoAmount') || '0')
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
          <h1 className="text-2xl font-bold text-gray-900">Payment Successful!</h1>
          <p className="text-gray-500 mt-2">
            Your crypto payment has been confirmed on the blockchain
          </p>
          <p className="text-3xl font-bold text-green-600 mt-4">
            {cryptoAmount > 0
              ? formatCryptoAmount(cryptoAmount, cryptoCurrency)
              : formatCurrency(amount, currency)}
          </p>
          {cryptoAmount > 0 && (
            <p className="text-sm text-gray-400 mt-1">
              ≈ {formatCurrency(amount, currency)}
            </p>
          )}
        </div>

        {/* Receipt */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Transaction Receipt</h2>
          </div>
          <div className="p-6 space-y-3">
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Transaction ID</span>
              <span className="text-gray-900 font-mono text-sm">{txnId.slice(0, 20)}...</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Date & Time</span>
              <span className="text-gray-900">
                {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}{' '}
                {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Recipient</span>
              <span className="text-gray-900">{recipientEmail || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Description</span>
              <span className="text-gray-900">{description}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Payment Method</span>
              <span className="text-gray-900">
                {cryptoCurrency.toUpperCase()} (Crypto)
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Status</span>
              <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2 py-0.5 rounded-full text-sm font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                Confirmed
              </span>
            </div>
            <div className="border-t border-gray-100 pt-3 mt-3">
              <div className="flex justify-between py-2">
                <span className="text-gray-500">Amount</span>
                <span className="text-gray-900 font-medium">{formatCurrency(amount, currency)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-500">Fee (1%)</span>
                <span className="text-gray-900 font-medium">{formatCurrency(amount * 0.01, currency)}</span>
              </div>
              <div className="flex justify-between py-2 text-lg">
                <span className="font-bold text-gray-900">Total Charged</span>
                <span className="font-bold text-gray-900">{formatCurrency(amount + amount * 0.01, currency)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Link
            href="/payment"
            className="flex-1 bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 transition text-center"
          >
            Send Another Payment
          </Link>
          <Link
            href="/dashboard"
            className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition text-center"
          >
            Go to Dashboard
          </Link>
        </div>

        <p className="text-center text-xs text-gray-400">
          Transaction confirmed on blockchain. A receipt has been sent to your email.
        </p>
      </div>
    </AuthGuard>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center text-gray-500">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  )
}
