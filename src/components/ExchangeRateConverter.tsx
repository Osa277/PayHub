'use client'
import React, { useState, useEffect } from 'react'
import { SUPPORTED_CURRENCIES, CURRENCY_SYMBOLS } from '@/lib/constants'

interface ExchangeRateConverterProps {
  onRate?: (rate: number) => void
}

export const ExchangeRateConverter: React.FC<ExchangeRateConverterProps> = ({
  onRate,
}) => {
  const [fromCurrency, setFromCurrency] = useState('USD')
  const [toCurrency, setToCurrency] = useState('EUR')
  const [amount, setAmount] = useState('1')
  const [convertedAmount, setConvertedAmount] = useState('0.92')
  const [isLoading, setIsLoading] = useState(false)

  const currencies = SUPPORTED_CURRENCIES

  useEffect(() => {
    const fetchRate = async () => {
      if (amount && !isNaN(Number(amount))) {
        setIsLoading(true)
        try {
          const response = await fetch(
            `/api/exchange-rates?from=${fromCurrency}&to=${toCurrency}`
          )
          const data = await response.json()

          if (data.success && data.data) {
            const converted = Number(amount) * data.data.rate
            setConvertedAmount(converted.toFixed(2))
            onRate?.(data.data.rate)
          }
        } catch (error) {
          console.error('Failed to fetch exchange rate:', error)
        } finally {
          setIsLoading(false)
        }
      }
    }

    const timer = setTimeout(fetchRate, 500)
    return () => clearTimeout(timer)
  }, [amount, fromCurrency, toCurrency, onRate])

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Currency Converter
      </h3>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From
            </label>
            <div className="flex gap-2">
              <select
                value={fromCurrency}
                onChange={(e) => setFromCurrency(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
              >
                {currencies.map((curr) => (
                  <option key={curr} value={curr}>
                    {curr}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To
            </label>
            <div className="flex gap-2">
              <select
                value={toCurrency}
                onChange={(e) => setToCurrency(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
              >
                {currencies.map((curr) => (
                  <option key={curr} value={curr}>
                    {curr}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={isLoading ? 'Loading...' : convertedAmount}
                disabled
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-600 text-center">
          1 {fromCurrency} ={' '}
          <span className="font-semibold">
            {CURRENCY_SYMBOLS[toCurrency] || ''}{(Number(convertedAmount) / Number(amount || 1) || 0).toFixed(4)} {toCurrency}
          </span>
        </p>
      </div>
    </div>
  )
}
