'use client'

import { WalletManager } from '@/components/WalletManager'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function WalletsPage() {
  const { status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Wallet Management</h1>
          <p className="text-gray-600">
            Create, import, and manage your blockchain wallets. Add multiple wallets for different cryptocurrencies.
          </p>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-8">
          <p className="text-blue-800 text-sm">
            💡 <strong>Testnet:</strong> All wallets use Sepolia testnet by default. No real money is used.
          </p>
        </div>

        <WalletManager />

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-bold text-gray-900 mb-2">🔐 Secure Storage</h3>
            <p className="text-gray-600 text-sm">
              Private keys and seed phrases are encrypted using AES-256. Never stored in plain text.
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-bold text-gray-900 mb-2">📋 Multiple Wallets</h3>
            <p className="text-gray-600 text-sm">
              Create unlimited wallets. Switch between them anytime. Only one wallet is active at a time.
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-bold text-gray-900 mb-2">📥 Import Wallets</h3>
            <p className="text-gray-600 text-sm">
              Import existing wallets using private keys or seed phrases. Perfect for migrating from other apps.
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-bold text-gray-900 mb-2">🔑 Export Keys</h3>
            <p className="text-gray-600 text-sm">
              Export private keys or seed phrases anytime. Keep them safe and never share them.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
