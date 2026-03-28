'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AuthGuard } from '@/components/AuthGuard'
import { useApi } from '@/lib/hooks'
import { useToast } from '@/components/Toast'
import { SUPPORTED_CURRENCIES, CURRENCY_SYMBOLS } from '@/lib/constants'

const CURRENCIES = SUPPORTED_CURRENCIES.map((code) => ({
  code,
  symbol: CURRENCY_SYMBOLS[code] || code,
}))

const AVATARS = ['😊', '😎', '🤩', '🦊', '🐱', '🌟', '💎', '🚀', '🎯', '🔥', '🌈', '🦁']

interface ProfileData {
  id: string
  name: string
  email: string
  avatar: string | null
  phone: string | null
  country: string | null
  bio: string | null
  currency: string
}

export default function ProfilePage() {
  const router = useRouter()
  const { data, isLoading, mutate } = useApi<{ data: ProfileData }>('/api/profile')
  const profile = data?.data

  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState('')
  const [bio, setBio] = useState('')
  const [phone, setPhone] = useState('')
  const [country, setCountry] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (profile) {
      setName(profile.name || '')
      setAvatar(profile.avatar || '')
      setBio(profile.bio || '')
      setPhone(profile.phone || '')
      setCountry(profile.country || '')
      setCurrency(profile.currency || 'USD')
    }
  }, [profile])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, avatar, bio, phone, country, currency }),
      })
      const result = await res.json()
      if (result.success) {
        toast('Profile updated successfully!')
        mutate()
      } else {
        toast(result.error || 'Failed to update profile', 'error')
      }
    } catch {
      toast('Something went wrong', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="max-w-2xl mx-auto animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-40" />
          <div className="bg-white rounded-xl shadow p-8 space-y-4">
            <div className="h-20 w-20 bg-gray-200 rounded-full mx-auto" />
            <div className="h-10 bg-gray-200 rounded" />
            <div className="h-10 bg-gray-200 rounded" />
            <div className="h-20 bg-gray-200 rounded" />
          </div>
        </div>
      </AuthGuard>
    )
  }

  const initials = name
    ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  return (
    <AuthGuard>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <button
            onClick={() => router.back()}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Back
          </button>
        </div>

        <form onSubmit={handleSave} className="bg-white rounded-xl shadow-lg p-8 space-y-6">
          {/* Avatar */}
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-600 mx-auto mb-3">
              {avatar || initials}
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {AVATARS.map((a) => (
                <button
                  type="button"
                  key={a}
                  onClick={() => setAvatar(a)}
                  className={`w-10 h-10 rounded-full text-xl flex items-center justify-center transition ${
                    avatar === a ? 'bg-blue-100 ring-2 ring-blue-500' : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  {a}
                </button>
              ))}
              {avatar && (
                <button
                  type="button"
                  onClick={() => setAvatar('')}
                  className="w-10 h-10 rounded-full text-xs text-gray-500 bg-gray-50 hover:bg-gray-100 flex items-center justify-center"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={profile?.email || ''}
              disabled
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-500 bg-gray-50"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={200}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Tell us about yourself"
            />
            <p className="text-xs text-gray-400 mt-1">{bio.length}/200</p>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="+1 234 567 8900"
            />
          </div>

          {/* Country */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g. United States"
            />
          </div>

          {/* Currency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Preferred Currency
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {CURRENCIES.map((c) => (
                <button
                  type="button"
                  key={c.code}
                  onClick={() => setCurrency(c.code)}
                  className={`p-2 rounded-lg text-sm font-medium transition ${
                    currency === c.code
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {c.symbol} {c.code}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </AuthGuard>
  )
}
