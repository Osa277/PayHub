import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { transferSchema } from '@/lib/validations'
import { rateLimiters } from '@/lib/rate-limit'
import { notifyPaymentSent, notifyTransferReceived } from '@/lib/notifications'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { success: allowed } = rateLimiters.transfer(session.user.id)
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many transfer requests. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await req.json()
    const parsed = transferSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { recipientEmail, amount, description } = parsed.data

    if (recipientEmail === session.user.email) {
      return NextResponse.json(
        { success: false, error: 'Cannot transfer to yourself' },
        { status: 400 }
      )
    }

    const recipient = await prisma.user.findUnique({
      where: { email: recipientEmail },
      include: { wallet: true },
    })

    if (!recipient || !recipient.wallet) {
      return NextResponse.json(
        { success: false, error: 'Recipient not found or has no wallet' },
        { status: 404 }
      )
    }

    const fee = Math.round(amount * 0.005 * 100) / 100 // 0.5% transfer fee
    const totalDeduction = amount + fee

    const result = await prisma.$transaction(async (tx) => {
      const senderWallet = await tx.wallet.findUnique({
        where: { userId: session.user.id },
      })

      if (!senderWallet || senderWallet.balance < totalDeduction) {
        throw new Error('Insufficient balance')
      }

      // Deduct from sender
      await tx.wallet.update({
        where: { userId: session.user.id },
        data: { balance: { decrement: totalDeduction } },
      })

      // Credit to recipient
      await tx.wallet.update({
        where: { userId: recipient.id },
        data: { balance: { increment: amount } },
      })

      // Sender transaction
      const senderTx = await tx.transaction.create({
        data: {
          userId: session.user.id,
          type: 'transfer',
          amount,
          currency: senderWallet.currency,
          status: 'completed',
          description: description || `Transfer to ${recipient.name || recipientEmail}`,
          recipientId: recipient.id,
          recipientName: recipient.name,
          recipientEmail,
          fee,
        },
      })

      // Recipient transaction
      await tx.transaction.create({
        data: {
          userId: recipient.id,
          type: 'deposit',
          amount,
          currency: senderWallet.currency,
          status: 'completed',
          description: `Transfer from ${session.user.name || session.user.email}`,
          fee: 0,
        },
      })

      return senderTx
    })

    // Send notifications to sender and recipient (non-blocking)
    const sender = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (sender) {
      notifyPaymentSent(sender.email, sender.phone, {
        amount,
        currency: 'USD',
        recipient: recipient.name || recipientEmail,
        txnId: result.id,
      }).catch(() => {})
    }
    notifyTransferReceived(recipient.email, recipient.phone, {
      amount,
      currency: 'USD',
      senderName: session.user.name || session.user.email || 'Someone',
    }).catch(() => {})

    return NextResponse.json({
      success: true,
      data: result,
      message: `Successfully transferred ${amount} to ${recipientEmail}`,
    })
  } catch (error) {
    const message =
      error instanceof Error && error.message === 'Insufficient balance'
        ? 'Insufficient balance'
        : 'Internal server error'
    const status = message === 'Insufficient balance' ? 400 : 500
    if (status === 500) logger.error('Transfer error', { error })
    return NextResponse.json({ success: false, error: message }, { status })
  }
}
