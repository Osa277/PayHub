import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Wallet | PayHub',
  description: 'Manage your wallet balance, top up, and transfer funds',
}

export default function WalletLayout({ children }: { children: React.ReactNode }) {
  return children
}
