'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { AuthGuard } from '@/components/AuthGuard'
import { Wallet, Transaction, BankAccount } from '@/types'
import { useApi } from '@/lib/hooks'
import { useToast } from '@/components/Toast'
import { CURRENCY_SYMBOLS } from '@/lib/constants'
import { WithdrawalModal } from '@/components/WithdrawalModal'

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
      const res = await fetch('/api/payments/local/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: num }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setError(data.error || `Failed to initialize payment (${res.status})`)
        setLoading(false)
        return
      }

      const url = data.data?.authorizationUrl
      if (!url) {
        setError('No checkout URL received')
        setLoading(false)
        return
      }

      window.location.href = url
    } catch {
      setError('Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-labelledby="topup-modal-title" onClick={(e) => { if (e.target === e.currentTarget) onClose() }} onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}>
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
        <h2 id="topup-modal-title" className="text-xl font-bold text-black mb-4">Top Up Wallet</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Wallet Info */}
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="text-sm font-medium text-blue-900">Payment via Paystack (NGN)</p>
            <p className="text-xs text-blue-700 mt-1">Direct NGN payment — fast and secure</p>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Amount (NGN)
            </label>
            <input
              type="number"
              min="0.01"
              max="50000"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-3 border border-blue-200 rounded-lg text-black focus:ring-2 focus:ring-blue-900 focus:border-transparent"
              placeholder="0.00"
              autoFocus
            />
          </div>

          {/* Presets */}
          <div className="flex gap-2">
            {[1000, 5000, 10000, 50000].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAmount(String(preset))}
                className="flex-1 py-2 text-sm font-medium border border-blue-200 rounded-lg hover:bg-blue-50 text-black"
              >
                ₦{preset.toLocaleString()}
              </button>
            ))}
          </div>

          {/* Error Message */}
          {error && <p className="text-red-600 text-sm">{error}</p>}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-blue-50 text-black rounded-lg font-semibold hover:bg-blue-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 text-white rounded-lg font-semibold disabled:opacity-50 bg-blue-900 hover:bg-blue-950"
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
        body: JSON.stringify({ recipientEmail: email, amount: num, description, currency }),
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-labelledby="transfer-modal-title" onClick={(e) => { if (e.target === e.currentTarget) onClose() }} onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}>
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
        <h2 id="transfer-modal-title" className="text-xl font-bold text-black mb-4">Transfer Funds</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="text-sm font-medium text-blue-900">Transfer in: {currency}</p>
            <p className="text-xs text-blue-700 mt-1">Recipient must have a {currency} wallet</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Recipient Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-blue-200 rounded-lg text-black focus:ring-2 focus:ring-blue-900 focus:border-transparent"
              placeholder="recipient@email.com"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Amount ({currency})
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-3 border border-blue-200 rounded-lg text-black focus:ring-2 focus:ring-blue-900 focus:border-transparent"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Note <span className="text-black/60">(optional)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 border border-blue-200 rounded-lg text-black focus:ring-2 focus:ring-blue-900 focus:border-transparent"
              placeholder="What's this for?"
              maxLength={200}
            />
          </div>
          <p className="text-xs text-black">
            0.5% transfer fee applies
            {parseFloat(amount) > 0 && (
              <span className="ml-1 font-medium text-black">
                (fee: {CURRENCY_SYMBOLS[currency] || '$'}{(parseFloat(amount) * 0.005).toFixed(2)}, total: {CURRENCY_SYMBOLS[currency] || '$'}{(parseFloat(amount) * 1.005).toFixed(2)})
              </span>
            )}
          </p>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-blue-50 text-black rounded-lg font-semibold hover:bg-blue-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-blue-900 text-white rounded-lg font-semibold hover:bg-blue-950 disabled:opacity-50"
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
      <div className="h-8 bg-blue-100 rounded w-40" />
      <div className="bg-gradient-to-r from-blue-200 to-blue-300 rounded-lg p-6 h-44" />
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="h-5 bg-blue-100 rounded w-48" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex justify-between">
            <div className="h-4 bg-blue-100 rounded w-32" />
            <div className="h-4 bg-blue-100 rounded w-20" />
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
  const { data: bankData, mutate: mutateBankAccounts } = useApi<{
    data: BankAccount[]
  }>('/api/bank-accounts')

  const [showTopUp, setShowTopUp] = useState(false)
  const [showTransfer, setShowTransfer] = useState(false)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [transactionFilter, setTransactionFilter] = useState<'all' | 'deposit' | 'transfer' | 'withdrawal'>('all')
  const { toast } = useToast()

  const wallet = data?.wallet ?? null
  const transactions = data?.transactions ?? []
  const bankAccounts = bankData?.data ?? []

  // Calculate stats
  const stats = {
    totalBalance: wallet?.balance || 0,
    totalSent: transactions.filter(t => t.type === 'transfer' && t.status === 'completed').reduce((sum, t) => sum + Number(t.amount), 0),
    totalReceived: transactions.filter(t => t.type === 'deposit' && t.status === 'completed').reduce((sum, t) => sum + Number(t.amount), 0),
    transactionCount: transactions.length,
  }

  // Filter transactions
  const filteredTransactions = transactionFilter === 'all'
    ? transactions
    : transactions.filter(t => t.type === transactionFilter)

  if (isLoading) {
    return <AuthGuard><WalletSkeleton /></AuthGuard>
  }

  if (error) {
    return (
      <AuthGuard>
        <div className="text-center py-12">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-black mb-2">Failed to load wallet</h2>
          <p className="text-black mb-4">{error.message}</p>
          <button onClick={() => mutate()} className="bg-blue-900 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-950">
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
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-black">My Wallet</h1>
          <span className="text-sm bg-blue-100 text-blue-900 px-3 py-1 rounded-full font-medium">{wallet.currency}</span>
        </div>

        {/* Main Wallet Card (Paystack-only) */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-950 rounded-lg p-6 text-white shadow-lg mb-4">
          <div className="mb-4">
            <p className="text-sm opacity-90">Available Balance</p>
            <h2 className="text-4xl font-bold">
              {CURRENCY_SYMBOLS[wallet.currency || 'NGN']}{Number(wallet.balance).toFixed(2)}
            </h2>
          </div>
          <p className="text-sm opacity-75 mb-6">Wallet ID: {wallet.id}</p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowTopUp(true)}
              className="flex-1 bg-white text-blue-900 font-semibold py-2 px-4 rounded-lg hover:bg-opacity-90 transition"
            >
              Top Up
            </button>
            <button
              onClick={() => setShowTransfer(true)}
              className="flex-1 bg-blue-800 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition"
            >
              Transfer
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-900">
            <p className="text-sm text-black font-medium">Total Sent</p>
            <p className="text-2xl font-bold text-black mt-1">
              {CURRENCY_SYMBOLS[wallet.currency || 'NGN']}{stats.totalSent.toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-800">
            <p className="text-sm text-black font-medium">Total Received</p>
            <p className="text-2xl font-bold text-black mt-1">
              {CURRENCY_SYMBOLS[wallet.currency || 'NGN']}{stats.totalReceived.toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-900">
            <p className="text-sm text-black font-medium">Transactions</p>
            <p className="text-2xl font-bold text-black mt-1">{stats.transactionCount}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-800">
            <p className="text-sm text-black font-medium">Bank Accounts</p>
            <p className="text-2xl font-bold text-black mt-1">{bankAccounts.length}</p>
          </div>
        </div>

        {/* Bank Account Summary */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-black">Bank Accounts</h2>
            <Link href="/bank-accounts" className="text-blue-900 hover:text-blue-950 font-semibold text-sm">
              Manage →
            </Link>
          </div>
          {bankAccounts.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-3xl mb-2">🏦</div>
              <p className="text-black/70 mb-4">No bank accounts added yet</p>
              <Link
                href="/bank-accounts"
                className="inline-block bg-blue-900 hover:bg-blue-950 text-white px-4 py-2 rounded-lg font-semibold transition"
              >
                + Add Bank Account
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {bankAccounts.map((account) => {
                const masked = account.accountNumber.length > 4
                  ? '*'.repeat(account.accountNumber.length - 4) + account.accountNumber.slice(-4)
                  : account.accountNumber
                return (
                  <div key={account.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div>
                      <p className="font-semibold text-black">{account.bankName}</p>
                      <p className="text-sm text-black/70">{account.accountName} • {masked}</p>
                    </div>
                    {account.isDefault && (
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-semibold">Default</span>
                    )}
                  </div>
                )
              })}
              <Link
                href="/bank-accounts"
                className="block text-center text-blue-900 hover:text-blue-950 font-semibold text-sm mt-4"
              >
                View & Manage All Accounts →
              </Link>
            </div>
          )}
        </div>

        {/* Withdrawal Button */}
        <div>
          <button
            onClick={() => setShowWithdraw(true)}
            disabled={bankAccounts.length === 0}
            className="w-full py-3 bg-blue-900 text-white rounded-lg font-semibold hover:bg-blue-950 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {bankAccounts.length === 0 ? 'Add Bank Account to Withdraw' : 'Withdraw to Bank'}
          </button>
        </div>

        {/* Transaction Filters & List */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-black">Transaction History</h2>
            <div className="flex gap-2 flex-wrap">
              {(['all', 'deposit', 'transfer', 'withdrawal'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setTransactionFilter(filter)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                    transactionFilter === filter
                      ? 'bg-blue-900 text-white'
                      : 'bg-blue-50 text-black hover:bg-blue-100'
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Enhanced Transaction List */}
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-black">No {transactionFilter === 'all' ? 'transactions' : transactionFilter + 's'} yet</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition border border-blue-200"
                >
                  {/* Left: Icon & Description */}
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                      tx.type === 'deposit' ? 'bg-green-100' :
                      tx.type === 'transfer' ? 'bg-blue-100' :
                      'bg-blue-100'
                    }`}>
                      {tx.type === 'deposit' ? '📥' : tx.type === 'transfer' ? '↔️' : '📤'}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-black">
                        {tx.type === 'deposit' ? 'Top-up' : tx.type === 'transfer' ? 'Transfer' : 'Withdrawal'}
                      </p>
                      <p className="text-sm text-black truncate">{tx.description}</p>
                    </div>
                  </div>

                  {/* Right: Amount & Status */}
                  <div className="text-right">
                    <p className={`font-bold text-sm ${
                      tx.type === 'payment' ? 'text-green-600' :
                      tx.type === 'transfer' && tx.amount ? 'text-red-600' :
                      'text-blue-900'
                    }`}>
                      {tx.type === 'payment' ? '+' : '-'}{CURRENCY_SYMBOLS[tx.currency || 'NGN']}{Number(tx.amount).toFixed(2)}
                    </p>
                    <span className={`inline-block text-xs px-2 py-1 rounded-full mt-1 ${
                      tx.status === 'completed' ? 'bg-green-100 text-green-700' :
                      tx.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modals */}
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
        <WithdrawalModal
          open={showWithdraw}
          onClose={() => setShowWithdraw(false)}
          onSuccess={() => { mutate(); mutateBankAccounts(); toast('Withdrawal initiated!') }}
          wallet={wallet}
          bankAccounts={bankAccounts}
          loading={isLoading}
        />
      </div>
    </AuthGuard>
  )
}
