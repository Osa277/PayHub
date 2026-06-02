'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface BankAccount {
  id: string
  accountNumber: string
  bankCode: string
  bankName: string
  accountName: string
  isDefault: boolean
  createdAt: string
}

export default function BankAccountsPage() {
  const { status } = useSession()
  const router = useRouter()
  
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    accountNumber: '',
    bankCode: '',
    bankName: '',
    accountName: '',
  })
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [globalSuccess, setGlobalSuccess] = useState<string | null>(null)

  // Show toast messages
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    if (type === 'success') {
      setGlobalSuccess(message)
      setTimeout(() => setGlobalSuccess(null), 4000)
    } else {
      setGlobalError(message)
      setTimeout(() => setGlobalError(null), 4000)
    }
  }

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  // Fetch bank accounts
  useEffect(() => {
    const fetchAccounts = async () => {
      setIsLoading(true)
      try {
        const res = await fetch('/api/bank-accounts')
        if (!res.ok) {
          throw new Error(`Failed to fetch: ${res.status}`)
        }
        const data = await res.json()
        if (data.success) {
          setAccounts(data.data || data.accounts || [])
        } else {
          setAccounts([])
        }
      } catch (error) {
        console.error('Failed to fetch bank accounts:', error)
        setAccounts([])
        if (status === 'authenticated') {
          showToast('Failed to load bank accounts', 'error')
        }
      } finally {
        setIsLoading(false)
      }
    }

    if (status === 'authenticated') {
      fetchAccounts()
    }
  }, [status])

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setIsSubmitting(true)

    // Validate form
    if (!formData.accountName || !formData.bankCode || !formData.accountNumber) {
      setFormError('Please fill in all fields')
      setIsSubmitting(false)
      return
    }

    try {
      const res = await fetch('/api/bank-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!data.success) {
        setFormError(data.error || 'Failed to add bank account')
        return
      }

      // Add new account to list
      const newAccount = data.account || data.data
      if (newAccount) {
        setAccounts([newAccount, ...accounts])
      }
      setFormData({ accountNumber: '', bankCode: '', bankName: '', accountName: '' })
      setShowAddForm(false)
      showToast('Bank account added successfully!', 'success')
    } catch (error) {
      setFormError('An error occurred. Please try again.')
      console.error('Error adding account:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteAccount = async (id: string) => {
    if (!confirm('Are you sure you want to delete this bank account?')) return

    setDeletingId(id)
    try {
      const res = await fetch(`/api/bank-accounts/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error(`Delete failed: ${res.status}`)
      }

      const data = await res.json()

      if (!data.success) {
        showToast('Failed to delete bank account', 'error')
        return
      }

      setAccounts(accounts.filter((acc) => acc.id !== id))
      showToast('Bank account deleted successfully', 'success')
    } catch (error) {
      showToast('Error deleting bank account', 'error')
      console.error('Error deleting account:', error)
    } finally {
      setDeletingId(null)
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      const res = await fetch(`/api/bank-accounts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      })

      if (!res.ok) {
        throw new Error(`PATCH failed: ${res.status}`)
      }

      const data = await res.json()

      if (!data.success) {
        showToast('Failed to set default account', 'error')
        return
      }

      // Update accounts list
      setAccounts(
        accounts.map((acc) => ({
          ...acc,
          isDefault: acc.id === id,
        }))
      )
      showToast('Default account updated', 'success')
    } catch (error) {
      showToast('Error updating default account', 'error')
      console.error('Error:', error)
    }
  }

  const maskAccountNumber = (accountNumber: string) => {
    if (accountNumber.length <= 4) return accountNumber
    return '*'.repeat(accountNumber.length - 4) + accountNumber.slice(-4)
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin text-4xl mb-4">⏳</div>
            <p className="text-black">Loading bank accounts...</p>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast Messages */}
      {globalError && (
        <div className="fixed bottom-4 right-4 z-50 bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg">
          ✕ {globalError}
        </div>
      )}
      {globalSuccess && (
        <div className="fixed bottom-4 right-4 z-50 bg-blue-900 text-white px-4 py-3 rounded-lg shadow-lg">
          ✓ {globalSuccess}
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-black">Bank Accounts</h1>
            <p className="text-black/70 mt-1">Manage your saved bank accounts for withdrawals</p>
          </div>
          <Link href="/wallet" className="text-blue-900 hover:text-blue-950 font-semibold">
            ← Back to Wallet
          </Link>
        </div>

        {/* Add Account Section */}
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full bg-blue-900 hover:bg-blue-950 text-white py-3 rounded-lg font-semibold mb-8 transition"
          >
            + Add New Bank Account
          </button>
        )}

        {/* Add Account Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold text-black mb-4">Add Bank Account</h2>

            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddAccount} className="space-y-4">
              <div>
                <label htmlFor="accountName" className="block text-sm font-medium text-black mb-1">
                  Account Holder Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="accountName"
                  type="text"
                  required
                  value={formData.accountName}
                  onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                  className="w-full px-4 py-2 border border-blue-200 rounded-lg text-black placeholder-gray-400 focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                  placeholder="Your Name"
                />
              </div>

              <div>
                <label htmlFor="bankName" className="block text-sm font-medium text-black mb-1">
                  Bank Name <span className="text-red-500">*</span>
                </label>
                <select
                  id="bankName"
                  required
                  value={`${formData.bankCode}|${formData.bankName}`}
                  onChange={(e) => {
                    const [code, name] = e.target.value.split('|')
                    setFormData({
                      ...formData,
                      bankCode: code,
                      bankName: name,
                    })
                  }}
                  className="w-full px-3 py-2 border-2 border-blue-200 rounded-lg text-black bg-white hover:border-blue-300 focus:outline-none focus:border-blue-900 focus:ring-2 focus:ring-blue-900"
                >
                  <option value="|">Select your bank</option>
                  <option value="033|United Bank for Africa">United Bank for Africa (UBA)</option>
                  <option value="044|Access Bank">Access Bank</option>
                  <option value="050|Ecobank">Ecobank</option>
                  <option value="057|Zenith Bank">Zenith Bank</option>
                  <option value="058|Guarantee Trust Bank">Guarantee Trust Bank (GTB)</option>
                  <option value="063|Diamond Bank">Diamond Bank</option>
                  <option value="069|Standard Chartered Bank">Standard Chartered Bank</option>
                  <option value="076|Polaris Bank">Polaris Bank</option>
                  <option value="090|First Bank">First Bank</option>
                </select>
              </div>

              <div>
                <label htmlFor="accountNumber" className="block text-sm font-medium text-black mb-1">
                  Account Number <span className="text-red-500">*</span>
                </label>
                <input
                  id="accountNumber"
                  type="text"
                  required
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  maxLength={20}
                  className="w-full px-4 py-2 border border-blue-200 rounded-lg text-black placeholder-gray-400 focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                  placeholder="0123456789"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false)
                    setFormError('')
                  }}
                  className="flex-1 bg-blue-50 text-black py-2 rounded-lg font-semibold hover:bg-blue-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-900 text-white py-2 rounded-lg font-semibold hover:bg-blue-950 disabled:opacity-50 transition"
                >
                  {isSubmitting ? 'Adding...' : 'Add Account'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Accounts List */}
        {accounts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-4xl mb-4">🏦</div>
            <h3 className="text-xl font-semibold text-black mb-2">No Bank Accounts Yet</h3>
            <p className="text-black/70 mb-6">Add your first bank account to make withdrawals</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-block bg-blue-900 hover:bg-blue-950 text-white px-6 py-3 rounded-lg font-semibold transition"
            >
              + Add Bank Account
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {accounts.map((account) => (
              <div key={account.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-black">{account.bankName}</h3>
                      {account.isDefault && (
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-black/70 text-sm mb-3">
                      <span className="font-medium">Account Holder:</span> {account.accountName}
                    </p>
                    <p className="text-black/70 text-sm mb-3">
                      <span className="font-medium">Account Number:</span> {maskAccountNumber(account.accountNumber)}
                    </p>
                    <p className="text-black/50 text-xs">
                      Added {new Date(account.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 ml-4">
                    {!account.isDefault && (
                      <button
                        onClick={() => handleSetDefault(account.id)}
                        className="px-4 py-2 bg-blue-50 text-blue-900 rounded-lg font-semibold hover:bg-blue-100 transition text-sm"
                      >
                        Set Default
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteAccount(account.id)}
                      disabled={deletingId === account.id}
                      className="px-4 py-2 bg-red-50 text-red-700 rounded-lg font-semibold hover:bg-red-100 disabled:opacity-50 transition text-sm"
                    >
                      {deletingId === account.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
