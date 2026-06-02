'use client'
import React, { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { AuthGuard } from '@/components/AuthGuard'

type VerifyStatus = 'verifying' | 'success' | 'failed' | 'error'

function CallbackContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const reference = searchParams.get('reference') || searchParams.get('trxref')
  const [status, setStatus] = useState<VerifyStatus>('verifying')
  const [amount, setAmount] = useState<number | null>(null)
  const [error, setError] = useState('')

  // Auto-redirect to wallet 3s after success
  useEffect(() => {
    if (status !== 'success') return
    const timer = setTimeout(() => router.push('/wallet'), 3000)
    return () => clearTimeout(timer)
  }, [status, router])

  useEffect(() => {
    if (!reference) {
      setStatus('error')
      setError('No payment reference found')
      return
    }

    const verify = async () => {
      try {
        const res = await fetch(`/api/paystack/verify?reference=${encodeURIComponent(reference)}`)
        const data = await res.json()

        if (data.success && data.data?.status === 'completed') {
          setStatus('success')
          setAmount(data.data.amount)
        } else if (data.data?.status === 'failed') {
          setStatus('failed')
          setError(data.error || 'Payment failed')
        } else if (data.data?.status === 'abandoned') {
          setStatus('failed')
          setError('Payment was abandoned')
        } else {
          setStatus('failed')
          setError(data.error || 'Payment could not be verified')
        }
      } catch {
        setStatus('error')
        setError('Failed to verify payment. Please check your wallet.')
      }
    }

    verify()
  }, [reference])

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full mx-4 text-center">
        {status === 'verifying' && (
          <>
            <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold text-black mb-2">Verifying Payment</h2>
            <p className="text-black">Please wait while we confirm your payment...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-black mb-2">Payment Successful!</h2>
            <p className="text-black mb-1">Your wallet has been credited.</p>
            {amount != null && (
              <p className="text-2xl font-bold text-green-600 mb-4">
                {Number(amount).toLocaleString(undefined, { style: 'currency', currency: 'NGN' })}
              </p>
            )}
            <p className="text-xs text-black/60 mb-4">Redirecting to wallet in 3 seconds...</p>
            <button
              onClick={() => router.push('/wallet')}
              className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
            >
              Go to Wallet
            </button>
          </>
        )}

        {(status === 'failed' || status === 'error') && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-black mb-2">Payment Failed</h2>
            <p className="text-black mb-6">{error}</p>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/wallet')}
                className="flex-1 py-3 bg-blue-50 text-black rounded-lg font-semibold hover:bg-blue-100"
              >
                Back to Wallet
              </button>
              <button
                onClick={() => router.push('/wallet')}
                className="flex-1 py-3 bg-blue-900 text-white rounded-lg font-semibold hover:bg-blue-950"
              >
                Try Again
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function PaystackCallbackPage() {
  return (
    <AuthGuard>
      <React.Suspense fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
        </div>
      }>
        <CallbackContent />
      </React.Suspense>
    </AuthGuard>
  )
}
