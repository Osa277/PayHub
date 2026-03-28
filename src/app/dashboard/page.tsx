'use client'
import React, { useState } from 'react'
import { Invoice } from '@/types'
import { InvoiceList } from '@/components/InvoiceList'
import { AuthGuard } from '@/components/AuthGuard'
import { useApi } from '@/lib/hooks'
import { formatCurrency, formatDate } from '@/lib/utils'
import { CURRENCY_SYMBOLS } from '@/lib/constants'

interface DashboardData {
  stats: {
    totalBalance: number
    totalSpent: number
    totalReceived: number
    transactionCount: number
    currency: string
  }
  invoices: Invoice[]
}

function InvoiceModal({
  invoice,
  onClose,
}: {
  invoice: Invoice
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Invoice</h2>
            <p className="text-sm text-gray-500 mt-1">#{invoice.id.slice(-8)}</p>
          </div>
          <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
              invoice.status === 'paid'
                ? 'bg-green-100 text-green-800'
                : invoice.status === 'overdue'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-800'
            }`}
          >
            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
          </span>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Date</span>
              <p className="font-medium text-gray-900">{formatDate(invoice.createdAt)}</p>
            </div>
            <div>
              <span className="text-gray-500">Due Date</span>
              <p className="font-medium text-gray-900">{formatDate(invoice.dueDate)}</p>
            </div>
          </div>

          {invoice.items && invoice.items.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Items</h3>
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-gray-600">Description</th>
                    <th className="px-3 py-2 text-right text-gray-600">Qty</th>
                    <th className="px-3 py-2 text-right text-gray-600">Price</th>
                    <th className="px-3 py-2 text-right text-gray-600">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invoice.items.map((item, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 text-gray-900">{item.description}</td>
                      <td className="px-3 py-2 text-right text-gray-700">{item.quantity}</td>
                      <td className="px-3 py-2 text-right text-gray-700">
                        {formatCurrency(item.unitPrice, invoice.currency)}
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-gray-900">
                        {formatCurrency(item.total, invoice.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-900">Total</span>
            <span className="text-lg font-bold text-gray-900">
              {formatCurrency(invoice.amount, invoice.currency)}
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200"
        >
          Close
        </button>
      </div>
    </div>
  )
}

function downloadInvoiceCSV(invoice: Invoice) {
  const rows = [
    ['Invoice', '#' + invoice.id.slice(-8)],
    ['Status', invoice.status],
    ['Date', formatDate(invoice.createdAt)],
    ['Due Date', formatDate(invoice.dueDate)],
    ['Currency', invoice.currency],
    [],
    ['Description', 'Quantity', 'Unit Price', 'Total'],
    ...(invoice.items || []).map((item) => [
      item.description,
      String(item.quantity),
      String(item.unitPrice),
      String(item.total),
    ]),
    [],
    ['Total', '', '', String(invoice.amount)],
  ]
  const csv = rows.map((r) => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `invoice-${invoice.id.slice(-8)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-40" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6">
            <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
            <div className="h-7 bg-gray-200 rounded w-32" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="h-5 bg-gray-200 rounded w-32 mb-4" />
        {[1, 2].map((i) => (
          <div key={i} className="flex justify-between py-3">
            <div className="h-4 bg-gray-200 rounded w-40" />
            <div className="h-4 bg-gray-200 rounded w-20" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { data, error, isLoading, mutate } = useApi<DashboardData>('/api/dashboard')
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null)

  if (isLoading) {
    return <AuthGuard><DashboardSkeleton /></AuthGuard>
  }

  if (error) {
    return (
      <AuthGuard>
        <div className="text-center py-12">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Failed to load dashboard</h2>
          <p className="text-gray-500 mb-4">{error.message}</p>
          <button onClick={() => mutate()} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700">
            Retry
          </button>
        </div>
      </AuthGuard>
    )
  }

  const stats = data?.stats ?? {
    totalBalance: 0,
    totalSpent: 0,
    totalReceived: 0,
    transactionCount: 0,
    currency: 'USD',
  }
  const sym = CURRENCY_SYMBOLS[stats.currency] || '$'
  const invoices = data?.invoices ?? []

  return (
    <AuthGuard>
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-2">Total Balance</p>
          <p className="text-2xl font-bold text-gray-900">
            {sym}{stats.totalBalance.toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-2">Total Spent</p>
          <p className="text-2xl font-bold text-red-600">
            {sym}{stats.totalSpent.toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-2">Total Received</p>
          <p className="text-2xl font-bold text-green-600">
            {sym}{stats.totalReceived.toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-2">Transactions</p>
          <p className="text-2xl font-bold text-blue-600">
            {stats.transactionCount}
          </p>
        </div>
      </div>

      {/* Invoices Section */}
      <InvoiceList
        invoices={invoices}
        onView={(invoice) => setViewingInvoice(invoice)}
        onDownload={(invoice) => downloadInvoiceCSV(invoice)}
      />

      {viewingInvoice && (
        <InvoiceModal
          invoice={viewingInvoice}
          onClose={() => setViewingInvoice(null)}
        />
      )}
    </div>
    </AuthGuard>
  )
}
