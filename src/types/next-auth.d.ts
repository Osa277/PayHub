import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      phone?: string | null
      country?: string | null
      avatar?: string | null
      isVerified?: boolean
      walletBalance?: number
      currency?: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
  }
}
