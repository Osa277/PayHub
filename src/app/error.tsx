'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Error details are logged server-side; avoid leaking in browser console
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center space-y-6 max-w-md">
        <div className="text-6xl">⚠️</div>
        <h1 className="text-3xl font-bold text-black">Something went wrong</h1>
        <p className="text-gray-600">
          An unexpected error occurred. Please try again or contact support if the problem persists.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-medium"
          >
            Try again
          </button>
          <a
            href="/dashboard"
            className="px-6 py-3 bg-gray-100 text-black rounded-lg hover:bg-gray-200 transition font-medium"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}
