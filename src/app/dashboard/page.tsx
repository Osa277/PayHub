'use client'
import React, { useState } from 'react'
import Link from 'next/link'
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
  recentTransactions: {
    id: string
    type: string
    amount: number
    currency: string
    status: string
    description: string
    createdAt: string
  }[]
}

interface TransactionOption {
  id: string
  type: string
  amount: number
  currency: string
  description: string
  createdAt: string
}

interface InvoiceItem {
  description: string
  quantity: number
  unitPrice: number
}


function InvoiceModal({
  invoice,
  onClose,
}: {
  invoice: Invoice
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-labelledby="invoice-modal-title" onClick={(e) => { if (e.target === e.currentTarget) onClose() }} onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}>
      <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 id="invoice-modal-title" className="text-xl font-bold text-black">Invoice</h2>
            <p className="text-sm text-black mt-1">#{invoice.id.slice(-8)}</p>
          </div>
          <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
              invoice.status === 'paid'
                ? 'bg-green-100 text-green-800'
                : invoice.status === 'overdue'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-blue-50 text-black'
            }`}
          >
            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
          </span>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-black">Date</span>
              <p className="font-medium text-black">{formatDate(invoice.createdAt)}</p>
            </div>
            <div>
              <span className="text-black">Due Date</span>
              <p className="font-medium text-black">{formatDate(invoice.dueDate)}</p>
            </div>
          </div>

          {invoice.items && invoice.items.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-black mb-2">Items</h3>
              <table className="w-full text-sm">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-black">Description</th>
                    <th className="px-3 py-2 text-right text-black">Qty</th>
                    <th className="px-3 py-2 text-right text-black">Price</th>
                    <th className="px-3 py-2 text-right text-black">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-100">
                  {invoice.items.map((item, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 text-black">{item.description}</td>
                      <td className="px-3 py-2 text-right text-black">{item.quantity}</td>
                      <td className="px-3 py-2 text-right text-black">
                        {formatCurrency(item.unitPrice, invoice.currency)}
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-black">
                        {formatCurrency(item.total, invoice.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="border-t border-blue-200 pt-4 flex justify-between items-center">
            <span className="text-lg font-semibold text-black">Total</span>
            <span className="text-lg font-bold text-black">
              {formatCurrency(invoice.amount, invoice.currency)}
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-3 bg-blue-50 text-black rounded-lg font-semibold hover:bg-blue-100"
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

async function downloadInvoicePDF(invoice: Invoice) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  let y = 20

  // Header
  doc.setFontSize(22)
  doc.setTextColor(30, 58, 138) // blue-900
  doc.text('INVOICE', 20, y)
  
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text(`#${invoice.id.slice(-8)}`, pageWidth - 20, y, { align: 'right' })
  y += 15

  // Status badge
  doc.setFontSize(10)
  const statusLabel = invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)
  doc.setTextColor(
    invoice.status === 'paid' ? 22 : invoice.status === 'overdue' ? 185 : 30,
    invoice.status === 'paid' ? 163 : invoice.status === 'overdue' ? 28 : 58,
    invoice.status === 'paid' ? 74 : invoice.status === 'overdue' ? 28 : 138
  )
  doc.text(`Status: ${statusLabel}`, 20, y)
  y += 10

  // Dates
  doc.setTextColor(60, 60, 60)
  doc.setFontSize(10)
  doc.text(`Date: ${formatDate(invoice.createdAt)}`, 20, y)
  doc.text(`Due Date: ${formatDate(invoice.dueDate)}`, pageWidth - 20, y, { align: 'right' })
  y += 10
  doc.text(`Currency: ${invoice.currency}`, 20, y)
  y += 15

  // Items table header
  doc.setFillColor(239, 246, 255) // blue-50
  doc.rect(15, y - 5, pageWidth - 30, 10, 'F')
  doc.setFontSize(9)
  doc.setTextColor(30, 58, 138)
  doc.text('Description', 20, y + 1)
  doc.text('Qty', 110, y + 1, { align: 'right' })
  doc.text('Unit Price', 145, y + 1, { align: 'right' })
  doc.text('Total', pageWidth - 20, y + 1, { align: 'right' })
  y += 12

  // Items
  doc.setTextColor(40, 40, 40)
  doc.setFontSize(9)
  const items = invoice.items || []
  for (const item of items) {
    if (y > 270) {
      doc.addPage()
      y = 20
    }
    doc.text(item.description, 20, y)
    doc.text(String(item.quantity), 110, y, { align: 'right' })
    doc.text(formatCurrency(item.unitPrice, invoice.currency), 145, y, { align: 'right' })
    doc.text(formatCurrency(item.total, invoice.currency), pageWidth - 20, y, { align: 'right' })
    y += 8
  }

  // Total line
  y += 5
  doc.setDrawColor(30, 58, 138)
  doc.line(15, y, pageWidth - 15, y)
  y += 10
  doc.setFontSize(12)
  doc.setTextColor(30, 58, 138)
  doc.text('Total', 20, y)
  doc.text(formatCurrency(invoice.amount, invoice.currency), pageWidth - 20, y, { align: 'right' })

  // Footer
  y += 20
  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  doc.text('Generated by PayHub', 20, y)
  doc.text(new Date().toLocaleDateString(), pageWidth - 20, y, { align: 'right' })

  doc.save(`invoice-${invoice.id.slice(-8)}.pdf`)
}

