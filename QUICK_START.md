# ⚡ Quick Start - Real-Time Testing & Deployment

## 🎯 Your Action Items (In Order)

### Phase 1: Real-Time Testing (Today - ~30 mins)
These steps test your app with LIVE Paystack keys to ensure everything works before deploying.

**✅ Task 1: Open Account & Complete Profile**
- [ ] Go to http://localhost:3000
- [ ] Click "Create Free Account"
- [ ] Fill signup form (name, email, phone, password with uppercase/lowercase/number/special char)
- [ ] Complete profile
- [ ] ✅ You now have a wallet with $0 balance

**✅ Task 2: Make Real Deposit with Paystack**
- [ ] Go to Wallet page
- [ ] Click "Top Up Wallet"
- [ ] Enter amount: **₦100** (NGN)
- [ ] Click "Get Started"
- [ ] Use test card: **4084029725868** (expiry: any future date, CVC: any 3 digits)
- [ ] Complete payment in Paystack checkout
- [ ] ✅ Verify wallet updated to ₦100
- [ ] ✅ Check email for confirmation

**✅ Task 3: Test Transfer Between Accounts**
- [ ] Create **2nd account** (repeat Task 1)
- [ ] Back to **1st account**
- [ ] Go to Wallet → "Transfer Money"
- [ ] Recipient email: 2nd account email
- [ ] Amount: ₦50
- [ ] Send transfer
- [ ] ✅ 1st account balance: ~₦49 (after fee)
- [ ] ✅ 2nd account balance: ₦50
- [ ] ✅ Both get email notifications

**✅ Task 4: Test Crypto Payment**
- [ ] 1st account → Payment page
- [ ] Recipient: any email
- [ ] Amount: **$1**
- [ ] Currency: USD
- [ ] Crypto: BTC
- [ ] Send payment
- [ ] ✅ See "Payment Confirmed"

**✅ Task 5: Verify Dashboard**
- [ ] Go to Dashboard
- [ ] Verify metrics show:
  - Total balance
  - Transactions listed
  - Correct amounts

---

### Phase 2: Vercel Environment Setup (~10 mins)

**✅ Task 6: Prepare Vercel Account**
- [ ] Go to https://vercel.com
- [ ] Create free account (if needed)
- [ ] Connect GitHub account

**✅ Task 7: Update Google OAuth**
- [ ] Go to Google Cloud Console
- [ ] Find your OAuth 2.0 Client
- [ ] Add redirect URI: `https://your-app.vercel.app/api/auth/callback/google`
  - (Replace `your-app` with your actual domain once you deploy)

**✅ Task 8: Configure Paystack Webhook**
- [ ] Go to https://dashboard.paystack.com
- [ ] Settings → API Keys & Webhooks
- [ ] Add Webhook URL: `https://your-app.vercel.app/api/webhooks/paystack`
- [ ] Select: charge.success, charge.failed
- [ ] Save

**✅ Task 9: Configure NOWPayments IPN**
- [ ] Go to https://nowpayments.io dashboard
- [ ] Settings → IPN Callbacks
- [ ] Add: `https://your-app.vercel.app/api/webhooks/nowpayments`
- [ ] Save

---

### Phase 3: Deploy to GitHub & Vercel (~5 mins)

**✅ Task 10: Commit & Push to GitHub**
```bash
cd "/Users/apple/untitled folder"
git add .
git commit -m "Production deployment: PayHub payment app ready for Vercel"
git push origin main
```

**✅ Task 11: Deploy to Vercel**
1. Go to Vercel Dashboard
2. Click "Add New Project"
3. Select your GitHub repo
4. Click "Deploy"
5. Wait 2-3 minutes for build

**✅ Task 12: Add Environment Variables in Vercel**

In Vercel dashboard, go to **Settings** → **Environment Variables** and add:

| Name | Value |
|------|-------|
| `DATABASE_URL` | From your `.env` |
| `NEXTAUTH_URL` | `https://your-vercel-domain.vercel.app` |
| `NEXTAUTH_SECRET` | From your `.env` |
| `GOOGLE_CLIENT_ID` | From your `.env` |
| `GOOGLE_CLIENT_SECRET` | From your `.env` |
| `PAYSTACK_SECRET_KEY` | From your `.env` |
| `PAYSTACK_PUBLIC_KEY` | From your `.env` |
| `NOWPAYMENTS_API_KEY` | From your `.env` |
| `NOWPAYMENTS_IPN_SECRET` | From your `.env` |
| `RESEND_API_KEY` | From your `.env` |

**⚠️ Important:** After adding variables, **redeploy** in Vercel (Deployments → Click latest → Redeploy)

---

### Phase 4: Production Testing (~10 mins)

**✅ Task 13: Test Production App**
- [ ] Open your Vercel URL (e.g., https://payhub.vercel.app)
- [ ] Create test account
- [ ] Test deposit with Paystack
- [ ] Verify webhook triggered (check Paystack dashboard)
- [ ] Test transfer
- [ ] Check emails received
- [ ] Verify all transactions in Dashboard

---

## 📊 Timeline

| Phase | Task | Time |
|-------|------|------|
| 1 | Real-time testing (5 tasks) | 30 mins |
| 2 | Vercel setup (4 tasks) | 10 mins |
| 3 | GitHub + Vercel deploy (3 tasks) | 5 mins |
| 4 | Production testing (1 task) | 10 mins |
| **TOTAL** | | **~55 mins** |

---

## 🚨 Important Reminders

1. **Live Keys:** Your app uses PAYSTACK LIVE keys - real transactions will go through
   - Test with small amounts (₦100-₦500)
   - Keep receipts for records

2. **Never Commit .env:**
   - `.env` is already in `.gitignore` ✅
   - Only `.env.example` is in git ✅

3. **Update Webhook URLs:**
   - Replace `localhost:3000` with your Vercel domain
   - After deployment, update in Paystack, NOWPayments, and Google Cloud

4. **After Each Variable Change:**
   - Redeploy in Vercel for changes to take effect

---

## 📋 Pre-Deployment Verification

Before starting, verify:

```bash
# Check .env file exists and has all keys
cat .env | grep -E "DATABASE_URL|PAYSTACK|GOOGLE|RESEND"

# Verify build works
npm run build

# Check dev server works
npm run dev  # Should open on http://localhost:3000
```

---

## 🎯 Next Steps

1. **Now:** Complete Phase 1 testing (test with real money flow)
2. **After testing:** Complete all Tasks 6-12 (setup & deploy)
3. **After production deploy:** Share your live URL with beta testers
4. **Monitor:** Check Vercel logs for errors, Paystack dashboard for transactions

---

## 📞 Quick Reference

| Resource | URL |
|----------|-----|
| **App (Local)** | http://localhost:3000 |
| **App (Production)** | https://your-domain.vercel.app |
| **Vercel Dashboard** | https://vercel.com/dashboard |
| **Paystack Dashboard** | https://dashboard.paystack.com |
| **Google Cloud** | https://console.cloud.google.com |
| **NOWPayments** | https://nowpayments.io |
| **Neon Database** | https://console.neon.tech |

---

**Status:** ✅ Ready for Testing & Deployment
**Created:** 2026-03-29
**Your PayHub App:** Production Ready 🚀
