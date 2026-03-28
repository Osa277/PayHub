import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Get wallet balance
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
    })

    // Get transactions
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    // Calculate stats
    const totalSpent = transactions
      .filter((t) => t.type === 'payment' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0)

    const totalReceived = transactions
      .filter((t) => t.type === 'deposit' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0)

    // Get invoices
    const invoices = await prisma.invoice.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    // Format invoices for frontend
    const formattedInvoices = invoices.map((inv) => ({
      id: inv.id,
      userId: inv.userId,
      transactionId: inv.transactionId,
      amount: inv.amount,
      currency: inv.currency,
      status: inv.status,
      items: inv.items,
      dueDate: inv.dueDate,
      createdAt: inv.createdAt,
      updatedAt: inv.updatedAt,
    }))

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalBalance: wallet?.balance ?? 0,
          totalSpent,
          totalReceived,
          transactionCount: transactions.length,
          currency: wallet?.currency ?? 'USD',
        },
        invoices: formattedInvoices,
      },
    })
  } catch (error) {
    logger.error('Dashboard fetch error', { error })
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
