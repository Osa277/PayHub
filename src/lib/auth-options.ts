import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
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
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      allowDangerousEmailAccountLinking: true,
      httpOptions: {
        timeout: 10000, // 10 seconds for Google API calls
      },
    }),
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
    async jwt({ token, user, trigger }) {
      // On initial sign-in, store user data in the token
      if (user) {
        token.id = user.id
        token.name = user.name
        token.email = user.email
      }
      // On explicit refresh, reload user data from DB
      if (trigger === 'update') {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          include: { wallet: true },
        })
        if (dbUser) {
          token.name = dbUser.name
          token.email = dbUser.email
          token.phone = dbUser.phone
          token.country = dbUser.country
          token.avatar = dbUser.avatar
          token.isVerified = dbUser.isVerified
          token.walletBalance = dbUser.wallet?.balance ?? 0
          token.currency = dbUser.wallet?.currency ?? 'USD'
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        // Pass token data to session — no DB query needed
        (session.user as { id: string }).id = token.id as string
        session.user.name = token.name as string
        session.user.email = token.email as string
        ;(session.user as Record<string, unknown>).phone = token.phone ?? null
        ;(session.user as Record<string, unknown>).country = token.country ?? null
        ;(session.user as Record<string, unknown>).avatar = token.avatar ?? null
        ;(session.user as Record<string, unknown>).isVerified = token.isVerified ?? false
        ;(session.user as Record<string, unknown>).walletBalance = token.walletBalance ?? 0
        ;(session.user as Record<string, unknown>).currency = token.currency ?? 'USD'
      }
      return session
    },
  },
  events: {
    // Auto-create wallet when a new user signs in via OAuth
    async createUser({ user }) {
      await prisma.wallet.create({
        data: {
          userId: user.id,
          balance: 0,
          currency: 'USD',
        },
      })
    },
  },
}
