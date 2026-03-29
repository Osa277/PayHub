'use client'
import React, { useState } from 'react'
import { WalletDisplay } from '@/components/WalletDisplay'
import { TransactionList } from '@/components/TransactionList'
import { AuthGuard } from '@/components/AuthGuard'
import { Wallet, Transaction } from '@/types'
import { useApi } from '@/lib/hooks'
import { useToast } from '@/components/Toast'
import { CURRENCY_SYMBOLS } from '@/lib/constants'

function TopUpModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  currency: string
}) {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const num = parseFloat(amount)
    if (!num || num <= 0) {
      setError('Enter a valid amount')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: num, currency: 'NGN' }),
      })
      const data = await res.json()
      if (!data.success) {
        setError(data.error)
        return
      }
      // Redirect to Paystack checkout
      window.location.href = data.data.authorizationUrl
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Top Up Wallet</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
            <span className="text-lg">🏦</span>
            <div>
              <p className="text-sm font-medium text-green-700">Paystack</p>
              <p className="text-xs text-green-600">Card / Bank / USSD</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (₦ NGN)
            </label>
            <input
              type="number"
              min="0.01"
              max="50000"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
              autoFocus
            />
          </div>
          <div className="flex gap-2">
            {[1000, 5000, 10000, 50000].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAmount(String(preset))}
                className="flex-1 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
              >
                ₦{preset.toLocaleString()}
              </button>
            ))}
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 text-white rounded-lg font-semibold disabled:opacity-50 bg-green-600 hover:bg-green-700"
            >
              {loading ? 'Processing...' : 'Pay with Paystack'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function TransferModal({
  open,
  onClose,
  onSuccess,
  currency,
}: {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  currency: string
}) {
  const [email, setEmail] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const num = parseFloat(amount)
    if (!email) {
      setError('Enter recipient email')
      return
    }
    if (!num || num <= 0) {
      setError('Enter a valid amount')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/wallet/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientEmail: email, amount: num, description }),
      })
      const data = await res.json()
      if (!data.success) {
        setError(data.error)
        return
      }
      setEmail('')
      setAmount('')
      setDescription('')
      onSuccess()
      onClose()
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Transfer Funds</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recipient Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="recipient@email.com"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount ({currency})
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Note <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="What's this for?"
              maxLength={200}
            />
          </div>
          <p className="text-xs text-gray-500">
            0.5% transfer fee applies
            {parseFloat(amount) > 0 && (
              <span className="ml-1 font-medium text-gray-700">
                (fee: {CURRENCY_SYMBOLS[currency] || '$'}{(parseFloat(amount) * 0.005).toFixed(2)}, total: {CURRENCY_SYMBOLS[currency] || '$'}{(parseFloat(amount) * 1.005).toFixed(2)})
              </span>
            )}
          </p>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function WalletSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-40" />
      <div className="bg-gradient-to-r from-blue-200 to-blue-300 rounded-lg p-6 h-44" />
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="h-5 bg-gray-200 rounded w-48" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex justify-between">
            <div className="h-4 bg-gray-200 rounded w-32" />
            <div className="h-4 bg-gray-200 rounded w-20" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function WalletPage() {
  const { data, error, isLoading, mutate } = useApi<{
    wallet: Wallet
    transactions: Transaction[]
  }>('/api/wallet')
  const [showTopUp, setShowTopUp] = useState(false)
  const [showTransfer, setShowTransfer] = useState(false)
  const { toast } = useToast()

  const wallet = data?.wallet ?? null
  const transactions = data?.transactions ?? []

  if (isLoading) {
    return <AuthGuard><WalletSkeleton /></AuthGuard>
  }

  if (error) {
    return (
      <AuthGuard>
        <div className="text-center py-12">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Failed to load wallet</h2>
          <p className="text-gray-500 mb-4">{error.message}</p>
          <button onClick={() => mutate()} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700">
            Retry
          </button>
        </div>
      </AuthGuard>
    )
  }

  if (!wallet) {
    return <AuthGuard><div className="text-center py-8">Wallet not found</div></AuthGuard>
  }

  return (
    <AuthGuard>
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">My Wallet</h1>

      <WalletDisplay
        wallet={wallet}
        onTopUp={() => setShowTopUp(true)}
        onTransfer={() => setShowTransfer(true)}
      />

      <TransactionList transactions={transactions} isLoading={isLoading} />

      <TopUpModal
        open={showTopUp}
        onClose={() => setShowTopUp(false)}
        onSuccess={() => { mutate(); toast('Top-up successful!') }}
        currency={wallet.currency}
      />
      <TransferModal
        open={showTransfer}
        onClose={() => setShowTransfer(false)}
        onSuccess={() => { mutate(); toast('Transfer sent successfully!') }}
        currency={wallet.currency}
      />
    </div>
    </AuthGuard>
  )
}
