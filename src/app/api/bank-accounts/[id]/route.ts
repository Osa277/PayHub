import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const updateBankAccountSchema = z.object({
  accountName: z.string().min(1).max(100).optional(),
  bankName: z.string().min(1).max(100).optional(),
  isDefault: z.boolean().optional(),
})

export async function GET(
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

    return NextResponse.json({
      success: true,
      data: bankAccount,
    })
  } catch (error) {
    logger.error('Bank account fetch error', { error })
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
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

    const body = await req.json()
    const parsed = updateBankAccountSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
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

    const { accountName, bankName, isDefault } = parsed.data

    // If setting as default, unset all others first
    if (isDefault) {
      await prisma.bankAccount.updateMany({
        where: { userId: session.user.id, isDefault: true },
        data: { isDefault: false },
      })
    }

    const updated = await prisma.bankAccount.update({
      where: { id: params.id },
      data: {
        ...(accountName !== undefined && { accountName }),
        ...(bankName !== undefined && { bankName }),
        ...(isDefault !== undefined && { isDefault }),
      },
    })

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Bank account updated successfully',
    })
  } catch (error) {
    logger.error('Bank account update error', { error })
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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
