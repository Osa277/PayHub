# Data Collection & Logging Guide

This guide shows how to use the new logging system to collect and view all data flowing through your app.

## 🎯 Quick Start

### 1. **Backend API Logging (Automatic)**

All API routes now automatically log requests/responses. Just update your route handlers to use the logger:

```typescript
// Example: src/app/api/payments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { logApiRequest } from '@/lib/api-logger';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  // Start logging
  const apiLog = await logApiRequest(request, 'POST /api/payments');
  
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Your business logic here
    const result = await prisma.transaction.create({
      data: {
        userId: session.user.id,
        amount: body.amount,
        // ...
      },
    });

    // Log response
    apiLog.logResponse(201, {
      success: true,
      transactionId: result.id,
      amount: result.amount,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    apiLog.logResponse(500, null, error);
    
    logger.error('Payment creation failed', {
      userId: session?.user?.id,
      context: { amount: body?.amount },
      error,
    });

    return NextResponse.json(
      { error: 'Payment failed' },
      { status: 500 }
    );
  }
}
```

### 2. **Frontend API Call Logging (Automatic)**

Wrap your app with the logging hook to automatically track all fetch calls:

```typescript
// In your root layout or app component (src/app/layout.tsx)
'use client';

import { useApiLogger } from '@/lib/tracking-hooks';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auto-logs all fetch calls in browser console
  useApiLogger();

  return (
    <html>
      <body>
        {/* your components */}
        {children}
      </body>
    </html>
  );
}
```

### 3. **Frontend Form Submission Logging**

Track form data before sending:

```typescript
// Example: src/app/auth/signup/page.tsx
'use client';

import { useFormTracker } from '@/lib/tracking-hooks';
import { useState } from 'react';

export default function SignupPage() {
  const trackForm = useFormTracker();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Log form submission
    trackForm('SignupForm', formData);

    // Submit to API
    const res = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    const result = await res.json();
    // ... handle result
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
    </form>
  );
}
```

### 4. **Track Financial Transactions**

Log all payments, transfers, and top-ups:

```typescript
// Example: src/app/payment/page.tsx
'use client';

import { useTransactionTracker } from '@/lib/tracking-hooks';
import { useState } from 'react';

export default function PaymentPage() {
  const trackTxn = useTransactionTracker();
  const [amount, setAmount] = useState(0);

  const handlePayment = async () => {
    const txnId = crypto.randomUUID();

    // Track initiation
    trackTxn('payment', {
      amount,
      currency: 'USD',
      status: 'initiated',
      transactionId: txnId,
    });

    try {
      const res = await fetch('/api/payments/process', {
        method: 'POST',
        body: JSON.stringify({ amount, transactionId: txnId }),
      });

      if (res.ok) {
        // Track completion
        trackTxn('payment', {
          amount,
          currency: 'USD',
          status: 'completed',
          transactionId: txnId,
        });
      } else {
        throw new Error('Payment failed');
      }
    } catch (error) {
      // Track failure
      trackTxn('payment', {
        amount,
        currency: 'USD',
        status: 'failed',
        transactionId: txnId,
        error: error.message,
      });
    }
  };

  return (
    <div>
      <input
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
      />
      <button onClick={handlePayment}>Pay ${amount}</button>
    </div>
  );
}
```

### 5. **Track Authentication Events**

Log login, logout, and password resets:

```typescript
// Example: src/app/auth/login/page.tsx
'use client';

import { useAuthTracker } from '@/lib/tracking-hooks';
import { signIn } from 'next-auth/react';
import { useState } from 'react';

export default function LoginPage() {
  const trackAuth = useAuthTracker();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    trackAuth('login_attempt', { email });

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.ok) {
      trackAuth('login_success', { 
        email,
        authProvider: 'credentials',
      });
    } else {
      trackAuth('login_failed', { 
        email,
        reason: result?.error,
      });
    }
  };

  return (
    <div>
      {/* Login form */}
    </div>
  );
}
```

## 📊 Viewing Logged Data

