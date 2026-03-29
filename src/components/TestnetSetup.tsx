'use client'

import { useState } from 'react'
import { useToast } from './Toast'

/**
 * Testnet Setup Helper Component
 * One-click wallet generation, configuration verification, and setup guidance
 */
export function TestnetSetup() {
  const [showSetup, setShowSetup] = useState(false)
  const [config, setConfig] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [walletData, setWalletData] = useState<any>(null)
  const [showWallet, setShowWallet] = useState(false)
  const { toast } = useToast()

  const fetchConfig = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/testnet/utils?action=get-config')
      const data = await res.json()
      if (data.success) {
        setConfig(data.data)
        setShowSetup(true)
      }
    } catch (error) {
      toast('Failed to load testnet configuration')
    } finally {
      setLoading(false)
    }
  }

  const generateWallet = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/testnet/utils?action=generate-wallet', {
        method: 'POST',
      })
      const data = await res.json()
      if (data.success) {
        setWalletData(data.data)
        setShowWallet(true)
        toast('✅ Test wallet generated!')
      } else {
        toast('Failed to generate wallet')
      }
    } catch (error) {
      toast('Failed to generate wallet')
    } finally {
      setLoading(false)
    }
  }

  const verifySetup = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/testnet/utils?action=verify-setup', {
        method: 'POST',
      })
      const data = await res.json()
      if (data.success) {
        setConfig(data.data)
        setShowSetup(true)
        if (data.data.allConfigured) {
          toast('✅ All systems ready for testnet transactions!')
        } else {
          toast('⚠️ Some configuration items need attention')
        }
      }
    } catch (error) {
      toast('Failed to verify setup')
    } finally {
      setLoading(false)
    }
  }

  // Only show in testnet mode
  if (process.env.NEXT_PUBLIC_BLOCKCHAIN_TESTNET !== 'true') {
    return null
  }

  // Collapsed state - floating button
  if (!showSetup) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => {
            fetchConfig()
            verifySetup()
          }}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 text-sm font-bold shadow-lg hover:shadow-xl transition-all duration-200"
          title="Setup testnet wallet for crypto transactions"
        >
          <span className="animate-pulse">🧪</span>
          {loading ? 'Setting up...' : 'Testnet Setup'}
        </button>
      </div>
    )
  }

  // Show generated wallet details
  if (showWallet && walletData) {
    return (
      <div className="fixed bottom-4 right-4 z-50 max-w-md bg-white rounded-lg shadow-2xl p-5 border-2 border-green-300">
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <h3 className="font-bold text-green-600 text-lg">✅ Wallet Generated</h3>
            <button
              onClick={() => {
                setShowWallet(false)
                setShowSetup(false)
              }}
              className="text-gray-500 hover:text-gray-700 text-xl"
            >
              ✕
            </button>
          </div>

          <div className="bg-gray-50 rounded p-3 space-y-2 text-xs font-mono break-all max-h-40 overflow-y-auto">
            <div>
              <p className="text-gray-600 font-sans mb-1">Address:</p>
              <p className="text-gray-900 bg-white p-2 rounded">{walletData.address}</p>
            </div>
            <div>
              <p className="text-gray-600 font-sans mb-1">Private Key (⚠️ Keep secret):</p>
              <p className="text-gray-900 bg-white p-2 rounded">{walletData.privateKey}</p>
            </div>
            {walletData.mnemonic && (
              <div>
                <p className="text-gray-600 font-sans mb-1">Seed Phrase:</p>
                <p className="text-gray-900 bg-white p-2 rounded">{walletData.mnemonic}</p>
              </div>
            )}
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3">
            <p className="text-yellow-800 text-xs font-medium">
              📝 Save this wallet securely. This is a TEST wallet only (use testnet ETH).
            </p>
          </div>

          <button
            onClick={() => navigator.clipboard.writeText(JSON.stringify(walletData, null, 2))}
            className="w-full px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 font-medium"
          >
            📋 Copy All Details
          </button>

          <button
            onClick={() => {
              setShowWallet(false)
              // Now show the setup guide with next steps
              verifySetup()
            }}
            className="w-full px-3 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 font-medium"
          >
            Next: Setup Guide
          </button>
        </div>
      </div>
    )
  }

  // Main setup panel
  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md bg-white rounded-lg shadow-2xl p-5 border-2 border-purple-300 max-h-96 overflow-y-auto">
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-purple-600 text-lg">🧪 Testnet Setup</h3>
            <p className="text-xs text-gray-600 mt-1">Sepolia Ethereum Testnet</p>
          </div>
          <button
            onClick={() => setShowSetup(false)}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ✕
          </button>
        </div>

        {/* Configuration Status */}
        {config?.blockchain && (
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 rounded border-l-4 border-blue-500">
              <p className="font-semibold text-blue-900 text-sm mb-2">Status:</p>
              <ul className="space-y-1 text-xs text-blue-800">
                <li className="flex items-center gap-2">
                  <span className={config.blockchain.testnetMode ? '✅' : '❌'}>
                    {config.blockchain.testnetMode ? '✅' : '❌'}
                  </span>
                  <span>Testnet Mode: {config.blockchain.testnetMode ? 'Enabled' : 'Disabled'}</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className={config.blockchain.rpcProvider === 'configured' ? '✅' : '❌'}>
                    {config.blockchain.rpcProvider === 'configured' ? '✅' : '❌'}
                  </span>
                  <span>RPC Provider: {config.blockchain.rpcProvider}</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className={config.blockchain.privateKey ? '✅' : '❌'}>
                    {config.blockchain.privateKey ? '✅' : '❌'}
                  </span>
                  <span>Private Key: {config.blockchain.privateKey ? 'Set' : 'Not configured'}</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className={config.chains?.ethereum?.enabled ? '✅' : '❌'}>
                    {config.chains?.ethereum?.enabled ? '✅' : '❌'}
                  </span>
                  <span>Ethereum: {config.chains?.ethereum?.enabled ? 'Ready' : 'Not ready'}</span>
                </li>
              </ul>
            </div>

            {/* Quick Start Steps */}
            <div className="p-3 bg-purple-50 rounded border-l-4 border-purple-500">
              <p className="font-semibold text-purple-900 text-sm mb-2">Quick Start:</p>
              <ol className="space-y-1 text-xs text-purple-800 list-decimal list-inside">
                <li>Generate a test wallet (below)</li>
                <li>Get free Sepolia ETH from faucet</li>
                <li>Add private key to .env ETHEREUM_PRIVATE_KEY</li>
                <li>Send real testnet transactions!</li>
              </ol>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                onClick={generateWallet}
                disabled={loading}
                className="w-full px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50 font-bold transition-colors"
              >
                {loading ? 'Generating...' : '🔑 Generate Test Wallet'}
              </button>

              <a
                href="https://sepoliafaucet.com"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 font-bold text-center transition-colors"
              >
                💰 Get Free Sepolia ETH
              </a>

              <a
                href="https://sepolia.etherscan.io"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full px-3 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 font-bold text-center transition-colors"
              >
                🔍 View on Etherscan
              </a>

              <a
                href="/TESTNET_SETUP_GUIDE.md"
                target="_blank"
                className="block w-full px-3 py-2 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700 font-bold text-center transition-colors"
              >
                📖 Full Setup Guide
              </a>
            </div>

            {/* Info Box */}
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 text-xs text-yellow-800">
              <p className="font-medium mb-1">💡 Testnet Transactions:</p>
              <p>All transactions use FREE test ETH. No real money involved. Perfect for development!</p>
            </div>
          </div>
        )}

        {!config?.blockchain && (
          <button
            onClick={verifySetup}
            disabled={loading}
            className="w-full px-3 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 disabled:opacity-50 font-bold"
          >
            {loading ? 'Verifying...' : 'Verify Configuration'}
          </button>
        )}
      </div>
    </div>
  )
}
