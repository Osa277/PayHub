'use client'
import React, { useState } from 'react'
import { BankAccount } from '@/types'

export function BankAccountManager({
  accounts,
  onAdd,
  onDelete,
  loading,
}: {
  accounts: BankAccount[]
  onAdd: (account: any) => Promise<void>
  onDelete: (id: string) => Promise<void>
  loading: boolean
}) {
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    accountNumber: '',
    bankCode: '',
    bankName: '',
    accountName: '',
  })
  const [error, setError] = useState('')
  const [submitLoading, setSubmitLoading] = useState(false)

  const nigerianBanks = [
    { code: '044', name: 'Access Bank' },
    { code: '050', name: 'Ecobank' },
    { code: '053', name: 'Citibank Nigeria' },
    { code: '058', name: 'Guaranty Trust Bank' },
    { code: '011', name: 'First Bank' },
    { code: '214', name: 'FCMB' },
    { code: '032', name: 'Union Bank' },
    { code: '033', name: 'United Bank for Africa' },
    { code: '076', name: 'Zenith Bank' },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.accountNumber || !formData.bankCode || !formData.accountName) {
      setError('All fields are required')
      return
    }

    setSubmitLoading(true)
    try {
      await onAdd(formData)
      setFormData({
        accountNumber: '',
        bankCode: '',
        bankName: '',
        accountName: '',
      })
      setShowForm(false)
    } catch (err: any) {
      setError(err.message || 'Failed to add bank account')
    } finally {
      setSubmitLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-black">Bank Accounts</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-900 text-white rounded-lg font-medium hover:bg-blue-950"
        >
          {showForm ? 'Cancel' : 'Add Account'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-blue-50 p-4 rounded-lg space-y-3">
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Account Name
            </label>
            <input
              type="text"
              value={formData.accountName}
              onChange={(e) =>
                setFormData({ ...formData, accountName: e.target.value })
              }
              className="w-full px-3 py-2 border border-blue-200 rounded-lg text-black"
              placeholder="Your name as on bank account"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Account Number
            </label>
            <input
              type="text"
              value={formData.accountNumber}
              onChange={(e) =>
                setFormData({ ...formData, accountNumber: e.target.value })
              }
              className="w-full px-3 py-2 border border-blue-200 rounded-lg text-black"
              placeholder="10 digit account number"
              maxLength={10}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Bank
            </label>
            <select
              value={formData.bankCode}
              onChange={(e) => {
                const selected = nigerianBanks.find((b) => b.code === e.target.value)
                setFormData({
                  ...formData,
                  bankCode: e.target.value,
                  bankName: selected?.name || '',
                })
              }}
              className="w-full px-3 py-2 border border-blue-200 rounded-lg text-black"
            >
              <option value="">Select bank</option>
              {nigerianBanks.map((bank) => (
                <option key={bank.code} value={bank.code}>
                  {bank.name}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitLoading}
            className="w-full py-2 bg-blue-900 text-white rounded-lg font-medium hover:bg-blue-950 disabled:opacity-50"
          >
            {submitLoading ? 'Adding...' : 'Add Account'}
          </button>
        </form>
      )}

      {accounts.length === 0 ? (
        <p className="text-black text-sm">No bank accounts added yet</p>
      ) : (
        <div className="space-y-2">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="flex items-center justify-between p-3 bg-blue-50 rounded-lg"
            >
              <div>
                <p className="font-medium text-black">{account.bankName}</p>
                <p className="text-sm text-black">
                  {account.accountName} • ••••{account.accountNumber.slice(-4)}
                </p>
              </div>
              <button
                onClick={() => onDelete(account.id)}
                disabled={loading}
                className="px-3 py-1 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
