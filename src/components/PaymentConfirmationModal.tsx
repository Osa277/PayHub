'use client'

import { useState } from 'react'

interface PaymentConfirmationModalProps {
  isOpen: boolean
  title: string
  message: string
  amount: string
  currency: string
  fee?: string
  total?: string
  confirmText?: string
  cancelText?: string
  isLoading?: boolean
  onConfirm: () => void
  onCancel: () => void
  isDangerous?: boolean // For sensitive operations like sending funds
}

export function PaymentConfirmationModal({
  isOpen,
  title,
  message,
  amount,
  currency,
  fee,
  total,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false,
  onConfirm,
  onCancel,
  isDangerous = false,
}: PaymentConfirmationModalProps) {
  const [checkbox, setCheckbox] = useState(false)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4">
        {/* Header */}
        <div
          className={`px-6 py-4 border-b ${isDangerous ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}
        >
          <h2 className={`text-lg font-bold ${isDangerous ? 'text-red-900' : 'text-blue-900'}`}>
            {isDangerous ? '⚠️ ' : ''}
            {title}
          </h2>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          <p className="text-gray-700 text-sm">{message}</p>

          {/* Amount Summary */}
          <div className={`p-4 rounded-lg ${isDangerous ? 'bg-red-50' : 'bg-gray-50'}`}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Amount:</span>
              <span className="font-bold text-gray-900">
                {amount} {currency}
              </span>
            </div>

            {fee && (
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Network Fee:</span>
                <span className="text-gray-700">{fee} {currency}</span>
              </div>
            )}

            {total && (
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="font-bold text-gray-900">Total:</span>
                <span className="font-bold text-lg text-gray-900">{total} {currency}</span>
              </div>
            )}
          </div>

          {/* Warning for dangerous operations */}
          {isDangerous && (
            <div className="p-3 bg-red-100 border border-red-300 rounded text-red-800 text-xs">
              <p className="font-bold mb-1">⚠️ This action cannot be undone!</p>
              <p>Ensure the recipient address is correct. Funds cannot be recovered if sent to wrong address.</p>
            </div>
          )}

          {/* Confirmation checkbox for dangerous operations */}
          {isDangerous && (
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={checkbox}
                onChange={(e) => setCheckbox(e.target.checked)}
                className="mt-1"
              />
              <span className="text-sm text-gray-600">
                I understand this is irreversible and confirm the recipient address is correct
              </span>
            </label>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t flex gap-2">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 disabled:opacity-50 font-medium"
          >
            {cancelText}
          </button>

          <button
            onClick={() => {
              if (isDangerous && !checkbox) {
                alert('Please confirm you understand this action is irreversible')
                return
              }
              onConfirm()
            }}
            disabled={isLoading || (isDangerous && !checkbox)}
            className={`flex-1 px-4 py-2 text-white rounded-lg disabled:opacity-50 font-medium transition-colors ${
              isDangerous
                ? 'bg-red-600 hover:bg-red-700 disabled:bg-red-300'
                : 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300'
            }`}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
