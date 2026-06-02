import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center space-y-6 max-w-md">
        <div className="text-6xl">🔍</div>
        <h1 className="text-3xl font-bold text-black">Page Not Found</h1>
        <p className="text-gray-600">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-medium"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="px-6 py-3 bg-gray-100 text-black rounded-lg hover:bg-gray-200 transition font-medium"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  )
}
