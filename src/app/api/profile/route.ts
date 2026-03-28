import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { profileUpdateSchema } from '@/lib/validations'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, avatar: true, phone: true, country: true, bio: true },
    })
    const wallet = await prisma.wallet.findFirst({
      where: { userId: session.user.id },
      select: { currency: true },
    })

    return NextResponse.json({
      success: true,
      data: { ...user, currency: wallet?.currency ?? 'USD' },
    })
  } catch (error) {
    logger.error('Profile fetch error', { error })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = profileUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { currency, avatar, bio, name, phone, country } = parsed.data

    const data: Record<string, string | null> = {}
    if (avatar !== undefined) data.avatar = avatar || null
    if (bio !== undefined) data.bio = bio || null
    if (name) data.name = name
    if (phone !== undefined) data.phone = phone || null
    if (country !== undefined) data.country = country || null

    if (Object.keys(data).length > 0) {
      await prisma.user.update({
        where: { id: session.user.id },
        data,
      })
    }

    if (currency) {
      await prisma.wallet.updateMany({
        where: { userId: session.user.id },
        data: { currency },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Profile update error', { error })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
