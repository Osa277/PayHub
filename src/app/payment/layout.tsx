import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Send Money | PayHub',
  description: 'Send payments securely via Stripe',
}

export default function PaymentLayout({ children }: { children: React.ReactNode }) {
  return children
}
