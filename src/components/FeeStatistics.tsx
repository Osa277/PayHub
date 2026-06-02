'use client'

import React from 'react'

interface Transaction {
  fee: number
  cryptocurrency: string
  createdAt: string | Date
}

interface FeeStatisticsProps {
  transactions: Transaction[]
}

export const FeeStatistics: React.FC<FeeStatisticsProps> = () => {
  return (
    <div className="bg-white rounded-lg shadow p-6 border border-blue-100">
      <h3 className="text-lg font-semibold text-black mb-4">Fee Statistics</h3>
      <p className="text-black text-center py-8">Crypto payments have been deprecated. Use Paystack for all transactions.</p>
    </div>
  )
}
