'use client'
import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { Transaction } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'

interface TransactionListProps {
  transactions: Transaction[]
  isLoading?: boolean
  onCancelTransaction?: (id: string) => void
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  isLoading = false,
  onCancelTransaction,
}: TransactionListProps) => {
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false
      if (statusFilter !== 'all' && tx.status !== statusFilter) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return (
          (tx.description?.toLowerCase().includes(q)) ||
          (tx.recipientEmail?.toLowerCase().includes(q)) ||
          tx.id.toLowerCase().includes(q) ||
          tx.amount.toString().includes(q)
        )
      }
      return true
    })
  }, [transactions, searchQuery, typeFilter, statusFilter])

  const handleCancel = async (id: string) => {
    setCancellingId(id)
    try {
      const res = await fetch('/api/payments/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId: id }),
      })
      const data = await res.json()
      if (data.success && onCancelTransaction) {
        onCancelTransaction(id)
      }
    } catch {
      // Silently fail — user can retry
    } finally {
      setCancellingId(null)
    }
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50'
      case 'pending':
        return 'text-yellow-600 bg-yellow-50'
      case 'failed':
        return 'text-red-600 bg-red-50'
      case 'cancelled':
        return 'text-gray-600 bg-gray-50'
      default:
        return 'text-black bg-blue-50'
    }
  }

  const getTypeIcon = (type: string): string => {
    switch (type) {
      case 'payment':
        return '💳'
      case 'transfer':
        return '↔️'
      case 'deposit':
        return '📥'
      case 'withdrawal':
        return '📤'
      default:
        return '💰'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-blue-100">
        <h3 className="text-lg font-semibold text-black">Recent Transactions</h3>
      </div>

      {/* Filters */}
      {transactions.length > 0 && (
        <div className="px-6 py-3 border-b border-blue-50 flex flex-wrap gap-3 items-center">
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 min-w-[180px] px-3 py-2 border border-gray-200 rounded-lg text-sm text-black focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-black focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          >
            <option value="all">All types</option>
            <option value="payment">Payment</option>
            <option value="transfer">Transfer</option>
            <option value="deposit">Deposit</option>
            <option value="withdrawal">Withdrawal</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-black focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          >
            <option value="all">All statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
          {(searchQuery || typeFilter !== 'all' || statusFilter !== 'all') && (
            <button
              onClick={() => { setSearchQuery(''); setTypeFilter('all'); setStatusFilter('all') }}
              className="text-sm text-orange-500 hover:text-orange-600 font-medium"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="px-6 py-8 text-center text-black">Loading...</div>
      ) : transactions.length === 0 ? (
        <div className="px-6 py-8 text-center text-black">
          No transactions yet
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="px-6 py-8 text-center text-black">
          No transactions match your filters
        </div>
      ) : (
        <div className="divide-y divide-blue-50">
          {filteredTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="px-6 py-4 hover:bg-blue-50 transition"
            >
              <div className="flex items-center justify-between">
                <Link href={`/transactions/${transaction.id}`} className="flex items-center gap-4 flex-1 min-w-0">
                  <span className="text-2xl">
                    {getTypeIcon(transaction.type)}
                  </span>
                  <div>
                    <p className="font-medium text-black">
                      {transaction.description || transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                    </p>
                    {transaction.recipientEmail && (
                      <p className="text-xs text-black/60">
                        To: {transaction.recipientEmail}
                      </p>
                    )}
                    <p className="text-sm text-black">
                      {formatDate(transaction.createdAt)}
                    </p>
                  </div>
                </Link>
                <div className="text-right">
                  <p className="font-semibold text-black">
                    {formatCurrency(transaction.amount, transaction.currency)}
                  </p>
                  <span
                    className={`inline-block text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(transaction.status)}`}
                  >
                    {transaction.status.charAt(0).toUpperCase() +
                      transaction.status.slice(1)}
                  </span>
                  {transaction.status === 'pending' && (
                    <button
                      onClick={() => handleCancel(transaction.id)}
                      disabled={cancellingId === transaction.id}
                      className="mt-1 text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
                    >
                      {cancellingId === transaction.id ? 'Cancelling...' : 'Cancel'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
