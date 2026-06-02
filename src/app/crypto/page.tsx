// DEPRECATED: Crypto page removed (Paystack-only version)

// This file is intentionally left blank after crypto removal.
'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { AuthGuard } from '@/components/AuthGuard'
import { useApi } from '@/lib/hooks'
import { useToast } from '@/components/Toast'

type Tab = 'buy' | 'sell' | 'send' | 'receive' | 'wallets'
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

  const walletData = useApi('/api/crypto/wallet', { refreshInterval: 5000 })
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
    ? Number(
        {
          BTC: wallet.wallet.btcBalance || 0,
          ETH: wallet.wallet.ethBalance || 0,
          USDT: wallet.wallet.usdtBalance || 0,
        }[crypto]
      )
    : 0

  return (
    <AuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4 sm:p-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-black">Crypto Wallet</h1>
            <p className="text-black mt-1">Buy, sell, send, and receive cryptocurrency</p>
          </div>

          {/* Wallet Balance */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="text-center">
              <p className="text-black text-sm">Balance</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className="text-4xl font-bold text-blue-900">
                  {balance.toFixed(8)}
                </span>
                <span className="text-2xl text-black">{CRYPTO_SYMBOLS[crypto]}</span>
                <span className="text-lg text-black font-medium">{crypto}</span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 bg-blue-50 p-2 rounded-lg">
            {(['buy', 'sell', 'send', 'receive', 'wallets'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2 px-3 rounded-md font-medium transition ${
                  tab === t
                    ? 'bg-white text-blue-900 shadow'
                    : 'text-black hover:text-blue-900'
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {tab === 'wallets' ? (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <p className="text-center text-black">Wallet management coming soon...</p>
            </div>
          ) : (
          <>
          {/* Crypto Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-black mb-2">
              Cryptocurrency
            </label>
            <div className="flex gap-2">
              {(['BTC', 'ETH', 'USDT'] as CryptoType[]).map((c) => (
                <button
                  key={c}
                  onClick={() => setCrypto(c)}
                  className={`flex-1 py-2 px-3 rounded-lg font-medium transition ${
                    crypto === c
                      ? 'bg-blue-900 text-white'
                      : 'bg-blue-50 text-black hover:bg-blue-100'
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
                  <label className="block text-sm font-medium text-black mb-1">
                    Amount (NGN)
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter fiat amount"
                    className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={handleBuy}
                  disabled={loading}
                  className="w-full py-3 bg-blue-900 text-white rounded-lg font-semibold hover:bg-blue-950 disabled:opacity-50"
                >
                  {loading ? 'Buying...' : `Buy ${crypto}`}
                </button>
              </div>
            )}

            {tab === 'sell' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Amount ({crypto})
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter crypto amount"
                    className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={handleSell}
                  disabled={loading}
                  className="w-full py-3 bg-blue-900 text-white rounded-lg font-semibold hover:bg-blue-950 disabled:opacity-50"
                >
                  {loading ? 'Selling...' : `Sell ${crypto}`}
                </button>
              </div>
            )}

            {tab === 'send' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Amount ({crypto})
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount to send"
                    className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Recipient Address
                  </label>
                  <input
                    type="text"
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    placeholder="Paste recipient address"
                    className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Note (optional)
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add a note"
                    className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={handleSend}
                  disabled={loading}
                  className="w-full py-3 bg-blue-900 text-white rounded-lg font-semibold hover:bg-blue-950 disabled:opacity-50"
                >
                  {loading ? 'Sending...' : `Send ${crypto}`}
                </button>
              </div>
            )}

            {tab === 'receive' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Address Label (optional)
                  </label>
                  <input
                    type="text"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="e.g., My Wallet"
                    className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={handleReceive}
                  disabled={loading}
                  className="w-full py-3 bg-blue-900 text-white rounded-lg font-semibold hover:bg-blue-950 disabled:opacity-50"
                >
                  {loading ? 'Generating...' : `Generate ${crypto} Address`}
                </button>
              </div>
            )}
          </div>
          </>
          )}

          {/* Recent Transactions */}
          {wallet?.transactions && wallet.transactions.length > 0 && (
            <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-black">Recent Transactions</h2>
                <Link
                  href="/crypto/transactions"
                  className="text-sm font-medium text-blue-900 hover:text-blue-950 transition"
                >
                  View All →
                </Link>
              </div>
              <div className="space-y-3">
                {wallet.transactions.slice(0, 5).map((tx: any) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-black capitalize">{tx.type}</p>
                      <p className="text-sm text-black">{tx.cryptocurrency}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-black">
                        {tx.type === 'buy' || tx.type === 'receive' ? '+' : '-'}
                        {Number(tx.amount).toFixed(8)}
                      </p>
                      <p className="text-sm text-black capitalize">{tx.status}</p>
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
