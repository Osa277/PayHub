# PayHub - Real-Time Testing Guide

## 🧪 Pre-Deployment Testing Checklist

This guide walks you through testing the complete payment flow in real-time before deploying to Vercel.

---

## 📱 Step 1: Create Account & Complete Profile

1. **Open the app:** http://localhost:3000
2. **Click "Create Free Account"**
3. **Fill in the signup form:**
   - Name: Your test name
   - Email: Your real email (for test notifications)
   - Phone: Your valid phone number
   - Password: Must contain uppercase, lowercase, number, and special character
4. **Click Sign Up** → You'll be redirected to complete profile
5. **Complete Profile:**
   - Add country, bio, etc.
   - Click "Continue"
6. ✅ **Your wallet is auto-created with $0 balance**

---

## 💰 Step 2: Deposit via Paystack (Real Money)

### Test with Live Paystack Keys

Your app is using **LIVE Paystack keys** (`sk_live_...`), which means:
- ✅ Real transactions will be processed
- ✅ Money will actually transfer
- ⚠️ Use test cards carefully

### Paystack Test Cards (for development):

| Card Number | Expiry | CVC | Name |
|-----------|--------|-----|------|
| 4084029725868 | Any future date | Any 3 digits | Any name |
| 5291896876289 | Any future date | Any 3 digits | Any name |

**Using live keys means these might charge real fees. Test with small amounts (₦100-₦500).**

### Deposit Flow:

1. **Login** to your account
2. **Go to Dashboard** or **Wallet** page
3. **Click "Top Up Wallet"**
4. **Enter amount:** ₦100 (minimum recommended for testing)
5. **Click "Get Started"**
6. **Paystack checkout opens:**
   - Enter card details (see test cards above)
   - Complete payment
7. **You'll be redirected back** after payment
8. ✅ **Check wallet balance** — it should increase by ₦100
9. ✅ **Check email** — you should receive a notification

---

## 🔄 Step 3: Test Wallet Transfer

### Transfer to Another User

1. **Create a second account** (same process as Step 1)
2. **Go back to first account**
3. **Go to Wallet → Transfer Money**
4. **Fill in transfer details:**
   - Recipient email: second account email
   - Amount: ₦50
   - Description: "Test transfer"
5. **Click "Send"**
6. ✅ **First account balance:** ₦100 - ₦50 - fee = ~₦49
7. ✅ **Second account balance:** ₦50 (received)
8. ✅ **Both get email notifications**

---

## 💳 Step 4: Test Crypto Payment (NOWPayments)

1. **Go to Payment page**
2. **Fill in payment details:**
   - Recipient email: Any email
   - Amount: $1 USD
   - Currency: USD
   - Crypto: BTC or ETH
3. **Click "Send Payment"**
4. **You'll see payment session created**
5. **Confirm payment** (simulated)
6. ✅ **Check your transaction history**
7. ✅ **Check wallet balance decreased**

**Note:** NOWPayments webhooks will confirm payment status in real-time.

---

## 📊 Step 5: Verify Dashboard Analytics

1. **Go to Dashboard**
2. **Check the following metrics:**
   - Total balance
   - Total sent
   - Total received
   - Transaction count
   - Recent transactions list

---

## 📧 Step 6: Test Email Notifications

You should receive emails for:
- ✅ Account creation (Welcome email)
- ✅ Wallet top-up confirmed
- ✅ Payment sent
- ✅ Payment received
- ✅ Transfer sent
- ✅ Transfer received

**Check your email inbox** (or spam folder) for these notifications.

---

## 🔧 Step 7: Test Webhook Endpoints

### Manual webhook testing (using curl):

```bash
# Test Paystack webhook
curl -X POST http://localhost:3000/api/webhooks/paystack \
  -H "x-paystack-signature: test-signature" \
  -H "Content-Type: application/json" \
  -d '{"event":"charge.success","data":{"reference":"test_ref","amount":10000}}'

# Test NOWPayments webhook
curl -X POST http://localhost:3000/api/webhooks/nowpayments \
  -H "x-nowpayments-sig: test-signature" \
  -H "Content-Type: application/json" \
  -d '{"payment_id":"123","payment_status":"finished","order_id":"order_123"}'
```

---

## ⚠️ Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| "Paystack not configured" | Check `.env` has `PAYSTACK_SECRET_KEY` with `sk_live_...` |
| Wallet transfer fails | Ensure recipient email exists and has a wallet |
| Email not received | Check spam folder, verify `RESEND_API_KEY` in `.env` |
| Webhook not triggering | Ensure Paystack dashboard has correct webhook URL |
| Google OAuth error | Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` |

---

## ✅ Testing Checklist

- [ ] Create new account
- [ ] Complete profile
- [ ] Deposit via Paystack (₦100+)
- [ ] Verify wallet balance updated
- [ ] Receive confirmation email
- [ ] Create second account
- [ ] Transfer money between accounts
- [ ] Verify both accounts updated
- [ ] Receive transfer notifications
- [ ] Test crypto payment flow
- [ ] Verify dashboard metrics
- [ ] All emails received

---

## 🚀 Ready for Deployment

Once all tests pass, you're ready to:
1. Commit code to GitHub
2. Deploy to Vercel
3. Configure production webhooks

**See DEPLOYMENT.md for next steps.**
