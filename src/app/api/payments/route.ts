import { NextResponse } from 'next/server'

// DEPRECATED: Direct crypto payments removed (Paystack-only version)
export async function POST() {
  return NextResponse.json(
    { success: false, error: 'Direct crypto payments are deprecated. Please use Paystack.' },
    { status: 410 }
  )
}

export async function GET() {
  return NextResponse.json(
    { success: false, error: 'Direct crypto payments are deprecated. Please use Paystack.' },
    { status: 410 }
  )
}
