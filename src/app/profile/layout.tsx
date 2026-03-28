import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Profile | PayHub',
  description: 'Edit your profile and preferences',
}

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children
}
