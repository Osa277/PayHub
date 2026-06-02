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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-labelledby="withdrawal-modal-title" onClick={(e) => { if (e.target === e.currentTarget) onClose() }} onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}>
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
        <h2 id="withdrawal-modal-title" className="text-xl font-bold text-black mb-4">Withdraw to Bank</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <span className="text-lg">🏦</span>
            <div>
              <p className="text-sm font-medium text-blue-900">
                Available: {CURRENCY_SYMBOLS[wallet.currency] || '$'}
                {Number(wallet.balance).toFixed(2)}
              </p>
              <p className="text-xs text-blue-900">1% withdrawal fee applies</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Bank Account
            </label>
            <select
              value={bankAccountId}
              onChange={(e) => setBankAccountId(e.target.value)}
              className="w-full px-4 py-3 border border-blue-200 rounded-lg text-black focus:ring-2 focus:ring-blue-900 focus:border-transparent"
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
            <label className="block text-sm font-medium text-black mb-1">
              Amount ({wallet.currency})
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-3 border border-blue-200 rounded-lg text-black focus:ring-2 focus:ring-blue-900 focus:border-transparent"
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
                className="flex-1 py-2 text-sm font-medium border border-blue-200 rounded-lg hover:bg-blue-50 text-black"
              >
                {CURRENCY_SYMBOLS[wallet.currency] || '₦'}{preset.toLocaleString()}
              </button>
            ))}
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
              placeholder="What's this withdrawal for?"
              maxLength={200}
            />
          </div>

          <div className="bg-white border border-blue-100 p-3 rounded-lg space-y-2 text-sm">
            <div className="flex justify-between text-black">
              <span>Amount:</span>
              <span className="font-medium">
                {CURRENCY_SYMBOLS[wallet.currency] || '$'}
                {selectedAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-black">
              <span>Fee (1%):</span>
              <span className="font-medium">
                {CURRENCY_SYMBOLS[wallet.currency] || '$'}
                {fee.toFixed(2)}
              </span>
            </div>
            <div className="border-t pt-2 flex justify-between text-black font-semibold">
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
              className="flex-1 py-3 bg-white text-black border border-blue-900 rounded-lg font-semibold hover:bg-blue-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitLoading || loading || bankAccounts.length === 0}
              className="flex-1 py-3 bg-blue-900 text-white rounded-lg font-semibold hover:bg-blue-950 disabled:opacity-50"
            >
              {submitLoading ? 'Processing...' : 'Withdraw'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
