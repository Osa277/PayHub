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

    // Get or create wallet
    let walletData = await prisma.wallet.findUnique({
      where: { userId },
    })
    if (!walletData) {
      walletData = await prisma.wallet.create({
        data: { userId, balance: 0, currency: 'NGN' },
      })
    }

    // Fetch invoices and transactions in parallel
    const [invoicesData, transactionData] = await Promise.all([
      prisma.invoice.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.transaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          type: true,
          amount: true,
          currency: true,
          status: true,
          description: true,
          createdAt: true,
        },
      }),
    ])

    // OPTIMIZED: Calculate stats from single transaction query
    const totalSpent = transactionData
      .filter(tx => tx.type === 'payment' && tx.status === 'completed')
      .reduce((sum, tx) => sum + Number(tx.amount), 0)
    const totalReceived = transactionData
      .filter(tx => tx.type === 'deposit' && tx.status === 'completed')
      .reduce((sum, tx) => sum + Number(tx.amount), 0)
    const recentTransactions = transactionData.slice(0, 5)

    // Format invoices for frontend
    const formattedInvoices = invoicesData.map((inv) => ({
      id: inv.id,
      userId: inv.userId,
      transactionId: inv.transactionId,
      amount: Number(inv.amount),
      currency: inv.currency,
      status: inv.status,
      items: Array.isArray(inv.items)
        ? (inv.items as any[]).map((item: any) => ({
            ...item,
            unitPrice: Number(item.unitPrice ?? 0),
            total: Number(item.total ?? 0),
          }))
        : inv.items,
      dueDate: inv.dueDate,
      createdAt: inv.createdAt,
      updatedAt: inv.updatedAt,
    }))

    const response = NextResponse.json({
      success: true,
      data: {
        stats: {
          totalBalance: Number(walletData?.balance ?? 0),
          totalSpent,
          totalReceived,
          transactionCount: transactionData.length,
          currency: walletData?.currency ?? 'NGN',
        },
        invoices: formattedInvoices,
        recentTransactions: recentTransactions.map((tx) => ({
          id: tx.id,
          type: tx.type,
          amount: Number(tx.amount),
          currency: tx.currency,
          status: tx.status,
          description: tx.description,
          createdAt: tx.createdAt,
        })),
      },
    })

    // Allow browser to cache for 10s, revalidate in background
    response.headers.set('Cache-Control', 'private, max-age=10, stale-while-revalidate=30')
    return response
  } catch (error) {
    logger.error('Dashboard fetch error', { error })
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
