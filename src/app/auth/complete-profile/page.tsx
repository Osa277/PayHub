'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

import { SUPPORTED_CURRENCIES, CURRENCY_SYMBOLS } from '@/lib/constants'

const CURRENCIES = SUPPORTED_CURRENCIES.map((code) => ({
  code,
  symbol: CURRENCY_SYMBOLS[code] || code,
}))

export default function CompleteProfilePage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const user = session?.user
  const [preferredCurrency, setPreferredCurrency] = useState('USD')
  const [avatar, setAvatar] = useState('')
  const [bio, setBio] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  if (status === 'loading') return null
  if (status === 'unauthenticated') {
    router.push('/auth/login')
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currency: preferredCurrency, avatar, bio }),
      })
    } catch {
      // ignore — profile update is optional
    }

    setIsLoading(false)
    router.push('/dashboard')
  }

  const handleSkip = () => {
    router.push('/dashboard')
  }

  if (!user) return null

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-600 mx-auto mb-4">
              {avatar ? (
                <span className="text-3xl">{avatar}</span>
              ) : (
                initials
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Complete Your Profile</h1>
            <p className="text-gray-500 mt-1">
              Welcome, {user?.name}! Set up your preferences.
            </p>
          </div>

          {/* Success Badge */}
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 text-sm flex items-center gap-2">
            <span className="text-green-500 text-lg">✓</span>
            Account created successfully! Customize your experience below.
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Choose an Avatar
              </label>
              <div className="flex flex-wrap gap-3">
                {['👤', '👨', '👩', '🧑', '👨‍💼', '👩‍💼', '🦸', '🧑‍🚀'].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setAvatar(emoji)}
                    className={`w-12 h-12 rounded-full text-2xl flex items-center justify-center border-2 transition ${
                      avatar === emoji
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Preferred Currency */}
            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
                Preferred Currency
              </label>
              <select
                id="currency"
                value={preferredCurrency}
                onChange={(e) => setPreferredCurrency(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.symbol} {c.code}
                  </option>
                ))}
              </select>
            </div>

            {/* Bio */}
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                Short Bio <span className="text-gray-400">(optional)</span>
              </label>
              <textarea
                id="bio"
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={200}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                placeholder="Tell us a bit about yourself..."
              />
              <p className="text-xs text-gray-400 mt-1">{bio.length}/200 characters</p>
            </div>

            {/* Account Summary */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <h3 className="text-sm font-semibold text-gray-700">Account Summary</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-500">Name:</span>
                <span className="text-gray-900 font-medium">{user?.name}</span>
                <span className="text-gray-500">Email:</span>
                <span className="text-gray-900 font-medium">{user?.email}</span>
                {user?.phone && (
                  <>
                    <span className="text-gray-500">Phone:</span>
                    <span className="text-gray-900 font-medium">{user.phone}</span>
                  </>
                )}
                {user?.country && (
                  <>
                    <span className="text-gray-500">Country:</span>
                    <span className="text-gray-900 font-medium">{user.country}</span>
                  </>
                )}
                <span className="text-gray-500">Currency:</span>
                <span className="text-gray-900 font-medium">{preferredCurrency}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleSkip}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
              >
                Skip for Now
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {isLoading ? 'Saving...' : 'Complete Setup'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
