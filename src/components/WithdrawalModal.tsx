'use client'
import React, { useState } from 'react'
import { BankAccount, Wallet } from '@/types'
import { CURRENCY_SYMBOLS } from '@/lib/constants'

export function WithdrawalModal({
  open,
  onClose,
  onSuccess,
  wallet,
  bankAccounts,
  loading,
}: {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  wallet: Wallet
  bankAccounts: BankAccount[]
  loading: boolean
}) {
  const [bankAccountId, setBankAccountId] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [submitLoading, setSubmitLoading] = useState(false)
  const [error, setError] = useState('')

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const num = parseFloat(amount)
    if (!bankAccountId) {
      setError('Select a bank account')
      return
    }
    if (!num || num <= 0) {
      setError('Enter a valid amount')
      return
    }

    const fee = num * 0.01
    const total = num + fee
    if (wallet.balance < total) {
      setError('Insufficient balance')
      return
    }

    setSubmitLoading(true)
    try {
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: num,
          bankAccountId,
          description,
        }),
      })

      const data = await res.json()
      if (!data.success) {
        setError(data.error)
        return
      }

      setAmount('')
      setDescription('')
      setBankAccountId('')
      onSuccess()
      onClose()
    } catch {
      setError('Something went wrong')
    } finally {
      setSubmitLoading(false)
    }
  }

  const selectedAmount = parseFloat(amount) || 0
  const fee = selectedAmount * 0.01
  const total = selectedAmount + fee

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Withdraw to Bank</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <span className="text-lg">🏦</span>
            <div>
              <p className="text-sm font-medium text-blue-700">
                Available: {CURRENCY_SYMBOLS[wallet.currency] || '$'}
                {wallet.balance.toFixed(2)}
              </p>
              <p className="text-xs text-blue-600">1% withdrawal fee applies</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bank Account
            </label>
            <select
              value={bankAccountId}
              onChange={(e) => setBankAccountId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select bank account</option>
              {bankAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.bankName} • {account.accountName} (••••{account.accountNumber.slice(-4)})
                </option>
              ))}
            </select>
            {bankAccounts.length === 0 && (
              <p className="text-xs text-red-600 mt-1">Add a bank account first</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount ({wallet.currency})
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
              autoFocus
            />
          </div>

          <div className="flex gap-2">
            {[1000, 5000, 10000].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAmount(String(preset))}
                className="flex-1 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
              >
                ₦{(preset / 100).toLocaleString()}
              </button>
            ))}
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
              placeholder="What's this withdrawal for?"
              maxLength={200}
            />
          </div>

          <div className="bg-gray-50 p-3 rounded-lg space-y-2 text-sm">
            <div className="flex justify-between text-gray-700">
              <span>Amount:</span>
              <span className="font-medium">
                {CURRENCY_SYMBOLS[wallet.currency] || '$'}
                {selectedAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>Fee (1%):</span>
              <span className="font-medium">
                {CURRENCY_SYMBOLS[wallet.currency] || '$'}
                {fee.toFixed(2)}
              </span>
            </div>
            <div className="border-t pt-2 flex justify-between text-gray-900 font-semibold">
              <span>Total:</span>
              <span>
                {CURRENCY_SYMBOLS[wallet.currency] || '$'}
                {total.toFixed(2)}
              </span>
            </div>
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
              disabled={submitLoading || loading || bankAccounts.length === 0}
              className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              {submitLoading ? 'Processing...' : 'Withdraw'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
