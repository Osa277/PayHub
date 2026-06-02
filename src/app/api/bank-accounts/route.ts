import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { bankAccountSchema } from '@/lib/validations'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const bankAccounts = await prisma.bankAccount.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    })

    const response = NextResponse.json({
      success: true,
      data: bankAccounts,
    })

    response.headers.set('Cache-Control', 'private, max-age=10, stale-while-revalidate=30')
    return response
  } catch (error) {
    logger.error('Bank accounts fetch error', { error })
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const parsed = bankAccountSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { accountNumber, bankCode, bankName, accountName } = parsed.data

    // Check if account already exists
    const existing = await prisma.bankAccount.findUnique({
      where: {
        userId_accountNumber_bankCode: {
          userId: session.user.id,
          accountNumber,
          bankCode,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Bank account already exists' },
        { status: 400 }
      )
    }

    const bankAccount = await prisma.bankAccount.create({
      data: {
        userId: session.user.id,
        accountNumber,
        bankCode,
        bankName,
        accountName,
        isDefault: false,
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: bankAccount,
        message: 'Bank account added successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    logger.error('Bank account create error', { error })
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
