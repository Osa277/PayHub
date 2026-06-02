# PayHub - Payment Application

A modern, full-stack payment application for local and international transactions built with **Next.js**, **TypeScript**, **React**, and **Tailwind CSS**.

## Features

- **Digital Wallet** — Manage funds in a secure digital wallet
- **Paystack Payments** — Top up wallet via card, bank transfer, or USSD (NGN)
- **Google OAuth** — Sign in with Google or email/password
- **Dashboard** — Transaction overview and financial statistics
- **Wallet Transfers** — Send money to other PayHub users by email
- **Email Notifications** — Password reset and payment confirmations via Resend
- **Responsive Design** — Works seamlessly on desktop and mobile
- **Secure** — JWT auth, HMAC webhook verification, CSP headers, rate limiting

## Tech Stack

- **Framework:** Next.js 14, React 18, TypeScript
- **Styling:** Tailwind CSS
- **Auth:** NextAuth v4 (Google OAuth + Credentials)
- **Database:** PostgreSQL on Neon (via Prisma ORM)
- **Email:** Resend SDK

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   Create a `.env` file with:
   ```
   DATABASE_URL=your_neon_connection_string
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_secret
   GOOGLE_CLIENT_ID=your_google_id
   GOOGLE_CLIENT_SECRET=your_google_secret
   PAYSTACK_SECRET_KEY=sk_test_...
   PAYSTACK_PUBLIC_KEY=pk_test_...
   RESEND_API_KEY=your_resend_key
   ```

3. **Set up database**
   ```bash
   npx prisma db push
   ```

4. **Run dev server**
   ```bash
   npm run dev
   ```

5. Open http://localhost:3000

## API Routes

### Auth
- `POST /api/signup` — Register new user
- `POST /api/auth/forgot-password` — Request password reset
- `POST /api/auth/reset-password` — Reset password with token


### Paystack
- `POST /api/paystack/initialize` — Create Paystack checkout session
- `GET /api/paystack/verify?reference=...` — Verify Paystack payment

### Wallet
- `GET /api/wallet` — Get wallet balance
- `POST /api/wallet/transfer` — Transfer to another user

### Webhooks
- `POST /api/webhooks/paystack` — Paystack payment webhook
- `POST /api/webhooks/nowpayments` — NOWPayments IPN webhook

## Deployment

Deploy to Vercel:

1. Push code to GitHub
2. Connect repo in Vercel dashboard
3. Set all environment variables (use production keys)
4. Set `NEXTAUTH_URL` to your Vercel domain
5. Deploy

See [DEPLOYMENT.md](DEPLOYMENT.md) for full checklist.

## License

Private

