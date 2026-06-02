import { z } from 'zod'

/**
 * Server-side environment variable validation.
 * Imported by server code to ensure required config is present.
 * Optional vars use .optional() — missing ones disable features gracefully.
 */

const envSchema = z.object({
  // Required — app will not function without these
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  NEXTAUTH_SECRET: z.string().min(1, 'NEXTAUTH_SECRET is required'),
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL'),

  // Authentication — optional (Google OAuth disabled if missing)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // Payments — optional (features disabled if missing)
  PAYSTACK_SECRET_KEY: z.string().optional(),

  // Wallet encryption (legacy, not required)
  WALLET_ENCRYPTION_KEY: z.string().min(32, 'WALLET_ENCRYPTION_KEY must be at least 32 characters').optional(),

  // Email — optional (falls back to console logging)
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),

  // SMS — optional (disabled if missing)
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),

  // Blockchain — optional
  ETHEREUM_RPC_URL: z.string().optional(),
  INFURA_API_KEY: z.string().optional(),

  // Rate limiting — optional (falls back to in-memory)
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
})

export type Env = z.infer<typeof envSchema>

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env)

  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => `  ${issue.path.join('.')}: ${issue.message}`)
      .join('\n')
    console.error(`\n❌ Environment variable validation failed:\n${errors}\n`)
    throw new Error(`Missing or invalid environment variables:\n${errors}`)
  }

  return result.data
}

export const env = validateEnv()
