const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || ''
const PAYSTACK_BASE_URL = 'https://api.paystack.co'

export interface PaystackInitializeParams {
  email: string
  amount: number // in kobo/cents (e.g. 5000 = ₦50.00 or $50.00)
  currency?: 'NGN' | 'GHS' | 'ZAR' | 'USD'
  reference?: string
  callbackUrl?: string
  metadata?: Record<string, unknown>
}

export interface PaystackInitializeResponse {
  status: boolean
  message: string
  data: {
    authorization_url: string
    access_code: string
    reference: string
  }
}

export interface PaystackVerifyResponse {
  status: boolean
  message: string
  data: {
    id: number
    status: 'success' | 'failed' | 'abandoned'
    reference: string
    amount: number
    currency: string
    channel: string
    paid_at: string | null
    customer: {
      email: string
    }
    metadata: Record<string, unknown> | null
  }
}

function getHeaders() {
  return {
    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json',
  }
}

export function isPaystackConfigured(): boolean {
  return PAYSTACK_SECRET_KEY.startsWith('sk_')
}

/**
 * Initialize a Paystack transaction — returns a checkout URL for the user
 */
export async function initializePaystackPayment(
  params: PaystackInitializeParams
): Promise<PaystackInitializeResponse> {
  if (!isPaystackConfigured()) {
    throw new Error('Paystack is not configured. Set PAYSTACK_SECRET_KEY in .env')
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)

  const res = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      email: params.email,
      amount: params.amount,
      currency: params.currency || 'NGN',
      reference: params.reference,
      callback_url: params.callbackUrl,
      metadata: params.metadata,
    }),
    signal: controller.signal,
  })

  clearTimeout(timeout)

  const data = await res.json()
  if (!data.status) {
    throw new Error(data.message || 'Paystack initialization failed')
  }
  return data
}

/**
 * Verify a Paystack transaction by reference
 */
export async function verifyPaystackPayment(
  reference: string
): Promise<PaystackVerifyResponse> {
  if (!isPaystackConfigured()) {
    throw new Error('Paystack is not configured')
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)

  const res = await fetch(
    `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
    {
      method: 'GET',
      headers: getHeaders(),
      signal: controller.signal,
    }
  )

  clearTimeout(timeout)

  const data = await res.json()
  if (!data.status) {
    throw new Error(data.message || 'Paystack verification failed')
  }
  return data
}

export interface PaystackTransferParams {
  type: 'nuban' // Nigerian bank account
  source: 'balance' // Use account balance
  amount: number // in kobo/cents
  reason: string
  recipient: string // recipient code
}

export interface PaystackTransferResponse {
  status: boolean
  message: string
  data: {
    reference: string
    integration: number
    domain: string
    amount: number
    currency: string
    source: string
    source_details: null | Record<string, unknown>
    reason: string
    recipient: number
    status: string
    transfer_code: string
    titan_code: null | string
    transferred_at: null | string
    timestamp: number
    fees: number
  }
}

export interface PaystackRecipientParams {
  type: 'nuban'
  name: string // account name
  account_number: string
  bank_code: string
  currency?: string
}

export interface PaystackRecipientResponse {
  status: boolean
  message: string
  data: {
    recipient_code: string
    active: boolean
    name: string
    description: null | string
    metadata: null | Record<string, unknown>
    type: string
    domain: string
    currency: string
    accounts: Array<{
      id: number
      type: string
      account_number: string
      bank_code: string
      bank_name: string
    }>
    createdAt: string
    updatedAt: string
  }
}

/**
 * Create a transfer recipient on Paystack
 */
export async function createPaystackRecipient(
  params: PaystackRecipientParams
): Promise<PaystackRecipientResponse> {
  if (!isPaystackConfigured()) {
    throw new Error('Paystack is not configured')
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)

  const res = await fetch(`${PAYSTACK_BASE_URL}/transferrecipient`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      type: params.type,
      name: params.name,
      account_number: params.account_number,
      bank_code: params.bank_code,
      currency: params.currency || 'NGN',
    }),
    signal: controller.signal,
  })

  clearTimeout(timeout)

  const data = await res.json()
  if (!data.status) {
    throw new Error(data.message || 'Failed to create recipient')
  }
  return data
}

/**
 * Initiate a transfer to a recipient
 */
export async function initiatePaystackTransfer(
  params: PaystackTransferParams
): Promise<PaystackTransferResponse> {
  if (!isPaystackConfigured()) {
    throw new Error('Paystack is not configured')
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)

  const res = await fetch(`${PAYSTACK_BASE_URL}/transfer`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      source: params.source,
      amount: params.amount,
      recipient: params.recipient,
      reason: params.reason,
      type: params.type,
    }),
    signal: controller.signal,
  })

  clearTimeout(timeout)

  const data = await res.json()
  if (!data.status) {
    throw new Error(data.message || 'Paystack transfer failed')
  }
  return data
}
