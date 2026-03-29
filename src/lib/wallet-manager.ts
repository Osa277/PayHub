import { logger } from './logger'
import { ethers } from 'ethers'

/**
 * Ethereum Wallet Manager
 * Real transaction broadcasting using ethers.js
 */

type NetworkType = 'mainnet' | 'testnet'

interface WalletConfig {
  network: NetworkType
  privateKey?: string
  mnemonic?: string
}

// RPC providers for different networks
const PROVIDERS = {
  mainnet: {
    ethereum: process.env.ETHEREUM_RPC_URL || 'https://eth.llamarpc.com',
  },
  testnet: {
    ethereum: `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY || 'YOUR_KEY'}`,
  },
}

// USDT contract address on Sepolia testnet
const USDT_CONTRACT_ADDRESS = '0x7169D38eB5102C6f13322b1c31Ae63e38959A21a'

// USDT ABI (simplified - just transfer method)
const USDT_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
]

/**
 * Get ethers.js provider for network
 */
function getEthersProvider(network: NetworkType) {
  const url = PROVIDERS[network].ethereum
  if (!url) {
    throw new Error(`Provider URL not found for ${network}`)
  }
  return new ethers.JsonRpcProvider(url)
}

/**
 * Create or retrieve an Ethereum wallet
 */
export function createEthereumWallet(config: WalletConfig) {
  try {
    if (config.privateKey) {
      const wallet = new ethers.Wallet(config.privateKey)
      return {
        address: wallet.address,
        privateKey: config.privateKey,
        mnemonic: undefined,
      }
    }

    if (config.mnemonic) {
      const wallet = ethers.Wallet.fromPhrase(config.mnemonic)
      return {
        address: wallet.address,
        privateKey: wallet.privateKey,
        mnemonic: config.mnemonic,
      }
    }

    // Generate random wallet
    const wallet = ethers.Wallet.createRandom()
    return {
      address: wallet.address,
      privateKey: wallet.privateKey,
      mnemonic: wallet.mnemonic?.phrase,
    }
  } catch (error) {
    logger.error('Failed to create Ethereum wallet', { error })
    throw new Error('Wallet creation failed')
  }
}

/**
 * Get provider URL for network
 */
export function getProvider(network: NetworkType, _chain: string = 'ethereum') {
  const url = PROVIDERS[network].ethereum
  if (!url) {
    throw new Error(`Provider not found for ${network}`)
  }
  return url
}

/**
 * Send real Ethereum transaction on testnet/mainnet
 */
export async function sendEthereumTransaction(params: {
  privateKey: string
  toAddress: string
  amount: string // in ETH
  network: NetworkType
  gasLimit?: string
}): Promise<{
  hash: string
  from: string
  to: string
  amount: string
  fee: string
  status: 'pending'
}> {
  try {
    const { privateKey, toAddress, amount, network, gasLimit } = params

    // Validate address format
    if (!ethers.isAddress(toAddress)) {
      throw new Error('Invalid Ethereum address format')
    }

    if (!privateKey || !privateKey.startsWith('0x')) {
      throw new Error('Invalid private key format')
    }

    const provider = getEthersProvider(network)
    const wallet = new ethers.Wallet(privateKey, provider)

    // Convert ETH amount to wei
    const amountWei = ethers.parseEther(amount)

    // Get current gas price
    const feeData = await provider.getFeeData()
    const gasPrice = feeData.gasPrice || ethers.parseUnits('20', 'gwei')
    const txGasLimit = BigInt(gasLimit || '21000')

    // Calculate fee
    const feeBN = gasPrice * txGasLimit
    const feeETH = ethers.formatEther(feeBN)

    logger.info('Ethereum transaction sending', {
      context: {
        from: wallet.address,
        to: toAddress,
        amount,
        fee: feeETH,
        network,
      },
    })

    // Create and send transaction
    const tx = await wallet.sendTransaction({
      to: toAddress,
      value: amountWei,
      gasLimit: txGasLimit,
      gasPrice: gasPrice,
    })

    logger.info('Ethereum transaction broadcast', {
      context: {
        hash: tx.hash,
        from: wallet.address,
        to: toAddress,
      },
    })

    return {
      hash: tx.hash,
      from: wallet.address,
      to: toAddress,
      amount,
      fee: feeETH,
      status: 'pending',
    }
  } catch (error) {
    logger.error('Ethereum transaction failed', { error })
    throw error
  }
}

