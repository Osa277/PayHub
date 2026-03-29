'use client'

import { useState, useEffect } from 'react'
import { useToast } from './Toast'

interface BlockchainWallet {
  id: string
  name: string
  cryptocurrency: string
  address: string
  isActive: boolean
  isViewOnly: boolean
  source: string
  createdAt: string
}

export function WalletManager() {
  const [wallets, setWallets] = useState<BlockchainWallet[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [selectedWallet, setSelectedWallet] = useState<BlockchainWallet | null>(null)
  const [showExport, setShowExport] = useState<string | null>(null)
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    cryptocurrency: 'ETH' as const,
    privateKey: '',
    mnemonic: '',
    type: 'generate' as 'generate' | 'import-key' | 'import-mnemonic',
  })

  // Load wallets on mount
  useEffect(() => {
    fetchWallets()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchWallets = async () => {
    try {
      const res = await fetch('/api/crypto/wallets')
      const data = await res.json()
      if (data.success) {
        setWallets(data.data)
        if (data.data.length > 0 && !selectedWallet) {
          setSelectedWallet(data.data.find((w: BlockchainWallet) => w.isActive) || data.data[0])
        }
      }
    } catch (error) {
      toast('Failed to load wallets')
    }
  }

  const handleCreateWallet = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload: any = {
        name: formData.name,
        cryptocurrency: formData.cryptocurrency,
      }

      if (formData.type === 'import-key' && formData.privateKey) {
        payload.privateKey = formData.privateKey
      }
      if (formData.type === 'import-mnemonic' && formData.mnemonic) {
        payload.mnemonic = formData.mnemonic
      }

      const res = await fetch('/api/crypto/wallets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (data.success) {
        toast(`✅ ${data.message}`)
        setWallets([...wallets, data.data])
        setSelectedWallet(data.data)
        setFormData({ name: '', cryptocurrency: 'ETH', privateKey: '', mnemonic: '', type: 'generate' })
        setShowForm(false)
      } else {
        toast(`❌ ${data.error}`)
      }
    } catch (error) {
      toast('Failed to create wallet')
    } finally {
      setLoading(false)
    }
  }

  const handleSetActive = async (walletId: string) => {
    try {
      const res = await fetch(`/api/crypto/wallets?id=${walletId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: true }),
      })

      const data = await res.json()
      if (data.success) {
        setWallets(wallets.map(w => ({ ...w, isActive: w.id === walletId })))
        setSelectedWallet(data.data)
        toast('✅ Wallet activated')
      } else {
        toast(`❌ ${data.error}`)
      }
    } catch (error) {
      toast('Failed to set active wallet')
    }
  }

  const handleDeleteWallet = async (walletId: string) => {
    if (!window.confirm('Are you sure? This cannot be undone.')) return

    try {
      const res = await fetch(`/api/crypto/wallets?id=${walletId}`, {
        method: 'DELETE',
      })

      const data = await res.json()
      if (data.success) {
        setWallets(wallets.filter(w => w.id !== walletId))
        if (selectedWallet?.id === walletId) {
          const remaining = wallets.filter(w => w.id !== walletId)
          setSelectedWallet(remaining[0] || null)
        }
        toast('✅ Wallet deleted')
      } else {
        toast(`❌ ${data.error}`)
      }
    } catch (error) {
      toast('Failed to delete wallet')
    }
  }

  const handleExportPrivateKey = async (walletId: string) => {
    try {
      const res = await fetch(`/api/crypto/wallets?id=${walletId}&action=get-private-key`, {
        method: 'PATCH',
      })

      const data = await res.json()
      if (data.success) {
        setShowExport(data.data.privateKey)
        toast('⚠️ Private key displayed - keep it secure!')
      } else {
        toast(`❌ ${data.error}`)
      }
    } catch (error) {
      toast('Failed to export private key')
    }
  }

  const handleExportMnemonic = async (walletId: string) => {
    try {
      const res = await fetch(`/api/crypto/wallets?id=${walletId}&action=get-mnemonic`, {
        method: 'PATCH',
      })

      const data = await res.json()
      if (data.success) {
        setShowExport(data.data.mnemonic)
        toast('⚠️ Seed phrase displayed - keep it secure!')
      } else {
        toast(`❌ ${data.error}`)
      }
    } catch (error) {
      toast('Failed to export mnemonic')
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Blockchain Wallets</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          {showForm ? 'Close' : '+ Add Wallet'}
        </button>
      </div>

      {/* Create/Import Form */}
      {showForm && (
        <form onSubmit={handleCreateWallet} className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Wallet Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., My Main Wallet"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cryptocurrency</label>
              <select
                value={formData.cryptocurrency}
                onChange={(e) => setFormData({ ...formData, cryptocurrency: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ETH">Ethereum (ETH)</option>
                <option value="BTC">Bitcoin (BTC)</option>
                <option value="USDT">USDT</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="generate"
                    checked={formData.type === 'generate'}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="mr-2"
                  />
                  <span className="text-sm">Generate New Wallet</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="import-key"
                    checked={formData.type === 'import-key'}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="mr-2"
                  />
                  <span className="text-sm">Import Private Key</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="import-mnemonic"
                    checked={formData.type === 'import-mnemonic'}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="mr-2"
                  />
                  <span className="text-sm">Import Seed Phrase</span>
                </label>
              </div>
            </div>

            {formData.type === 'import-key' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Private Key</label>
                <textarea
                  value={formData.privateKey}
                  onChange={(e) => setFormData({ ...formData, privateKey: e.target.value })}
                  placeholder="0x..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                  rows={2}
                  required={formData.type === 'import-key'}
                />
              </div>
            )}

            {formData.type === 'import-mnemonic' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Seed Phrase (12 or 24 words)</label>
                <textarea
                  value={formData.mnemonic}
                  onChange={(e) => setFormData({ ...formData, mnemonic: e.target.value })}
                  placeholder="word1 word2 word3 ..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                  rows={2}
                  required={formData.type === 'import-mnemonic'}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {loading ? 'Creating...' : 'Create Wallet'}
            </button>
          </div>
        </form>
      )}

      {/* Export Modal */}
      {showExport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">⚠️ Sensitive Data</h3>
            <div className="bg-red-50 p-4 rounded border border-red-200 mb-4">
              <p className="text-red-800 text-sm font-mono break-all">{showExport}</p>
            </div>
            <div className="bg-yellow-50 p-3 rounded mb-4">
              <p className="text-yellow-800 text-xs">
                ⚠️ Keep this secure. Anyone with this can access your funds.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(showExport)
                  toast('✅ Copied to clipboard')
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                📋 Copy
              </button>
              <button
                onClick={() => setShowExport(null)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Wallets List */}
      <div className="space-y-3">
        {wallets.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No wallets yet. Create your first wallet above.</p>
          </div>
        ) : (
          wallets.map((wallet) => (
            <div
              key={wallet.id}
              className={`p-4 rounded-lg border-2 ${
                wallet.isActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-900">{wallet.name}</h3>
                    {wallet.isActive && <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded">Active</span>}
                    {wallet.isViewOnly && <span className="px-2 py-1 bg-gray-400 text-white text-xs rounded">View Only</span>}
                  </div>
                  <p className="text-gray-600 text-sm">{wallet.cryptocurrency}</p>
                  <p className="text-gray-500 text-xs font-mono truncate">{wallet.address}</p>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                {!wallet.isActive && (
                  <button
                    onClick={() => handleSetActive(wallet.id)}
                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                  >
                    Activate
                  </button>
                )}

                {!wallet.isViewOnly && (
                  <>
                    <button
                      onClick={() => handleExportPrivateKey(wallet.id)}
                      className="px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700"
                    >
                      🔑 Private Key
                    </button>
                    {wallet.source === 'generated' && (
                      <button
                        onClick={() => handleExportMnemonic(wallet.id)}
                        className="px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700"
                      >
                        📝 Seed Phrase
                      </button>
                    )}
                  </>
                )}

                <button
                  onClick={() => handleDeleteWallet(wallet.id)}
                  className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
