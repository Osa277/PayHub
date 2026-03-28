import React from 'react'
import { Invoice } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'

interface InvoiceListProps {
  invoices: Invoice[]
  onView?: (invoice: Invoice) => void
  onDownload?: (invoice: Invoice) => void
}

export const InvoiceList: React.FC<InvoiceListProps> = ({
  invoices,
  onView,
  onDownload,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'sent':
        return 'bg-blue-100 text-blue-800'
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      case 'overdue':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Invoices</h3>
      </div>

      {invoices.length === 0 ? (
        <div className="px-6 py-8 text-center text-gray-500">
          No invoices yet
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                  Invoice #
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900 font-mono">
                    #{invoice.id.slice(-8)}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {formatCurrency(invoice.amount, invoice.currency)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
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
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View
                      </button>
                    )}
                    {onDownload && (
                      <button
                        onClick={() => onDownload(invoice)}
                        className="text-green-600 hover:text-green-800 font-medium"
                      >
                        Download
                      </button>
                    )}
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
