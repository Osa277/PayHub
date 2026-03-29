'use client'
import React, { useState } from 'react'
import { WalletDisplay } from '@/components/WalletDisplay'
import { AuthGuard } from '@/components/AuthGuard'
import { Wallet, Transaction, BankAccount } from '@/types'
import { useApi } from '@/lib/hooks'
import { useToast } from '@/components/Toast'
import { CURRENCY_SYMBOLS } from '@/lib/constants'
import { BankAccountManager } from '@/components/BankAccountManager'
import { WithdrawalModal } from '@/components/WithdrawalModal'

function TopUpModal({
  open,
  onClose,
  currency,
}: {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  currency: string
}) {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [paymentType, setPaymentType] = useState<'local' | 'international'>('local')

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
      let endpoint = ''
      let body: any = { amount: num }

      if (paymentType === 'local') {
        // Local payment (NGN only)
        if (currency !== 'NGN') {
          setError('Local payment only works with NGN wallet')
          setLoading(false)
          return
        }
        endpoint = '/api/payments/local/initialize'
      } else {
        // International payment (USD, EUR, GBP, CAD)
        if (!['USD', 'EUR', 'GBP', 'CAD'].includes(currency)) {
          setError('International payment only for USD, EUR, GBP, CAD')
          setLoading(false)
          return
        }
        endpoint = '/api/payments/international/initialize'
        body.currency = currency
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      console.log('Payment response:', { status: res.status, data })

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
    } catch (err) {
      console.error('Payment error:', err)
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  const isLocalPayment = paymentType === 'local'
  const isInternationalPayment = paymentType === 'international'

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Top Up Wallet</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Payment Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentType('local')}
                className={`p-3 rounded-lg border-2 transition ${
                  isLocalPayment
                    ? 'border-green-600 bg-green-50'
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                }`}
              >
                <p className={`font-medium ${isLocalPayment ? 'text-green-700' : 'text-gray-700'}`}>
                  🇳🇬 Local
                </p>
                <p className={`text-xs ${isLocalPayment ? 'text-green-600' : 'text-gray-500'}`}>
                  NGN (Fast)
                </p>
              </button>
              <button
                type="button"
                onClick={() => setPaymentType('international')}
                className={`p-3 rounded-lg border-2 transition ${
                  isInternationalPayment
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                }`}
              >
                <p className={`font-medium ${isInternationalPayment ? 'text-blue-700' : 'text-gray-700'}`}>
                  🌍 International
                </p>
                <p className={`text-xs ${isInternationalPayment ? 'text-blue-600' : 'text-gray-500'}`}>
                  USD, EUR, GBP, CAD
                </p>
              </button>
            </div>
          </div>

          {/* Wallet Currency Info */}
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="text-sm font-medium text-blue-900">Your Wallet: {CURRENCY_SYMBOLS[currency]}{currency}</p>
            {isLocalPayment ? (
              <p className="text-xs text-blue-700 mt-1">Direct NGN payment via Paystack</p>
            ) : (
              <p className="text-xs text-blue-700 mt-1">Converts to {currency} (exchange rate applied)</p>
            )}
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount ({isLocalPayment ? 'NGN' : currency})
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

          {/* Presets */}
          <div className="flex gap-2">
            {isLocalPayment
              ? [1000, 5000, 10000, 50000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(String(preset))}
                  className="flex-1 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
                >
                  ₦{preset.toLocaleString()}
                </button>
              ))
              : [10, 50, 100, 500].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(String(preset))}
                  className="flex-1 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
                >
                  {CURRENCY_SYMBOLS[currency]}{preset}
                </button>
              ))
            }
          </div>

          {/* Error Message */}
          {error && <p className="text-red-600 text-sm">{error}</p>}

          {/* Action Buttons */}
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
              className="flex-1 py-3 text-white rounded-lg font-semibold disabled:opacity-50 bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Processing...' : `Pay ${isLocalPayment ? 'NGN' : currency}`}
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Transfer Funds</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="text-sm font-medium text-blue-900">Transfer in: {currency}</p>
            <p className="text-xs text-blue-700 mt-1">Recipient must have a {currency} wallet</p>
          </div>

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
    totalSent: transactions.filter(t => t.type === 'transfer' && t.status === 'completed').reduce((sum, t) => sum + t.amount, 0),
    totalReceived: transactions.filter(t => t.type === 'deposit' && t.status === 'completed').reduce((sum, t) => sum + t.amount, 0),
    transactionCount: transactions.length,
  }

  // Filter transactions
  const filteredTransactions = transactionFilter === 'all'
    ? transactions
    : transactions.filter(t => t.type === transactionFilter)

  const handleAddBankAccount = async (account: any) => {
    try {
      const res = await fetch('/api/bank-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(account),
      })
      const result = await res.json()
      if (!result.success) throw new Error(result.error)
      toast('Bank account added successfully!')
      mutateBankAccounts()
    } catch (err: any) {
      throw err
    }
  }

  const handleDeleteBankAccount = async (id: string) => {
    try {
      const res = await fetch(`/api/bank-accounts/${id}`, {
        method: 'DELETE',
      })
      const result = await res.json()
      if (!result.success) throw new Error(result.error)
      toast('Bank account removed')
      mutateBankAccounts()
    } catch (err: any) {
      throw err
    }
  }

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
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">My Wallet</h1>
          <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">{wallet.currency}</span>
        </div>

        {/* Main Wallet Card */}
        <WalletDisplay
          wallet={wallet}
          onTopUp={() => setShowTopUp(true)}
          onTransfer={() => setShowTransfer(true)}
        />

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-600">
            <p className="text-sm text-gray-500 font-medium">Total Sent</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {CURRENCY_SYMBOLS[wallet.currency || 'USD']}{stats.totalSent.toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-600">
            <p className="text-sm text-gray-500 font-medium">Total Received</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {CURRENCY_SYMBOLS[wallet.currency || 'USD']}{stats.totalReceived.toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-600">
            <p className="text-sm text-gray-500 font-medium">Transactions</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.transactionCount}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-600">
            <p className="text-sm text-gray-500 font-medium">Bank Accounts</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{bankAccounts.length}</p>
          </div>
        </div>

        {/* Bank Account Manager */}
        <div className="bg-white rounded-lg shadow p-6">
          <BankAccountManager
            accounts={bankAccounts}
            onAdd={handleAddBankAccount}
            onDelete={handleDeleteBankAccount}
            loading={isLoading}
          />
        </div>

        {/* Withdrawal Button */}
        <div>
          <button
            onClick={() => setShowWithdraw(true)}
            disabled={bankAccounts.length === 0}
            className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {bankAccounts.length === 0 ? 'Add Bank Account to Withdraw' : 'Withdraw to Bank'}
          </button>
        </div>

        {/* Transaction Filters & List */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Transaction History</h2>
            <div className="flex gap-2 flex-wrap">
              {(['all', 'deposit', 'transfer', 'withdrawal'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setTransactionFilter(filter)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                    transactionFilter === filter
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
              <p className="text-gray-500">No {transactionFilter === 'all' ? 'transactions' : transactionFilter + 's'} yet</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition border border-gray-200"
                >
                  {/* Left: Icon & Description */}
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                      tx.type === 'deposit' ? 'bg-green-100' :
                      tx.type === 'transfer' ? 'bg-blue-100' :
                      'bg-orange-100'
                    }`}>
                      {tx.type === 'deposit' ? '📥' : tx.type === 'transfer' ? '↔️' : '📤'}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {tx.type === 'deposit' ? 'Top-up' : tx.type === 'transfer' ? 'Transfer' : 'Withdrawal'}
                      </p>
                      <p className="text-sm text-gray-500 truncate">{tx.description}</p>
                    </div>
                  </div>

                  {/* Right: Amount & Status */}
                  <div className="text-right">
                    <p className={`font-bold text-sm ${
                      tx.type === 'payment' ? 'text-green-600' :
                      tx.type === 'transfer' && tx.amount ? 'text-red-600' :
                      'text-blue-600'
                    }`}>
                      {tx.type === 'payment' ? '+' : '-'}{CURRENCY_SYMBOLS[tx.currency || 'USD']}{tx.amount.toFixed(2)}
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
