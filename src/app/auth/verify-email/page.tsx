'use client'
import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token') || ''
  const email = searchParams.get('email') || ''

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token || !email) {
      setIsLoading(false)
      setError('Invalid verification link.')
      return
    }

    const verify = async () => {
      try {
        const res = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, token }),
        })
        const data = await res.json()
        if (!data.success) {
          setError(data.error)
        } else {
          setSuccess(true)
        }
      } catch {
        setError('Something went wrong. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    verify()
  }, [token, email])

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="text-5xl mb-4 animate-spin">⏳</div>
          <h1 className="text-2xl font-bold text-black mb-2">Verifying...</h1>
          <p className="text-black">Please wait while we verify your email.</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-black mb-2">Email Verified!</h1>
          <p className="text-black mb-6">
            Your email has been verified successfully. You now have full access to PayHub.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-black mb-2">Verification Failed</h1>
        <p className="text-black mb-6">{error}</p>
        <Link
          href="/auth/resend-verification"
          className="text-blue-900 font-semibold hover:text-blue-950"
        >
          Resend verification email
        </Link>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[80vh] flex items-center justify-center">
          <div className="text-black">Loading...</div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  )
}
