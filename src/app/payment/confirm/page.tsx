'use client'
import React, { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AuthGuard } from '@/components/AuthGuard'
import { useSession } from 'next-auth/react'
import { formatCurrency } from '@/lib/utils'
import { SUPPORTED_CRYPTOS, formatCryptoAmount, type CryptoId } from '@/lib/crypto-payment'

interface CryptoPaymentDetails {
  sessionId: string
  transactionId: string
  amount: number
  currency: string
  cryptoCurrency: CryptoId
  walletAddress: string
  cryptoAmount: number
  exchangeRate: number
  network: string
  recipientEmail: string
  description: string
}

function ConfirmContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const user = session?.user
  const [payment, setPayment] = useState<CryptoPaymentDetails | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [step, setStep] = useState<'review' | 'processing' | 'pin'>('review')
  const [pin, setPin] = useState(['', '', '', ''])
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const sessionId = searchParams.get('sessionId')
    const transactionId = searchParams.get('transactionId')
    const amount = searchParams.get('amount')
    const currency = searchParams.get('currency')
    const cryptoCurrency = searchParams.get('cryptoCurrency') as CryptoId
    const walletAddress = searchParams.get('walletAddress')
    const cryptoAmount = searchParams.get('cryptoAmount')
    const exchangeRate = searchParams.get('exchangeRate')
    const network = searchParams.get('network')
    const recipientEmail = searchParams.get('recipientEmail')
    const description = searchParams.get('description')

    if (sessionId && transactionId && amount && cryptoCurrency) {
      setPayment({
        sessionId,
        transactionId,
        amount: parseFloat(amount),
        currency: currency || 'USD',
        cryptoCurrency,
        walletAddress: walletAddress || '',
        cryptoAmount: parseFloat(cryptoAmount || '0'),
        exchangeRate: parseFloat(exchangeRate || '0'),
        network: network || '',
        recipientEmail: recipientEmail || '',
        description: description || 'Crypto payment via PayHub',
      })
    } else {
      router.push('/payment')
    }
  }, [searchParams, router])

  const handleCopyAddress = async () => {
    if (payment?.walletAddress) {
      await navigator.clipboard.writeText(payment.walletAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handlePinChange = (index: number, value: string) => {
    if (value.length > 1) return
    const newPin = [...pin]
    newPin[index] = value
    setPin(newPin)
    if (value && index < 3) {
      const next = document.getElementById(`pin-${index + 1}`)
      next?.focus()
    }
  }

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      const prev = document.getElementById(`pin-${index - 1}`)
      prev?.focus()
    }
  }

  const handleConfirmPayment = () => {
    setStep('pin')
  }

  const handleSubmitPin = async () => {
    const enteredPin = pin.join('')
    if (enteredPin.length !== 4) return

    setStep('processing')
    setIsProcessing(true)
    setError('')

    try {
      const res = await fetch('/api/payments/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId: payment?.transactionId }),
      })

      const data = await res.json()

      if (!data.success) {
        setError(data.error || 'Payment failed')
        setStep('review')
        setIsProcessing(false)
        return
      }

      setIsProcessing(false)

      const params = new URLSearchParams({
        amount: payment?.amount.toString() || '0',
        currency: payment?.currency || 'USD',
        recipientEmail: payment?.recipientEmail || '',
        description: payment?.description || '',
        provider: 'crypto',
        cryptoCurrency: payment?.cryptoCurrency || 'btc',
        cryptoAmount: payment?.cryptoAmount.toString() || '0',
        txnId: data.data.id,
      })
      router.push(`/payment/success?${params.toString()}`)
    } catch {
      setError('An unexpected error occurred')
      setStep('review')
      setIsProcessing(false)
    }
  }

  if (!payment) {
    return (
      <AuthGuard>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="flex items-center gap-3 text-gray-500">
            <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading payment details...
          </div>
        </div>
      </AuthGuard>
    )
  }

  const cryptoInfo = SUPPORTED_CRYPTOS.find((c) => c.id === payment.cryptoCurrency)
  const fee = payment.amount * 0.01 // 1% crypto fee
  const total = payment.amount + fee

  return (
    <AuthGuard>
      <div className="max-w-lg mx-auto">
        {/* Processing Overlay */}
        {step === 'processing' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-orange-50 flex items-center justify-center">
              <svg className="animate-spin h-10 w-10 text-orange-600" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Confirming on Blockchain</h2>
              <p className="text-gray-500 mt-2">
                Processing {formatCryptoAmount(payment.cryptoAmount, payment.cryptoCurrency)} on {payment.network}...
              </p>
            </div>
            <div className="space-y-2">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-orange-600 rounded-full animate-pulse" style={{ width: '70%' }} />
              </div>
              <p className="text-xs text-gray-400">Do not close this page</p>
            </div>
          </div>
        )}

        {/* PIN Entry */}
        {step === 'pin' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
            <div className="text-center">
              <div className="text-4xl mb-3">🔐</div>
              <h2 className="text-xl font-bold text-gray-900">Enter Transaction PIN</h2>
              <p className="text-gray-500 mt-1 text-sm">
                Confirm sending {formatCryptoAmount(payment.cryptoAmount, payment.cryptoCurrency)}
              </p>
            </div>

            <div className="flex justify-center gap-4">
              {pin.map((digit, index) => (
                <input
                  key={index}
                  id={`pin-${index}`}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinChange(index, e.target.value)}
                  onKeyDown={(e) => handlePinKeyDown(index, e)}
                  className="w-14 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition"
                />
              ))}
            </div>

            <p className="text-center text-xs text-gray-400">
              Enter your 4-digit transaction PIN
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => { setStep('review'); setPin(['', '', '', '']) }}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
              >
                Back
              </button>
              <button
                onClick={handleSubmitPin}
                disabled={pin.join('').length !== 4}
                className="flex-1 bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Confirm Payment
              </button>
            </div>
          </div>
        )}

        {/* Review Step */}
        {step === 'review' && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">Confirm Crypto Payment</h1>
              <p className="text-gray-500 mt-1">Review and send your crypto</p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              {/* Crypto Amount Header */}
              <div className="bg-gradient-to-r from-orange-500 to-amber-600 p-6 text-center text-white">
                <p className="text-sm opacity-80 mb-1">You are sending</p>
                <p className="text-3xl font-bold">
                  {formatCryptoAmount(payment.cryptoAmount, payment.cryptoCurrency)}
                </p>
                <p className="text-lg opacity-80 mt-1">
                  ≈ {formatCurrency(payment.amount, payment.currency)}
                </p>
                <div className="mt-3 inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-sm">
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: cryptoInfo?.color }}
                  >
                    {cryptoInfo?.icon}
                  </span>
                  {cryptoInfo?.name} ({payment.network})
                </div>
              </div>

              {/* Wallet Address */}
              <div className="p-4 bg-gray-50 border-b border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Send to wallet address</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-white px-3 py-2 rounded border border-gray-200 font-mono break-all">
                    {payment.walletAddress}
                  </code>
                  <button
                    onClick={handleCopyAddress}
                    className="px-3 py-2 bg-orange-100 text-orange-700 rounded text-xs font-medium hover:bg-orange-200 transition whitespace-nowrap"
                  >
                    {copied ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Details */}
              <div className="p-6 space-y-4">
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-500">To</span>
                  <span className="text-gray-900 font-medium">{payment.recipientEmail || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-500">Description</span>
                  <span className="text-gray-900 font-medium">{payment.description}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-500">Exchange Rate</span>
                  <span className="text-gray-900 font-medium">
                    1 {payment.cryptoCurrency.toUpperCase()} = ${payment.exchangeRate.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-500">Amount</span>
                  <span className="text-gray-900 font-medium">{formatCurrency(payment.amount, payment.currency)}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-500">Fee (1%)</span>
                  <span className="text-gray-900 font-medium">{formatCurrency(fee, payment.currency)}</span>
                </div>
                <div className="flex justify-between py-3 text-lg">
                  <span className="text-gray-900 font-bold">Total</span>
                  <span className="text-orange-600 font-bold">{formatCurrency(total, payment.currency)}</span>
                </div>
              </div>
            </div>

            {/* From Account Info */}
            <div className="bg-gray-50 rounded-lg p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-sm font-bold text-orange-600">
                {user?.name?.charAt(0) || '?'}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/payment')}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPayment}
                disabled={isProcessing}
                className="flex-1 bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 disabled:opacity-50 transition"
              >
                Pay {formatCryptoAmount(payment.cryptoAmount, payment.cryptoCurrency)}
              </button>
            </div>

            <p className="text-center text-xs text-gray-400">
              🔒 Secured by blockchain • Irreversible transaction
            </p>
          </div>
        )}
      </div>
    </AuthGuard>
  )
}

export default function PaymentConfirmPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center text-gray-500">Loading...</div>}>
      <ConfirmContent />
    </Suspense>
  )
}
