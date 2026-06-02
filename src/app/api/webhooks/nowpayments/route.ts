import { NextResponse } from 'next/server'

// DEPRECATED: NowPayments webhook removed (crypto payments no longer supported)
export async function POST() {
  return NextResponse.json(
    { success: false, error: 'NowPayments webhooks are deprecated.' },
    { status: 410 }
  )
}
