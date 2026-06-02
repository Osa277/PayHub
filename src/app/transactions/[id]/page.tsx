'use client'

import React from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { AuthGuard } from '@/components/AuthGuard'
import { useApi } from '@/lib/hooks'
import { formatCurrency, formatDate, formatTime } from '@/lib/utils'

interface TransactionDetail {
  id: string
  userId: string
  type: string
  amount: number
  currency: string
  status: string
  description: string
  recipientId?: string | null
  recipientName?: string | null
  recipientEmail?: string | null
  fee: number
  metadata?: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
  invoice?: {
    id: string
    status: string
    amount: unknown
    currency: string
    dueDate: string
  } | null
  bankAccount?: {
    bankName: string
    accountNumber: string
    accountName: string
  } | null
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800'
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'
    case 'failed':
      return 'bg-red-100 text-red-800'
    case 'cancelled':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-blue-100 text-blue-800'
  }
}

const getTypeIcon = (type: string) => {
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

export default function TransactionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: transaction, error, isLoading } = useApi<TransactionDetail>(
    id ? `/api/transactions/${id}` : null
  )

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-6 bg-blue-100 rounded w-48" />
            <div className="bg-white rounded-lg shadow p-6 space-y-4">
              <div className="h-10 bg-blue-100 rounded w-32" />
              <div className="h-4 bg-blue-100 rounded w-64" />
              <div className="h-4 bg-blue-100 rounded w-48" />
              <div className="h-4 bg-blue-100 rounded w-56" />
            </div>
          </div>
        </div>
      </AuthGuard>
    )
  }

  if (error || !transaction) {
    return (
      <AuthGuard>
        <div className="max-w-2xl mx-auto px-4 py-8 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-black mb-2">Transaction not found</h2>
          <p className="text-black mb-4">{error?.message || 'This transaction does not exist or you do not have access.'}</p>
          <Link
            href="/dashboard"
            className="inline-block bg-blue-900 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-950"
          >
            Back to Dashboard
          </Link>
        </div>
      </AuthGuard>
    )
  }

  const netAmount = transaction.type === 'deposit'
    ? transaction.amount
    : transaction.amount + transaction.fee

  return (
    <AuthGuard>
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="text-sm text-blue-900 hover:text-blue-950 font-medium mb-6 inline-block"
        >
          ← Back to Dashboard
        </Link>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Header */}
          <div className="px-6 py-5 border-b border-blue-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{getTypeIcon(transaction.type)}</span>
                <div>
                  <h1 className="text-xl font-bold text-black capitalize">
                    {transaction.type}
                  </h1>
                  <p className="text-sm text-black/60 font-mono">
                    #{transaction.id.slice(-8)}
                  </p>
                </div>
              </div>
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(transaction.status)}`}
              >
                {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
              </span>
            </div>
          </div>

          {/* Amount Section */}
          <div className="px-6 py-5 border-b border-blue-100 bg-blue-50">
            <div className="text-center">
              <p className="text-sm text-black mb-1">
                {transaction.type === 'deposit' ? 'Amount Received' : 'Amount Sent'}
              </p>
              <p className={`text-3xl font-bold ${transaction.type === 'deposit' ? 'text-green-700' : 'text-black'}`}>
                {transaction.type === 'deposit' ? '+' : '-'}{formatCurrency(transaction.amount, transaction.currency)}
              </p>
              {transaction.fee > 0 && (
                <p className="text-sm text-black/60 mt-1">
                  Fee: {formatCurrency(transaction.fee, transaction.currency)} · Net: {formatCurrency(netAmount, transaction.currency)}
                </p>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="px-6 py-5 space-y-4">
            {transaction.description && (
              <div className="flex justify-between">
                <span className="text-sm text-black/60">Description</span>
                <span className="text-sm text-black font-medium text-right max-w-[60%]">
                  {transaction.description}
                </span>
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-sm text-black/60">Date</span>
              <span className="text-sm text-black font-medium">
                {formatDate(transaction.createdAt)} at {formatTime(transaction.createdAt)}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-sm text-black/60">Currency</span>
              <span className="text-sm text-black font-medium">{transaction.currency}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-sm text-black/60">Transaction ID</span>
              <span className="text-sm text-black font-mono">{transaction.id}</span>
            </div>

            {transaction.recipientEmail && (
              <div className="flex justify-between">
                <span className="text-sm text-black/60">Recipient</span>
                <span className="text-sm text-black font-medium">
                  {transaction.recipientName
                    ? `${transaction.recipientName} (${transaction.recipientEmail})`
                    : transaction.recipientEmail}
                </span>
              </div>
            )}

            {transaction.bankAccount && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h3 className="text-sm font-semibold text-black mb-2">Bank Account</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-black/60">Bank</span>
                    <span className="text-black font-medium">{transaction.bankAccount.bankName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-black/60">Account</span>
                    <span className="text-black font-medium">{transaction.bankAccount.accountName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-black/60">Number</span>
                    <span className="text-black font-mono">
                      ****{transaction.bankAccount.accountNumber.slice(-4)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {transaction.metadata && Object.keys(transaction.metadata).length > 0 && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-semibold text-black mb-2">Additional Details</h3>
                <div className="space-y-1 text-sm">
                  {Object.entries(transaction.metadata).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-black/60 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <span className="text-black font-medium">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Related Invoice */}
          {transaction.invoice && (
            <div className="px-6 py-4 border-t border-blue-100">
              <Link
                href="/invoices"
                className="flex items-center justify-between p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
              >
                <div>
                  <p className="text-sm font-medium text-black">
                    📄 Invoice #{transaction.invoice.id.slice(-8)}
                  </p>
                  <p className="text-xs text-black/60">
                    Status: {transaction.invoice.status} · Due: {formatDate(transaction.invoice.dueDate)}
                  </p>
                </div>
                <span className="text-blue-900 font-medium text-sm">View →</span>
              </Link>
            </div>
          )}

          {/* Updated timestamp */}
          <div className="px-6 py-3 bg-gray-50 text-xs text-black/40 text-right">
            Last updated: {formatDate(transaction.updatedAt)} at {formatTime(transaction.updatedAt)}
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
