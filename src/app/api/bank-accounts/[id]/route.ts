import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const bankAccount = await prisma.bankAccount.findUnique({
      where: { id: params.id },
    })

    if (!bankAccount || bankAccount.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Bank account not found' },
        { status: 404 }
      )
    }

    await prisma.bankAccount.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
      message: 'Bank account deleted successfully',
    })
  } catch (error) {
    logger.error('Bank account delete error', { error })
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