### **Browser Console (Frontend)**

Open your browser's Developer Tools: `Cmd + Option + I` (macOS)

All logs appear in the **Console** tab with format:
```
[ISO_TIMESTAMP] [LEVEL] [REQUEST_ID] [User: USER_ID] MESSAGE
Context: {...}
```

Example output:
```
[2026-03-28T10:30:45.123Z] [INFO] [1234567890-abc123] [User: user_123] API Request: POST /api/payments
Context: {
  "method": "POST",
  "path": "/api/payments",
  "body": { "amount": 100, "currency": "USD" }
}

[2026-03-28T10:30:45.234Z] [INFO] [1234567890-abc123] [User: user_123] Form submitted: SignupForm
Context: {
  "form": "SignupForm",
  "fields": ["name", "email", "password"]
}

[2026-03-28T10:30:45.890Z] [INFO] [1234567890-abc123] [User: user_123] API Response: POST /api/payments
Context: {
  "statusCode": 201,
  "duration": "756ms",
  "response": { "success": true, "transactionId": "txn_123" }
}
```

### **Terminal (Backend)**

All server-side logs appear in your terminal where you ran `npm run dev`:

```
[2026-03-28T10:30:45.123Z] [INFO] [1234567890-abc123] [User: user_123] API Request: POST /api/payments
Context: {
  "method": "POST",
  "path": "/api/payments",
  "query": "",
  "body": { "amount": 100, "currency": "USD" },
  "ip": "127.0.0.1"
}

[2026-03-28T10:30:45.890Z] [INFO] [1234567890-abc123] [User: user_123] API Response: POST /api/payments
Context: {
  "method": "POST",
  "path": "/api/payments",
  "statusCode": 201,
  "duration": "756ms",
  "response": { "success": true, "transactionId": "txn_123" }
}
```

### **Create a Logs Dashboard (Advanced)**

Filter & search logs in the browser console:

```javascript
// In browser console, filter by user:
// (Paste this into browser console)
console.log('%c📊 User Activity Log', 'font-weight: bold; font-size: 14px;');

// Filter by log level, user, or transaction type
const logs = document.querySelectorAll('[data-log]');
logs.forEach(log => {
  if (log.textContent.includes('User: user_123')) {
    console.log(log.textContent);
  }
});
```

## 🔒 What Gets Logged

### **Logged (For Visibility)**
✅ User IDs with every request
✅ API endpoints, methods, status codes
✅ Request/response payloads (sanitized)
✅ Form field names and values (w/o passwords)
✅ Transaction types, amounts, status
✅ Auth events (login, logout, signup)
✅ Error messages and stack traces
✅ Request durations
✅ Request IDs for tracing

### **NOT Logged (For Security)**
🔐 Passwords, PINs, tokens
🔐 Credit card numbers, CVV
🔐 Full session objects
🔐 API keys, secrets

## 📝 Log Levels

- **debug** — Detailed state changes (dev mode only)
- **info** — API calls, form submissions, auth events
- **warn** — Validation failures, retries
- **error** — Failed operations, exceptions

## 🚀 Next Steps

1. **Update API routes** — Add `logApiRequest()` to 2-3 critical routes first (payments, transfers, auth)
2. **Add to components** — Use `useFormTracker()` in PaymentForm and SignupForm components
3. **Monitor production** — Export logs to a service (LogRocket, Sentry, DataDog for error tracking)
4. **Set up alerts** — Alert on error patterns (failed payments, auth failures)

## 🐛 Debug Example: Find Missing Payment

**User reports payment didn't process. Here's how to find what happened:**

1. Open **Browser Console** → Filter for `payment`
2. Look for this flow:
   ```
   [INFO] Form submitted: PaymentForm
   [INFO] API Request: POST /api/payments
   [INFO] API Response: POST /api/payments (200 or 500?)
   [INFO] Transaction: payment (status: completed or failed?)
   ```
3. Find the `requestId` → Search backend logs with same ID
4. Correlate timing across frontend/backend
5. Found it! 🎉
