import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { withdrawalSchema } from '@/lib/validations'
import { createPaystackRecipient, initiatePaystackTransfer } from '@/lib/paystack'

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
    const parsed = withdrawalSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { amount, bankAccountId, description } = parsed.data

    // Get bank account
    const bankAccount = await prisma.bankAccount.findUnique({
      where: { id: bankAccountId },
    })

    if (!bankAccount || bankAccount.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Bank account not found' },
        { status: 404 }
      )
    }

    // Get user's wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId: session.user.id },
    })

    if (!wallet) {
      return NextResponse.json(
        { success: false, error: 'Wallet not found' },
        { status: 404 }
      )
    }

    // Calculate fee (1% withdrawal fee, rounded to 2 decimal places)
    const fee = Math.round(amount * 0.01 * 100) / 100
    const totalAmount = amount + fee

    // Check balance
    if (Number(wallet.balance) < totalAmount) {
      return NextResponse.json(
        { success: false, error: 'Insufficient balance' },
        { status: 400 }
      )
    }

    // Create transaction record (pending)
    const transaction = await prisma.transaction.create({
      data: {
        userId: session.user.id,
        type: 'withdrawal',
        amount,
        currency: wallet.currency,
        status: 'pending',
        description: description || 'Withdrawal to bank account',
        fee,
        bankAccountId,
        metadata: {
          bankName: bankAccount.bankName,
          accountNumber: bankAccount.accountNumber.slice(-4),
        },
      },
    })

    try {
      // Create Paystack recipient
      const recipientRes = await createPaystackRecipient({
        type: 'nuban',
        name: bankAccount.accountName,
        account_number: bankAccount.accountNumber,
        bank_code: bankAccount.bankCode,
        currency: wallet.currency === 'NGN' ? 'NGN' : 'GHS',
      })

      // Initiate transfer (amount in kobo for NGN)
      const transferAmountKobo = Math.round(amount * 100)
      const transferRes = await initiatePaystackTransfer({
        type: 'nuban',
        source: 'balance',
        amount: transferAmountKobo,
        recipient: recipientRes.data.recipient_code,
        reason: description || 'Withdrawal via PayHub',
      })

      // Update transaction and deduct balance atomically
      await prisma.$transaction([
        prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: 'completed',
            metadata: {
              ...(((transaction.metadata || {}) as Record<string, any>)),
              transferReference: transferRes.data.reference,
              transferCode: transferRes.data.transfer_code,
            },
          },
        }),
        prisma.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: { decrement: totalAmount },
          },
        }),
      ])

      return NextResponse.json(
        {
          success: true,
          data: transaction,
          message: 'Withdrawal initiated successfully',
        },
        { status: 201 }
      )
    } catch (paystackError) {
      const errMessage = paystackError instanceof Error ? paystackError.message : 'Paystack transfer failed'
      logger.error('Paystack transfer error', { error: paystackError })

      // Update transaction to failed
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'failed',
          metadata: {
            ...(((transaction.metadata || {}) as Record<string, unknown>)),
            error: errMessage,
          },
        },
      })

      return NextResponse.json(
        {
          success: false,
          error: errMessage,
        },
        { status: 400 }
      )
    }
  } catch (error) {
    logger.error('Withdrawal create error', { error })
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
