import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions['adapter'],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: '/auth/login',
    newUser: '/auth/complete-profile',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user || !user.hashedPassword) {
          throw new Error('Invalid email or password')
        }

        const isValid = await bcrypt.compare(credentials.password, user.hashedPassword)
        if (!isValid) {
          throw new Error('Invalid email or password')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id: string }).id = token.id as string

        // Fetch full user data from DB
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          include: { wallet: true },
        })
        if (dbUser) {
          session.user.name = dbUser.name
          session.user.email = dbUser.email
          ;(session.user as Record<string, unknown>).phone = dbUser.phone
          ;(session.user as Record<string, unknown>).country = dbUser.country
          ;(session.user as Record<string, unknown>).avatar = dbUser.avatar
          ;(session.user as Record<string, unknown>).isVerified = dbUser.isVerified
          ;(session.user as Record<string, unknown>).walletBalance = dbUser.wallet?.balance ?? 0
          ;(session.user as Record<string, unknown>).currency = dbUser.wallet?.currency ?? 'USD'
        }
      }
      return session
    },
  },
}
