// src/lib/sentry.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.2, // Adjust for production needs
  environment: process.env.NODE_ENV,
  enabled: process.env.NODE_ENV === 'production',
})

export { Sentry }
