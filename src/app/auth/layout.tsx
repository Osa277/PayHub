import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Account | PayHub',
  description: 'Sign in or create your PayHub account',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
