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
      <body className="bg-white">
        <AuthProvider>
          <ToastProvider>
            <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:bg-blue-900 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg">
              Skip to main content
            </a>
            <Navbar />
            <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <ErrorBoundary>{children}</ErrorBoundary>
            </main>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
