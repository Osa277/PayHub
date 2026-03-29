/**
 * Input validation and sanitization utilities
 * Prevent XSS, injection, and invalid data
 */

/**
 * Sanitize string input (remove HTML/script tags)
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return ''

  return input
    .trim()
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>\"']/g, '') // Remove dangerous characters
    .slice(0, 500) // Max 500 chars
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate Ethereum address (0x...)
 */
export function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

/**
 * Validate Bitcoin address (3 formats)
 */
export function isValidBitcoinAddress(address: string): boolean {
  // P2PKH (1...)
  if (/^1[1-9A-HJ-NP-Z]{25,34}$/.test(address)) return true
  // P2SH (3...)
  if (/^3[1-9A-HJ-NP-Z]{25,34}$/.test(address)) return true
  // Bech32 (bc1...)
  if (/^bc1[ac-hj-np-z02-9]{39,59}$/.test(address)) return true
  return false
}

/**
 * Validate positive number
 */
export function isValidAmount(amount: any): boolean {
  const num = Number(amount)
  return !isNaN(num) && num > 0 && num < 1e10 // Max reasonable amount
}

/**
 * Validate private key format (0x...)
 */
export function isValidPrivateKeyFormat(key: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(key)
}

/**
 * Validate seed phrase (word count)
 */
export function isValidSeedPhrase(phrase: string): boolean {
  const words = phrase.trim().split(/\s+/)
  return words.length === 12 || words.length === 24
}

/**
 * Sanitize and validate wallet name
 */
export function sanitizeWalletName(name: string): string {
  const sanitized = sanitizeString(name)
  if (sanitized.length < 1) return 'Unnamed Wallet'
  if (sanitized.length > 50) return sanitized.slice(0, 50)
  return sanitized
}

/**
 * Validate cryptocurrency symbol
 */
export function isValidCryptocurrency(crypto: string): boolean {
  const valid = ['BTC', 'ETH', 'USDT']
  return valid.includes(crypto.toUpperCase())
}

/**
 * Validate fiat currency code
 */
export function isValidFiatCurrency(currency: string): boolean {
  const valid = ['NGN', 'USD', 'EUR', 'GBP', 'CAD']
  return valid.includes(currency.toUpperCase())
}

/**
 * Rate limit key generator from request
 * Uses session user ID if available, otherwise IP
 */
export function generateRateLimitKey(userId?: string, ip?: string): string {
  if (userId) return `user:${userId}`
  return `ip:${ip || 'unknown'}`
}

/**
 * Validate request payload structure
 */
export interface ValidationRule {
  field: string
  type: 'string' | 'number' | 'email' | 'address' | 'amount' | 'enum'
  required?: boolean
  enum?: string[]
  message?: string
}

export function validatePayload(data: any, rules: ValidationRule[]): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  for (const rule of rules) {
    const value = data[rule.field]

    // Check required
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push(`${rule.field} is required`)
      continue
    }

    if (value === undefined || value === null) continue

    // Type validation
    switch (rule.type) {
      case 'string':
        if (typeof value !== 'string') errors.push(`${rule.field} must be a string`)
        break
      case 'number':
        if (typeof value !== 'number' && isNaN(Number(value))) errors.push(`${rule.field} must be a number`)
        break
      case 'email':
        if (!isValidEmail(value)) errors.push(`${rule.field} must be valid email`)
        break
      case 'address':
        if (!isValidEthereumAddress(value) && !isValidBitcoinAddress(value)) {
          errors.push(`${rule.field} must be valid address`)
        }
        break
      case 'amount':
        if (!isValidAmount(value)) errors.push(`${rule.field} must be positive number`)
        break
      case 'enum':
        if (rule.enum && !rule.enum.includes(value)) {
          errors.push(`${rule.field} must be one of: ${rule.enum.join(', ')}`)
        }
        break
    }
  }

  return { valid: errors.length === 0, errors }
}
