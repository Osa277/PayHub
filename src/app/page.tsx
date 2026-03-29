'use client'
import { useSession } from 'next-auth/react'

export default function Home() {
  const { data: session } = useSession()
  const isAuthenticated = !!session?.user

  return (
    <div className="space-y-8">
      <section className="text-center space-y-4">
        <h1 className="text-5xl font-bold text-gray-900">Welcome to PayHub</h1>
        <p className="text-xl text-gray-600">
          Fast, secure, and simple payments for everyone
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6 text-center hover:shadow-lg transition">
          <div className="text-4xl mb-3">💰</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Send Money</h2>
          <p className="text-gray-600">
            Send money locally and internationally with ease
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 text-center hover:shadow-lg transition">
          <div className="text-4xl mb-3">🏦</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Digital Wallet</h2>
          <p className="text-gray-600">
            Manage your funds in a secure digital wallet
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 text-center hover:shadow-lg transition">
          <div className="text-4xl mb-3">📋</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Invoices</h2>
          <p className="text-gray-600">
            Create and manage invoices effortlessly
          </p>
        </div>
      </div>

      <section className="bg-blue-50 border border-blue-200 rounded-lg p-8">
        <h2 className="text-2xl font-bold text-blue-900 mb-4">Key Features</h2>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-blue-800">
          <li className="flex items-start gap-3">
            <span className="text-green-600 font-bold">✓</span>
            <span>Multi-currency exchange with real-time rates</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-green-600 font-bold">✓</span>
            <span>Paystack & Crypto payment support</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-green-600 font-bold">✓</span>
            <span>Recurring payment support</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-green-600 font-bold">✓</span>
            <span>Secure transaction encryption</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-green-600 font-bold">✓</span>
            <span>Admin dashboard for management</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-green-600 font-bold">✓</span>
            <span>Transaction history & reports</span>
          </li>
        </ul>
      </section>

      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">
          {isAuthenticated ? 'Get Started with PayHub' : 'Join PayHub Today'}
        </h2>
        <div className="flex gap-4 justify-center">
          {isAuthenticated ? (
            <>
              <a
                href="/payment"
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-semibold transition"
              >
                Send Money
              </a>
              <a
                href="/wallet"
                className="bg-gray-200 text-gray-900 px-8 py-3 rounded-lg hover:bg-gray-300 font-semibold transition"
              >
                View Wallet
              </a>
            </>
          ) : (
            <>
              <a
                href="/auth/signup"
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-semibold transition"
              >
                Create Free Account
              </a>
              <a
                href="/auth/login"
                className="bg-gray-200 text-gray-900 px-8 py-3 rounded-lg hover:bg-gray-300 font-semibold transition"
              >
                Sign In
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
