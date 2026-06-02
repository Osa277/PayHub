/**
 * Blockchain Explorer URL Builder
 * Generates correct explorer URLs based on cryptocurrency and network
 */

type Cryptocurrency = 'BTC' | 'ETH' | 'USDT'

/**
 * Get Ethereum/USDT block explorer URL
 */
export function getEthereumExplorerUrl(
  hash: string,
  isTestnet: boolean
): string {
  const domain = isTestnet ? 'sepolia.etherscan.io' : 'etherscan.io'
  return `https://${domain}/tx/${hash}`
}

/**
 * Get Bitcoin block explorer URL
 */
export function getBitcoinExplorerUrl(
  hash: string,
  isTestnet: boolean
): string {
  if (isTestnet) {
    return `https://blockstream.info/testnet/tx/${hash}`
  }
  return `https://blockstream.info/tx/${hash}`
}

/**
 * Get explorer URL for any cryptocurrency
 */
export function getExplorerUrl(
  hash: string,
  cryptocurrency: Cryptocurrency,
  isTestnet: boolean
): string {
  if (cryptocurrency === 'BTC') {
    return getBitcoinExplorerUrl(hash, isTestnet)
  }

  // ETH and USDT both use Ethereum explorer
  return getEthereumExplorerUrl(hash, isTestnet)
}

/**
 * Get explorer service name for display
 */
export function getExplorerName(
  cryptocurrency: Cryptocurrency,
  isTestnet: boolean
): string {
  if (cryptocurrency === 'BTC') {
    return isTestnet ? 'Blockstream (Testnet)' : 'Blockstream'
  }

  // ETH and USDT use Etherscan
  return isTestnet ? 'Sepolia Etherscan' : 'Etherscan'
}

/**
 * Format cryptocurrency for display in URLs/explorer names
 */
export function formatCryptoForExplorer(crypto: Cryptocurrency): string {
  return crypto === 'BTC' ? 'Bitcoin' : 'Ethereum'
}
