import { NextResponse } from 'next/server'
import { apiError } from '@/lib/api-response'

// DEPRECATED: Crypto features removed (Paystack-only version)
export async function GET() {
  return NextResponse.json(
    apiError('Crypto features have been deprecated. Please use Paystack for all payment transactions.', 410),
    { status: 410 }
  )
}

export async function POST() {
  return NextResponse.json(
    apiError('Crypto features have been deprecated. Please use Paystack for all payment transactions.', 410),
    { status: 410 }
  )
}
