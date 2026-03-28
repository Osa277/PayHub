import type { Metadata } from 'next'
import { Navbar } from '@/components/Navbar'
import { AuthProvider } from '@/components/AuthProvider'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ToastProvider } from '@/components/Toast'
import './globals.css'

export const metadata: Metadata = {
  title: 'PayHub - Payment Application',
  description: 'Local and international payment platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-100">
        <AuthProvider>
          <ToastProvider>
          <Navbar />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <ErrorBoundary>{children}</ErrorBoundary>
          </main>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
