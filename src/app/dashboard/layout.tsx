import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard | PayHub',
  description: 'View your payment stats, invoices, and account summary',
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children
}
