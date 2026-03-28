'use client'
import React from 'react'
import { formatCurrency } from '@/lib/utils'
import { Wallet } from '@/types'

interface WalletDisplayProps {
  wallet: Wallet
  onTopUp?: () => void
  onTransfer?: () => void
}

export const WalletDisplay: React.FC<WalletDisplayProps> = ({
  wallet,
  onTopUp,
  onTransfer,
}) => {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white shadow-lg">
      <div className="mb-4">
        <p className="text-sm opacity-90">Available Balance</p>
        <h2 className="text-4xl font-bold">
          {formatCurrency(wallet.balance, wallet.currency)}
        </h2>
      </div>
      <p className="text-sm opacity-75 mb-6">Wallet ID: {wallet.id}</p>
      <div className="flex gap-3">
        <button
          onClick={onTopUp}
          className="flex-1 bg-white text-blue-600 font-semibold py-2 px-4 rounded-lg hover:bg-opacity-90 transition"
        >
          Top Up
        </button>
        <button
          onClick={onTransfer}
          className="flex-1 bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-400 transition"
        >
          Transfer
        </button>
      </div>
    </div>
  )
}