function CreateInvoiceModal({
  onClose,
  onCreated,
  currency,
}: {
  onClose: () => void
  onCreated: () => void
  currency: string
}) {
  const { data: transactions } = useApi<TransactionOption[]>('/api/transactions')
  const [transactionId, setTransactionId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: '', quantity: 1, unitPrice: 0 },
  ])
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurrencePattern, setRecurrencePattern] = useState<string>('monthly')
  const [recurrenceInterval, setRecurrenceInterval] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0 }])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }
    setItems(updated)
  }

  const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId,
          amount: totalAmount,
          currency,
          items,
          dueDate,
          ...(isRecurring && { isRecurring: true, recurrencePattern, recurrenceInterval }),
        }),
      })
      const data = await res.json()

      if (!data.success) {
        setError(data.error || 'Failed to create invoice')
        return
      }

      onCreated()
      onClose()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Filter out transactions that may already have invoices
  const availableTransactions = transactions ?? []

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-labelledby="create-invoice-title" onClick={(e) => { if (e.target === e.currentTarget) onClose() }} onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}>
      <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <h2 id="create-invoice-title" className="text-xl font-bold text-black">Create Invoice</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-black text-xl" aria-label="Close">&times;</button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-black mb-1">Transaction</label>
            <select
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-black focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">Select a transaction</option>
              {availableTransactions.map((tx) => (
                <option key={tx.id} value={tx.id}>
                  {tx.type} - {formatCurrency(tx.amount, tx.currency)} ({tx.description || tx.id.slice(-8)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-1">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
              min={new Date().toISOString().split('T')[0]}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-black focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          {/* Recurring Invoice Toggle */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
              />
              <span className="text-sm font-medium text-black">Make this a recurring invoice</span>
            </label>
            {isRecurring && (
              <div className="flex gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-black mb-1">Frequency</label>
                  <select
                    value={recurrencePattern}
                    onChange={(e) => setRecurrencePattern(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-black text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div className="w-24">
                  <label className="block text-xs font-medium text-black mb-1">Every</label>
                  <input
                    type="number"
                    value={recurrenceInterval}
                    onChange={(e) => setRecurrenceInterval(Math.max(1, parseInt(e.target.value) || 1))}
                    min={1}
                    max={365}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-black text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-black">Items</label>
              <button
                type="button"
                onClick={addItem}
                className="text-sm text-orange-500 hover:text-orange-600 font-medium"
              >
                + Add Item
              </button>
            </div>
            <div className="space-y-3">
              {items.map((item, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <input
                    type="text"
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => updateItem(i, 'description', e.target.value)}
                    required
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-black text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                  <input
                    type="number"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => updateItem(i, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                    min={1}
                    className="w-16 border border-gray-300 rounded-lg px-2 py-2 text-black text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                  <input
                    type="number"
                    placeholder="Price"
                    value={item.unitPrice || ''}
                    onChange={(e) => updateItem(i, 'unitPrice', Math.max(0, parseFloat(e.target.value) || 0))}
                    min={0}
                    step="0.01"
                    className="w-24 border border-gray-300 rounded-lg px-2 py-2 text-black text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(i)}
                      className="text-red-400 hover:text-red-600 px-1 py-2"
                    >
                      &times;
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
            <span className="text-lg font-semibold text-black">Total</span>
            <span className="text-lg font-bold text-black">
              {formatCurrency(totalAmount, currency)}
            </span>
          </div>

          <button
            type="submit"
            disabled={submitting || !transactionId || !dueDate || items.some((i) => !i.description || i.unitPrice <= 0)}
            className="w-full py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {submitting ? 'Creating...' : 'Create Invoice'}
          </button>
        </form>
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-blue-100 rounded w-40" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6">
            <div className="h-4 bg-blue-100 rounded w-24 mb-3" />
            <div className="h-7 bg-blue-100 rounded w-32" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="h-5 bg-blue-100 rounded w-32 mb-4" />
        {[1, 2].map((i) => (
          <div key={i} className="flex justify-between py-3">
            <div className="h-4 bg-blue-100 rounded w-40" />
            <div className="h-4 bg-blue-100 rounded w-20" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { data, error, isLoading, mutate } = useApi<DashboardData>('/api/dashboard', {
    dedupingInterval: 30000,
    keepPreviousData: true,
  })
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null)
  const [showCreateInvoice, setShowCreateInvoice] = useState(false)

  if (isLoading) {
    return <AuthGuard><DashboardSkeleton /></AuthGuard>
  }

  if (error) {
    return (
      <AuthGuard>
        <div className="text-center py-12">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-black mb-2">Failed to load dashboard</h2>
          <p className="text-black mb-4">{error.message}</p>
          <button onClick={() => mutate()} className="bg-blue-900 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-950">
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
  const recentTransactions = data?.recentTransactions ?? []

  const handleInvoiceStatusChange = async (invoice: Invoice, newStatus: string) => {
    try {
      const res = await fetch('/api/invoices', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: invoice.id, status: newStatus }),
      })
      const result = await res.json()
      if (result.success) {
        mutate()
      }
    } catch {
      // silently fail, user can retry
    }
  }

  return (
    <AuthGuard>
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-black">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-black mb-2">Total Balance</p>
          <p className="text-2xl font-bold text-black">
            {sym}{stats.totalBalance.toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-black mb-2">Total Spent</p>
          <p className="text-2xl font-bold text-black">
            {sym}{stats.totalSpent.toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-black mb-2">Total Received</p>
          <p className="text-2xl font-bold text-black">
            {sym}{stats.totalReceived.toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-black mb-2">Transactions</p>
          <p className="text-2xl font-bold text-blue-900">
            {stats.transactionCount}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
        <Link href="/wallet" className="bg-white rounded-lg shadow p-4 text-center hover:bg-blue-50 transition">
          <span className="text-2xl block mb-1">💰</span>
          <span className="text-sm font-medium text-black">Top Up Wallet</span>
        </Link>
        <Link href="/invoices" className="bg-white rounded-lg shadow p-4 text-center hover:bg-blue-50 transition">
          <span className="text-2xl block mb-1">📄</span>
          <span className="text-sm font-medium text-black">All Invoices</span>
        </Link>
      </div>

      {/* Recent Transactions */}
      {recentTransactions.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-blue-100 flex items-center">
            <h3 className="text-lg font-semibold text-black">Recent Transactions</h3>
          </div>
          <div className="divide-y divide-blue-50">
            {recentTransactions.map((tx) => (
              <Link key={tx.id} href={`/transactions/${tx.id}`} className="px-6 py-3 flex items-center justify-between hover:bg-blue-50 transition">
                <div className="flex items-center gap-3">
                  <span className="text-lg">
                    {tx.type === 'deposit' ? '📥' : tx.type === 'payment' ? '📤' : tx.type === 'transfer' ? '↔️' : '💸'}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-black capitalize">{tx.type}</p>
                    <p className="text-xs text-black">{tx.description || formatDate(tx.createdAt)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${tx.type === 'deposit' ? 'text-green-700' : 'text-black'}`}>
                    {tx.type === 'deposit' ? '+' : '-'}{formatCurrency(tx.amount, tx.currency)}
                  </p>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${
                    tx.status === 'completed' ? 'bg-blue-100 text-blue-900'
                      : tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {tx.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Invoices Section */}
      <div className="flex justify-between items-center">
        <div />
        <button
          onClick={() => setShowCreateInvoice(true)}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition text-sm"
        >
          + Create Invoice
        </button>
      </div>
      <InvoiceList
        invoices={invoices}
        onView={(invoice) => setViewingInvoice(invoice)}
        onDownload={(invoice) => downloadInvoiceCSV(invoice)}
        onDownloadPDF={(invoice) => downloadInvoicePDF(invoice)}
        onStatusChange={handleInvoiceStatusChange}
      />

      {viewingInvoice && (
        <InvoiceModal
          invoice={viewingInvoice}
          onClose={() => setViewingInvoice(null)}
        />
      )}

      {showCreateInvoice && (
        <CreateInvoiceModal
          onClose={() => setShowCreateInvoice(false)}
          onCreated={() => mutate()}
          currency={stats.currency}
        />
      )}
    </div>
    </AuthGuard>
  )
}
