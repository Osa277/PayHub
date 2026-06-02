'use client'
import React, { useState } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!data.success) {
        setError(data.error)
        return
      }
      setIsSubmitted(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {!isSubmitted ? (
            <>
              <div className="text-center mb-8">
                <div className="text-4xl mb-3">🔐</div>
                <h1 className="text-2xl font-bold text-black">Reset Password</h1>
                <p className="text-black mt-1">
                  Enter your email and we&apos;ll send you a reset link
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="reset-email" className="block text-sm font-medium text-black mb-1">
                    Email Address
                  </label>
                  <input
                    id="reset-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-blue-200 rounded-lg text-black placeholder-gray-400 focus:ring-2 focus:ring-blue-900 focus:border-transparent transition"
                    placeholder="Email address"
                  />
                </div>

                {error && (
                  <p className="text-red-600 text-sm text-center">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-900 text-white py-3 rounded-lg font-semibold hover:bg-blue-950 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-6">
              <div className="text-5xl mb-4">📧</div>
              <h2 className="text-2xl font-bold text-black mb-2">Check Your Email</h2>
              <p className="text-black mb-6">
                We&apos;ve sent a password reset link to{' '}
                <strong className="text-black">{email}</strong>
              </p>
              <p className="text-sm text-black/60 mb-6">
                Didn&apos;t receive the email? Check your spam folder or try again.
              </p>
              <button
                onClick={() => setIsSubmitted(false)}
                className="text-blue-900 font-semibold hover:text-blue-950 text-sm"
              >
                Try a different email
              </button>
            </div>
          )}

          <p className="text-center mt-8 text-sm text-black">
            Remember your password?{' '}
            <Link href="/auth/login" className="text-blue-900 font-semibold hover:text-blue-950">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
