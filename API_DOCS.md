# API Documentation

This document provides an overview of the main API endpoints for your application, including authentication, validation, rate limiting, and security requirements.

---

## Authentication
- Most endpoints require a valid JWT (NextAuth) token in the Authorization header or session cookie.
- Financial and user data endpoints require email verification.

---

## Endpoints

### Auth
- `POST /api/auth/login` — User login
- `POST /api/auth/signup` — User registration
- `POST /api/auth/forgot-password` — Request password reset
- `POST /api/auth/reset-password` — Reset password
- `POST /api/auth/verify-email` — Verify email
- `POST /api/auth/resend-verification` — Resend verification email

### User & Profile
- `GET /api/profile` — Get user profile (auth required)
- `PATCH /api/profile` — Update profile (auth required)
- `PUT /api/profile` — Set PIN (auth required)

### Wallet
- `GET /api/wallet` — Get wallet info (auth required)
- `POST /api/wallet/transfer` — Transfer funds (auth, verified, rate limited)
- `POST /api/wallet/withdraw` — Withdraw funds (auth, verified, rate limited)


### Payments
- `POST /api/payments` — Make payment (auth, verified, rate limited)
- `POST /api/payments/process` — Process payment (auth, verified)
- `POST /api/payments/cancel` — Cancel payment (auth, verified)

### Invoices
- `GET /api/invoices` — List invoices (auth required)
- `POST /api/invoices` — Create invoice (auth, verified)
- `PATCH /api/invoices` — Update invoice (auth, verified)

### Webhooks
- `POST /api/webhooks/paystack` — Paystack payment notifications

---

## Security & Best Practices
- All sensitive endpoints require authentication and email verification.
- Input validation and rate limiting are enforced on all endpoints.
- Errors are logged and monitored with Sentry in production.
- Never expose sensitive data in API responses or logs.

---

## Deployment Checklist
- Set all environment variables (see .env for required keys).
- Use HTTPS and a secure host (Vercel, AWS, etc.).
- Monitor logs and Sentry for errors and suspicious activity.
- Rotate all secrets before launch.

---

For detailed request/response schemas, see the code or request further OpenAPI/Swagger documentation.
