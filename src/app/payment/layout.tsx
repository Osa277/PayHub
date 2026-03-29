import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Send Money | PayHub',
  description: 'Send payments securely via PayHub',
}

export default function PaymentLayout({ children }: { children: React.ReactNode }) {
  return children
}
