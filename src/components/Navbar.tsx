'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'

export const Navbar: React.FC = () => {
  const router = useRouter()
  const { data: session } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isAuthenticated = !!session?.user
  const user = session?.user

  const handleLogout = async () => {
    await signOut({ redirect: false })
    router.push('/auth/login')
  }

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💳</span>
            <Link href="/" className="text-xl font-bold text-blue-900">PayHub</Link>
          </div>

          {/* Desktop Nav */}
          <ul className="hidden md:flex items-center gap-8">
            <li>
              <Link href="/" className="text-black hover:text-blue-900 font-medium transition">
                Home
              </Link>
            </li>
            {isAuthenticated && (
              <>
                <li>
                  <Link href="/wallet" className="text-black hover:text-blue-900 font-medium transition">
                    Wallet
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="text-black hover:text-blue-900 font-medium transition">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/invoices" className="text-black hover:text-blue-900 font-medium transition">
                    Invoices
                  </Link>
                </li>
                <li>
                  <Link href="/bank-accounts" className="text-black hover:text-blue-900 font-medium transition">
                    Bank Accounts
                  </Link>
                </li>
              </>
            )}

            {isAuthenticated ? (
              <li className="flex items-center gap-3">
                <Link href="/profile" className="flex items-center gap-2 hover:opacity-80 transition">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-900">
                    {user?.avatar || initials}
                  </div>
                  <span className="text-sm font-medium text-black hidden lg:inline">
                    {user?.name}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-blue-50 text-black px-4 py-2 rounded-lg hover:bg-blue-100 font-medium text-sm transition"
                >
                  Sign Out
                </button>
              </li>
            ) : (
              <li className="flex items-center gap-3">
                <Link
                  href="/auth/login"
                  className="text-black hover:text-blue-900 font-medium transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-950 font-medium transition"
                >
                  Sign Up
                </Link>
              </li>
            )}
          </ul>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-black hover:text-blue-900"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div id="mobile-menu" className="md:hidden pb-4 border-t border-blue-100" role="navigation" aria-label="Mobile navigation">
            <div className="flex flex-col gap-2 pt-4">
              <Link href="/" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 text-black hover:bg-blue-50 rounded-lg font-medium">
                Home
              </Link>
              {isAuthenticated ? (
                <>
                  <Link href="/wallet" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 text-black hover:bg-blue-50 rounded-lg font-medium">
                    Wallet
                  </Link>
                  <Link href="/crypto" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 text-black hover:bg-blue-50 rounded-lg font-medium">
                    Crypto
                  </Link>
                  <Link href="/crypto/transactions" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 text-black hover:bg-blue-50 rounded-lg font-medium">
                    Transactions
                  </Link>
                  <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 text-black hover:bg-blue-50 rounded-lg font-medium">
                    Dashboard
                  </Link>
                  <Link href="/invoices" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 text-black hover:bg-blue-50 rounded-lg font-medium">
                    Invoices
                  </Link>
                  <Link href="/bank-accounts" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 text-black hover:bg-blue-50 rounded-lg font-medium">
                    Bank Accounts
                  </Link>
                  <div className="border-t border-blue-100 mt-2 pt-2 px-3 flex items-center justify-between">
                    <Link href="/profile" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-900">
                        {user?.avatar || initials}
                      </div>
                      <span className="text-sm font-medium text-black">{user?.name}</span>
                    </Link>
                    <button onClick={handleLogout} className="text-red-600 text-sm font-medium">
                      Sign Out
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-2 mt-2">
                  <Link
                    href="/auth/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-2 text-center text-black border border-blue-900 rounded-lg font-medium"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-2 text-center bg-blue-900 text-white rounded-lg font-medium"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
