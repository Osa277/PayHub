'use client'
import React, { useState } from 'react'
import { AuthGuard } from '@/components/AuthGuard'
import { useApi } from '@/lib/hooks'
import { useToast } from '@/components/Toast'

type Tab = 'buy' | 'sell' | 'send' | 'receive'
type CryptoType = 'BTC' | 'ETH' | 'USDT'

const CRYPTO_SYMBOLS = {
  BTC: '₿',
  ETH: 'Ξ',
  USDT: '₮',
}

export default function CryptoPage() {
  const [tab, setTab] = useState<Tab>('buy')
  const [crypto, setCrypto] = useState<CryptoType>('BTC')
  const [amount, setAmount] = useState('')
  const [recipientAddress, setRecipientAddress] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [label, setLabel] = useState('')
  const { toast } = useToast()

  const walletData = useApi('/api/crypto/wallet')
  const wallet = (walletData as any)?.data

  const handleBuy = async () => {
    setError('')
    if (!amount) {
      setError('Enter amount')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/crypto/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cryptocurrency: crypto,
          fiatAmount: parseFloat(amount),
        }),
      })
      const data = await res.json()
      if (!data.success) {
        setError(data.error)
        return
      }
      toast(`Bought ${parseFloat(amount).toFixed(2)} ${crypto}`)
      setAmount('')
    } catch (err) {
      setError('Failed to buy crypto')
    } finally {
      setLoading(false)
    }
  }

  const handleSell = async () => {
    setError('')
    if (!amount) {
      setError('Enter amount')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/crypto/sell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cryptocurrency: crypto,
          cryptoAmount: parseFloat(amount),
        }),
      })
      const data = await res.json()
      if (!data.success) {
        setError(data.error)
        return
      }
      toast(`Sold ${parseFloat(amount).toFixed(8)} ${crypto}`)
      setAmount('')
    } catch (err) {
      setError('Failed to sell crypto')
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async () => {
    setError('')
    if (!amount || !recipientAddress) {
      setError('Enter all fields')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/crypto/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cryptocurrency: crypto,
          amount: parseFloat(amount),
          recipientAddress,
          description,
        }),
      })
      const data = await res.json()
      if (!data.success) {
        setError(data.error)
        return
      }
      toast(`Sent ${parseFloat(amount).toFixed(8)} ${crypto}`)
      setAmount('')
      setRecipientAddress('')
      setDescription('')
    } catch (err) {
      setError('Failed to send crypto')
    } finally {
      setLoading(false)
    }
  }

  const handleReceive = async () => {
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/crypto/receive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cryptocurrency: crypto,
          label,
        }),
      })
      const data = await res.json()
      if (!data.success) {
        setError(data.error)
        return
      }
      toast(`${crypto} address generated`)
      toast(`Address: ${data.data.address}`)
      setLabel('')
    } catch (err) {
      setError('Failed to generate address')
    } finally {
      setLoading(false)
    }
  }

  const balance = wallet?.wallet
    ? {
        BTC: wallet.wallet.btcBalance || 0,
        ETH: wallet.wallet.ethBalance || 0,
        USDT: wallet.wallet.usdtBalance || 0,
      }[crypto]
    : 0

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 sm:p-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Crypto Wallet</h1>
            <p className="text-gray-600 mt-1">Buy, sell, send, and receive cryptocurrency</p>
          </div>

          {/* Wallet Balance */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="text-center">
              <p className="text-gray-600 text-sm">Balance</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className="text-4xl font-bold text-indigo-600">
                  {(balance as number)?.toFixed(8) || '0.00000000'}
                </span>
                <span className="text-2xl text-gray-600">{CRYPTO_SYMBOLS[crypto]}</span>
                <span className="text-lg text-gray-600 font-medium">{crypto}</span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 bg-gray-100 p-2 rounded-lg">
            {(['buy', 'sell', 'send', 'receive'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2 px-3 rounded-md font-medium transition ${
                  tab === t
                    ? 'bg-white text-indigo-600 shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {/* Crypto Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cryptocurrency
            </label>
            <div className="flex gap-2">
              {(['BTC', 'ETH', 'USDT'] as CryptoType[]).map((c) => (
                <button
                  key={c}
                  onClick={() => setCrypto(c)}
                  className={`flex-1 py-2 px-3 rounded-lg font-medium transition ${
                    crypto === c
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            {tab === 'buy' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (NGN)
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter fiat amount"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={handleBuy}
                  disabled={loading}
                  className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Buying...' : `Buy ${crypto}`}
                </button>
              </div>
            )}

            {tab === 'sell' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount ({crypto})
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter crypto amount"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={handleSell}
                  disabled={loading}
                  className="w-full py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 disabled:opacity-50"
                >
                  {loading ? 'Selling...' : `Sell ${crypto}`}
                </button>
              </div>
            )}

            {tab === 'send' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount ({crypto})
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount to send"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recipient Address
                  </label>
                  <input
                    type="text"
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    placeholder="Paste recipient address"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Note (optional)
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add a note"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={handleSend}
                  disabled={loading}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Sending...' : `Send ${crypto}`}
                </button>
              </div>
            )}

            {tab === 'receive' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address Label (optional)
                  </label>
                  <input
                    type="text"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="e.g., My Wallet"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={handleReceive}
                  disabled={loading}
                  className="w-full py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50"
                >
                  {loading ? 'Generating...' : `Generate ${crypto} Address`}
                </button>
              </div>
            )}
          </div>

          {/* Recent Transactions */}
          {wallet?.transactions && wallet.transactions.length > 0 && (
            <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Transactions</h2>
              <div className="space-y-3">
                {wallet.transactions.slice(0, 5).map((tx: any) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 capitalize">{tx.type}</p>
                      <p className="text-sm text-gray-500">{tx.cryptocurrency}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {tx.type === 'buy' || tx.type === 'receive' ? '+' : '-'}
                        {tx.amount.toFixed(8)}
                      </p>
                      <p className="text-sm text-gray-500 capitalize">{tx.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}
