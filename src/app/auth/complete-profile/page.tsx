'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

export default function CompleteProfilePage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const user = session?.user
  const [preferredCurrency] = useState('NGN')
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
            <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-900 mx-auto mb-4">
              {avatar ? (
                <span className="text-3xl">{avatar}</span>
              ) : (
                initials
              )}
            </div>
            <h1 className="text-2xl font-bold text-black">Complete Your Profile</h1>
            <p className="text-black mt-1">
              Welcome, {user?.name}! Set up your preferences.
            </p>
          </div>

          {/* Success Badge */}
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 text-sm flex items-center gap-2">
            <span className="text-green-500 text-lg">✓</span>
            Account created successfully! Customize your experience below.
          </div>

          {/* Email Verification Reminder */}
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg mb-6 text-sm">
            <p className="font-semibold mb-1">📧 Verify Your Email</p>
            <p className="mb-3">Please check your email for a verification link. You&apos;ll need to verify your email to perform financial transactions.</p>
            <a
              href="/auth/resend-verification"
              className="text-amber-900 font-semibold hover:text-amber-950 underline"
            >
              Didn&apos;t receive it? Get a new link
            </a>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Selection */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
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
                        ? 'border-blue-900 bg-blue-50'
                        : 'border-blue-200 hover:border-blue-300'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Preferred Currency */}
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Wallet Currency
              </label>
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-900">₦ NGN (Nigerian Naira)</p>
                <p className="text-xs text-blue-700 mt-1">All transactions are processed in Naira via Paystack</p>
              </div>
            </div>

            {/* Bio */}
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-black mb-1">
                Short Bio <span className="text-black/60">(optional)</span>
              </label>
              <textarea
                id="bio"
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={200}
                className="w-full px-4 py-3 border border-blue-200 rounded-lg text-black placeholder-gray-400 focus:ring-2 focus:ring-blue-900 focus:border-transparent transition resize-none"
                placeholder="Tell us a bit about yourself..."
              />
              <p className="text-xs text-black/60 mt-1">{bio.length}/200 characters</p>
            </div>

            {/* Account Summary */}
            <div className="bg-blue-50 rounded-lg p-4 space-y-2">
              <h3 className="text-sm font-semibold text-black">Account Summary</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-black">Name:</span>
                <span className="text-black font-medium">{user?.name}</span>
                <span className="text-black">Email:</span>
                <span className="text-black font-medium">{user?.email}</span>
                {user?.phone && (
                  <>
                    <span className="text-black">Phone:</span>
                    <span className="text-black font-medium">{user.phone}</span>
                  </>
                )}
                {user?.country && (
                  <>
                    <span className="text-black">Country:</span>
                    <span className="text-black font-medium">{user.country}</span>
                  </>
                )}
                <span className="text-black">Currency:</span>
                <span className="text-black font-medium">{preferredCurrency}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleSkip}
                className="flex-1 bg-blue-50 text-black py-3 rounded-lg font-semibold hover:bg-blue-100 transition"
              >
                Skip for Now
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-blue-900 text-white py-3 rounded-lg font-semibold hover:bg-blue-950 disabled:opacity-50 transition"
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
