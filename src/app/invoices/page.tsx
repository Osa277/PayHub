'use client'

import React, { useState } from 'react'
import { Invoice } from '@/types'
import { InvoiceList } from '@/components/InvoiceList'
import { AuthGuard } from '@/components/AuthGuard'
import { useApi } from '@/lib/hooks'
import { formatCurrency, formatDate } from '@/lib/utils'

function InvoiceModal({
  invoice,
  onClose,
  onStatusChange,
  onSend,
}: {
  invoice: Invoice
  onClose: () => void
  onStatusChange: (invoice: Invoice, newStatus: string) => void
  onSend: (invoice: Invoice, email: string) => void
}) {
  const [sendEmail, setSendEmail] = useState('')
  const [showSendForm, setShowSendForm] = useState(false)

  const STATUS_TRANSITIONS: Record<string, { label: string; next: string }[]> = {
    draft: [{ label: 'Mark as Sent', next: 'sent' }],
    sent: [
      { label: 'Mark as Paid', next: 'paid' },
      { label: 'Mark as Overdue', next: 'overdue' },
    ],
    overdue: [{ label: 'Mark as Paid', next: 'paid' }],
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget) onClose() }} onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}>
      <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-bold text-black">Invoice</h2>
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

        {/* Recipient info */}
        {invoice.recipientEmail && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm">
            <span className="text-black font-medium">Recipient: </span>
            <span className="text-black">
              {invoice.recipientName ? `${invoice.recipientName} (${invoice.recipientEmail})` : invoice.recipientEmail}
            </span>
          </div>
        )}

        {/* Send invoice form for draft invoices */}
        {invoice.status === 'draft' && (
          <div className="mt-4">
            {!showSendForm ? (
              <button
                onClick={() => {
                  setSendEmail(invoice.recipientEmail || '')
                  setShowSendForm(true)
                }}
                className="w-full py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 text-sm transition"
              >
                Send Invoice via Email
              </button>
            ) : (
              <div className="space-y-3 p-4 bg-blue-50 rounded-lg">
                <label className="block text-sm font-medium text-black">Recipient Email</label>
                <input
                  type="email"
                  value={sendEmail}
                  onChange={(e) => setSendEmail(e.target.value)}
                  placeholder="Recipient email"
                  className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (sendEmail.trim()) {
                        onSend(invoice, sendEmail.trim())
                        onClose()
                      }
                    }}
                    disabled={!sendEmail.trim()}
                    className="flex-1 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 text-sm transition disabled:opacity-50"
                  >
                    Send
                  </button>
                  <button
                    onClick={() => setShowSendForm(false)}
                    className="py-2 px-4 bg-white text-black rounded-lg font-medium hover:bg-gray-100 text-sm transition border border-blue-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Status transition buttons (non-send transitions) */}
        {STATUS_TRANSITIONS[invoice.status] && invoice.status !== 'draft' && (
          <div className="mt-4 flex gap-2">
            {STATUS_TRANSITIONS[invoice.status].map((transition) => (
              <button
                key={transition.next}
                onClick={() => {
                  onStatusChange(invoice, transition.next)
                  onClose()
                }}
                className="flex-1 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 text-sm transition"
              >
                {transition.label}
              </button>
            ))}
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-3 w-full py-3 bg-blue-50 text-black rounded-lg font-semibold hover:bg-blue-100"
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

  doc.setFontSize(22)
  doc.setTextColor(30, 58, 138)
  doc.text('INVOICE', 20, y)
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text(`#${invoice.id.slice(-8)}`, pageWidth - 20, y, { align: 'right' })
  y += 15

  const statusLabel = invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)
  doc.setFontSize(10)
  doc.setTextColor(
    invoice.status === 'paid' ? 22 : invoice.status === 'overdue' ? 185 : 30,
    invoice.status === 'paid' ? 163 : invoice.status === 'overdue' ? 28 : 58,
    invoice.status === 'paid' ? 74 : invoice.status === 'overdue' ? 28 : 138
  )
  doc.text(`Status: ${statusLabel}`, 20, y)
  y += 10

  doc.setTextColor(60, 60, 60)
  doc.text(`Date: ${formatDate(invoice.createdAt)}`, 20, y)
  doc.text(`Due Date: ${formatDate(invoice.dueDate)}`, pageWidth - 20, y, { align: 'right' })
  y += 10
  doc.text(`Currency: ${invoice.currency}`, 20, y)
  y += 15

  doc.setFillColor(239, 246, 255)
  doc.rect(15, y - 5, pageWidth - 30, 10, 'F')
  doc.setFontSize(9)
  doc.setTextColor(30, 58, 138)
  doc.text('Description', 20, y + 1)
  doc.text('Qty', 110, y + 1, { align: 'right' })
  doc.text('Unit Price', 145, y + 1, { align: 'right' })
  doc.text('Total', pageWidth - 20, y + 1, { align: 'right' })
  y += 12

  doc.setTextColor(40, 40, 40)
  doc.setFontSize(9)
  for (const item of invoice.items || []) {
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

  y += 5
  doc.setDrawColor(30, 58, 138)
  doc.line(15, y, pageWidth - 15, y)
  y += 10
  doc.setFontSize(12)
  doc.setTextColor(30, 58, 138)
  doc.text('Total', 20, y)
  doc.text(formatCurrency(invoice.amount, invoice.currency), pageWidth - 20, y, { align: 'right' })

  y += 20
  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  doc.text('Generated by PayHub', 20, y)
  doc.text(new Date().toLocaleDateString(), pageWidth - 20, y, { align: 'right' })

  doc.save(`invoice-${invoice.id.slice(-8)}.pdf`)
}

export default function InvoicesPage() {
  const { data: invoices, mutate } = useApi<Invoice[]>('/api/invoices')
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')

  const allInvoices = invoices ?? []

  // Filter invoices
  const filteredInvoices = allInvoices.filter((inv) => {
    if (statusFilter && inv.status !== statusFilter) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const matchesId = inv.id.toLowerCase().includes(q)
      const matchesAmount = String(inv.amount).includes(q)
      const matchesItem = inv.items?.some((item) => item.description.toLowerCase().includes(q))
      if (!matchesId && !matchesAmount && !matchesItem) return false
    }
    return true
  })

  const handleStatusChange = async (invoice: Invoice, newStatus: string) => {
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
      // silently fail
    }
  }

  const handleSendInvoice = async (invoice: Invoice, recipientEmail: string) => {
    try {
      const res = await fetch('/api/invoices', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: invoice.id, status: 'sent', recipientEmail }),
      })
      const result = await res.json()
      if (result.success) {
        mutate()
      }
    } catch {
      // silently fail
    }
  }

  // Stats
  const statusCounts = allInvoices.reduce(
    (acc, inv) => {
      acc[inv.status] = (acc[inv.status] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  return (
    <AuthGuard>
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-black">📄 Invoices</h1>
              <p className="text-black mt-2">
                Manage, track, and download your invoices
              </p>
            </div>
          </div>

          {/* Status Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {(['draft', 'sent', 'paid', 'overdue'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(statusFilter === status ? '' : status)}
                className={`bg-white rounded-lg shadow p-4 text-left transition hover:ring-2 hover:ring-blue-200 ${
                  statusFilter === status ? 'ring-2 ring-blue-900' : ''
                }`}
              >
                <p className="text-xs font-medium text-black capitalize">{status}</p>
                <p className="text-2xl font-bold text-black mt-1">{statusCounts[status] || 0}</p>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="mb-6 flex gap-4">
            <input
              type="text"
              placeholder="Search invoices by ID, amount, or item..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
            {(statusFilter || searchQuery) && (
              <button
                onClick={() => { setStatusFilter(''); setSearchQuery('') }}
                className="px-4 py-2 text-sm text-blue-900 hover:text-blue-950 font-medium"
              >
                Clear
              </button>
            )}
          </div>

          {/* Invoice List */}
          <InvoiceList
            invoices={filteredInvoices}
            onView={(invoice) => setViewingInvoice(invoice)}
            onDownload={(invoice) => downloadInvoiceCSV(invoice)}
            onDownloadPDF={(invoice) => downloadInvoicePDF(invoice)}
            onStatusChange={handleStatusChange}
            onSend={(invoice) => setViewingInvoice(invoice)}
          />

          {viewingInvoice && (
            <InvoiceModal
              invoice={viewingInvoice}
              onClose={() => setViewingInvoice(null)}
              onStatusChange={handleStatusChange}
              onSend={handleSendInvoice}
            />
          )}
        </div>
      </div>
    </AuthGuard>
  )
}