/**
 * Send USDT transaction (ERC-20 transfer on Ethereum)
 */
export async function sendUSDTTransaction(params: {
  privateKey: string
  toAddress: string
  amount: string // in USDT (6 decimals)
  network: NetworkType
}): Promise<{
  hash: string
  from: string
  to: string
  amount: string
  fee: string
  status: 'pending'
}> {
  try {
    const { privateKey, toAddress, amount, network } = params

    // Validate address
    if (!ethers.isAddress(toAddress)) {
      throw new Error('Invalid Ethereum address format')
    }

    if (!privateKey || !privateKey.startsWith('0x')) {
      throw new Error('Invalid private key format')
    }

    const provider = getEthersProvider(network)
    const wallet = new ethers.Wallet(privateKey, provider)

    // Create USDT contract instance
    const usdtContract = new ethers.Contract(USDT_CONTRACT_ADDRESS, USDT_ABI, wallet)

    // Convert USDT amount (6 decimals)
    const amountUnits = ethers.parseUnits(amount, 6)

    // Estimate gas for USDT transfer
    const feeData = await provider.getFeeData()
    const gasPrice = feeData.gasPrice || ethers.parseUnits('20', 'gwei')
    const usdtGasLimit = 65000n

    const feeBN = gasPrice * BigInt(usdtGasLimit)
    const feeETH = ethers.formatEther(feeBN)

    logger.info('USDT transaction sending', {
      context: {
        from: wallet.address,
        to: toAddress,
        amount,
        fee: feeETH,
        network,
      },
    })

    // Send USDT transfer
    const tx = await usdtContract.transfer(toAddress, amountUnits, {
      gasLimit: usdtGasLimit,
      gasPrice: gasPrice,
    })

    logger.info('USDT transaction broadcast', {
      context: {
        hash: tx.hash,
        from: wallet.address,
        to: toAddress,
      },
    })

    return {
      hash: tx.hash,
      from: wallet.address,
      to: toAddress,
      amount,
      fee: feeETH,
      status: 'pending',
    }
  } catch (error) {
    logger.error('USDT transaction failed', { error })
    throw error
  }
}

/**
 * Get wallet balance for Ethereum or USDT
 */
export async function getWalletBalance(params: {
  address: string
  token?: 'ETH' | 'USDT'
  network: NetworkType
}): Promise<string> {
  try {
    const { address, token = 'ETH', network } = params

    if (!ethers.isAddress(address)) {
      throw new Error('Invalid address format')
    }

    const provider = getEthersProvider(network)

    if (token === 'ETH') {
      // Get ETH balance
      const balanceWei = await provider.getBalance(address)
      return ethers.formatEther(balanceWei)
    }

    if (token === 'USDT') {
      // Get USDT balance
      const usdtContract = new ethers.Contract(USDT_CONTRACT_ADDRESS, USDT_ABI, provider)
      const balanceUnits = await usdtContract.balanceOf(address)
      return ethers.formatUnits(balanceUnits, 6)
    }

    throw new Error(`Unknown token: ${token}`)
  } catch (error) {
    logger.error('Failed to get wallet balance', { error })
    throw error
  }
}

/**
 * Get transaction status
 */
export async function getTransactionStatus(params: {
  hash: string
  network: NetworkType
}): Promise<{
  status: 'pending' | 'confirmed' | 'failed'
  confirmations: number
}> {
  try {
    const { hash, network } = params

    if (!hash.startsWith('0x')) {
      throw new Error('Invalid transaction hash format')
    }

    const provider = getEthersProvider(network)

    // Get transaction receipt
    const receipt = await provider.getTransactionReceipt(hash)

    if (!receipt) {
      return { status: 'pending', confirmations: 0 }
    }

    const status = receipt.status === 1 ? 'confirmed' : receipt.status === 0 ? 'failed' : 'pending'
    const currentBlock = await provider.getBlockNumber()
    const confirmations = receipt.blockNumber ? currentBlock - receipt.blockNumber : 0

    return { status, confirmations }
  } catch (error) {
    logger.error('Failed to get transaction status', { error })
    return { status: 'pending', confirmations: 0 }
  }
}
