import React from 'react'
import { Invoice } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'

interface InvoiceListProps {
  invoices: Invoice[]
  onView?: (invoice: Invoice) => void
  onDownload?: (invoice: Invoice) => void
  onDownloadPDF?: (invoice: Invoice) => void
  onStatusChange?: (invoice: Invoice, newStatus: string) => void
  onSend?: (invoice: Invoice) => void
}

const STATUS_TRANSITIONS: Record<string, { label: string; next: string }[]> = {
  draft: [{ label: 'Mark Sent', next: 'sent' }],
  sent: [
    { label: 'Mark Paid', next: 'paid' },
    { label: 'Mark Overdue', next: 'overdue' },
  ],
  overdue: [{ label: 'Mark Paid', next: 'paid' }],
}

export const InvoiceList: React.FC<InvoiceListProps> = ({
  invoices,
  onView,
  onDownload,
  onDownloadPDF,
  onStatusChange,
  onSend,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-blue-100 text-blue-900'
      case 'sent':
        return 'bg-blue-50 text-blue-900'
      case 'draft':
        return 'bg-white text-black border border-blue-200'
      case 'overdue':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-white text-black border border-blue-200'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-blue-100">
        <h3 className="text-lg font-semibold text-black">Invoices</h3>
      </div>

      {invoices.length === 0 ? (
        <div className="px-6 py-8 text-center text-black">
          No invoices yet
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-blue-50 border-b border-blue-100">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-black">
                  Invoice #
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-black">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-black">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-black">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-black">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-50">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-blue-50">
                  <td className="px-6 py-4 text-sm text-black font-mono">
                    #{invoice.id.slice(-8)}
                    {invoice.isRecurring && (
                      <span className="ml-2 inline-block px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-800 font-medium" title={`Repeats every ${invoice.recurrenceInterval ?? 1} ${invoice.recurrencePattern ?? 'month'}(s)`}>
                        🔁 Recurring
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-black">
                    {formatCurrency(invoice.amount, invoice.currency)}
                  </td>
                  <td className="px-6 py-4 text-sm text-black">
                    {formatDate(invoice.dueDate)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}
                    >
                      {invoice.status.charAt(0).toUpperCase() +
                        invoice.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    {onView && (
                      <button
                        onClick={() => onView(invoice)}
                        className="text-blue-900 hover:text-blue-950 font-medium"
                      >
                        View
                      </button>
                    )}
                    {onDownload && (
                      <button
                        onClick={() => onDownload(invoice)}
                        className="text-blue-900 hover:text-blue-950 font-medium"
                      >
                        CSV
                      </button>
                    )}
                    {onDownloadPDF && (
                      <button
                        onClick={() => onDownloadPDF(invoice)}
                        className="text-orange-500 hover:text-orange-600 font-medium"
                      >
                        PDF
                      </button>
                    )}
                    {onSend && invoice.status === 'draft' && (
                      <button
                        onClick={() => onSend(invoice)}
                        className="text-orange-500 hover:text-orange-600 font-medium"
                      >
                        Send
                      </button>
                    )}
                    {onStatusChange && STATUS_TRANSITIONS[invoice.status]?.map((transition) => (
                      <button
                        key={transition.next}
                        onClick={() => onStatusChange(invoice, transition.next)}
                        className="text-green-700 hover:text-green-800 font-medium"
                      >
                        {transition.label}
                      </button>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
