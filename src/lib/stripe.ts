import Stripe from 'stripe'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const hasConfiguredStripeKey = Boolean(
  stripeSecretKey &&
  stripeSecretKey.trim() !== '' &&
  !stripeSecretKey.includes('your_')
)

// Only initialize if key is present (allows app to run without Stripe in dev)
export const stripe = hasConfiguredStripeKey
  ? new Stripe(stripeSecretKey!)
  : null

function assertValidStripeKey() {
  if (!stripeSecretKey || stripeSecretKey.trim() === '') {
    return
  }

  if (stripeSecretKey.includes('...')) {
    throw new Error(
      'Stripe configuration error. STRIPE_SECRET_KEY appears truncated or masked. Paste the full key from the Stripe dashboard into .env and restart the dev server.'
    )
  }

  if (!/^sk_(test|live)_/.test(stripeSecretKey)) {
    throw new Error(
      'Stripe configuration error. STRIPE_SECRET_KEY must start with sk_test_ or sk_live_.'
    )
  }
}

export async function createPaymentIntent(
  amount: number,
  currency: string,
  metadata?: Record<string, string>
) {
  assertValidStripeKey()

  if (!stripe) {
    throw new Error('Stripe is not configured. Set STRIPE_SECRET_KEY in .env to use Stripe payments.')
  }

  return stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency: currency.toLowerCase(),
    metadata,
  })
}

export async function retrievePaymentIntent(paymentIntentId: string) {
  assertValidStripeKey()

  if (!stripe) {
    throw new Error('Stripe is not configured. Set STRIPE_SECRET_KEY in .env to use Stripe payments.')
  }

  return stripe.paymentIntents.retrieve(paymentIntentId)
}

export async function createRefund(paymentIntentId: string, amount?: number) {
  assertValidStripeKey()

  if (!stripe) {
    throw new Error('Stripe is not configured. Set STRIPE_SECRET_KEY in .env to use Stripe payments.')
  }

  return stripe.refunds.create({
    payment_intent: paymentIntentId,
    ...(amount ? { amount: Math.round(amount * 100) } : {}),
  })
}

