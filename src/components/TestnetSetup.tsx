'use client'

import { useState } from 'react'
import { useToast } from './Toast'

/**
 * Testnet Setup Helper Component
 * Shows configuration status and helps users set up test wallets
 */
export function TestnetSetup() {
  const [showSetup, setShowSetup] = useState(false)
  const [config, setConfig] = useState<any>(null)
  const [loading, setLoading] = useState(false)
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
        toast('Wallet generated! Check console for details')
        console.log('Generated Wallet:', data.data)
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
        if (data.data.allConfigured) {
          toast('✅ Setup complete!')
        } else {
          toast('❌ Configuration incomplete. See details below.')
        }
        setConfig(data.data)
        setShowSetup(true)
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

  if (!showSetup) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => {
            fetchConfig()
            verifySetup()
          }}
          disabled={loading}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm font-medium"
        >
          {loading ? 'Loading...' : 'Testnet Setup'}
        </button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm bg-white rounded-lg shadow-xl p-4 border-2 border-purple-200">
      <div className="space-y-3">
        <div className="flex justify-between items-start">
          <h3 className="font-bold text-purple-600">Testnet Setup</h3>
          <button
            onClick={() => setShowSetup(false)}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ✕
          </button>
        </div>

        {config?.blockchain ? (
          <div className="space-y-3 text-sm">
            <div className="p-3 bg-purple-50 rounded">
              <p className="font-medium text-purple-900">Configuration Status:</p>
              <ul className="mt-2 space-y-1 text-purple-800">
                <li>
                  {config.blockchain.testnetMode ? '✅' : '❌'} Testnet Mode:{' '}
                  {config.blockchain.testnetMode ? 'Enabled' : 'Disabled'}
                </li>
                <li>
                  {config.blockchain.rpcProvider === 'configured' ? '✅' : '❌'} RPC:{' '}
                  {config.blockchain.rpcProvider}
                </li>
                <li>
                  {config.chains?.ethereum?.enabled ? '✅' : '❌'} Ethereum:{' '}
                  {config.chains?.ethereum?.enabled ? 'Ready' : 'Not configured'}
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <button
                onClick={generateWallet}
                disabled={loading}
                className="w-full px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 font-medium"
              >
                {loading ? 'Generating...' : 'Generate Test Wallet'}
              </button>

              <a
                href="https://sepoliafaucet.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 font-medium text-center block"
              >
                Get Sepolia ETH
              </a>

              <a
                href="/TESTNET_SETUP_GUIDE.md"
                target="_blank"
                className="w-full px-3 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 font-medium text-center block"
              >
                Setup Guide
              </a>
            </div>
          </div>
        ) : (
          <div className="text-center py-2">
            <button
              onClick={verifySetup}
              disabled={loading}
              className="w-full px-3 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 disabled:opacity-50 font-medium"
            >
              {loading ? 'Verifying...' : 'Verify Setup'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
