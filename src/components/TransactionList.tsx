'use client'
import React from 'react'
import { Transaction } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'

interface TransactionListProps {
  transactions: Transaction[]
  isLoading?: boolean
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  isLoading = false,
}: TransactionListProps) => {
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50'
      case 'pending':
        return 'text-yellow-600 bg-yellow-50'
      case 'failed':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
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
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
      </div>
      {isLoading ? (
        <div className="px-6 py-8 text-center text-gray-500">Loading...</div>
      ) : transactions.length === 0 ? (
        <div className="px-6 py-8 text-center text-gray-500">
          No transactions yet
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="px-6 py-4 hover:bg-gray-50 transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-2xl">
                    {getTypeIcon(transaction.type)}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">
                      {transaction.description || transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                    </p>
                    {transaction.recipientEmail && (
                      <p className="text-xs text-gray-400">
                        To: {transaction.recipientEmail}
                      </p>
                    )}
                    <p className="text-sm text-gray-500">
                      {formatDate(transaction.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(transaction.amount, transaction.currency)}
                  </p>
                  <span
                    className={`inline-block text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(transaction.status)}`}
                  >
                    {transaction.status.charAt(0).toUpperCase() +
                      transaction.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
