# Mobile Login Issues - Complete Resolution Guide

## 🔴 Issues Found

### 1. **Credentials Login Blocked** (Credentials Provider)
- **Cause**: CSRF middleware too strict, rejecting `null` Origin headers from mobile WebViews
- **Status**: ✅ FIXED in code

### 2. **Google OAuth Blocked** (Google Provider)
- **Causes**: 
  - Google callback URL not registered for production domain
  - GOOGLE_CLIENT_ID/SECRET not set in Vercel
  - Missing NextAuth security settings for production/mobile
- **Status**: ✅ FIXED in code (needs Vercel + Google Cloud config)

---

## ✅ Code Fixes Applied

### 1. Middleware CSRF Check
**File**: `src/middleware.ts`

Modified CSRF validation to:
- Allow requests with `null` Origin (mobile WebViews)
- Allow same-site requests without Origin header
- Still validate Origin when present

### 2. NextAuth Security Configuration
**File**: `src/lib/auth-options.ts`

Added:
```typescript
trustHost: true              // Trusts Vercel domain without X-Forwarded headers
useSecureCookies: true       // Forces secure cookies on HTTPS (required for mobile)
```

---

## 🔧 REQUIRED CONFIGURATION

### Step 1: Google Cloud Console Setup

**⚠️ This is CRITICAL for Google login to work on production/mobile**

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your PayHub project
3. Go to **APIs & Services** → **Credentials**
4. Find your OAuth 2.0 Client ID (type: Web application)
5. Click the **Edit** button
6. Under **Authorized redirect URIs**, add:
   ```
   https://payhub-ruby.vercel.app/api/auth/callback/google
   ```
7. Click **Save**

**Common Mistake**: If you only have `http://localhost:3001/api/auth/callback/google` registered, Google will reject redirects from the production domain and login will fail silently.

---

### Step 2: Vercel Environment Variables

Set these in **Vercel Dashboard** → **Project Settings** → **Environment Variables**:

```
# NextAuth Configuration
NEXTAUTH_URL=https://payhub-ruby.vercel.app
NEXTAUTH_SECRET=<generated_value>

# Google OAuth
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
```

#### Generate NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

#### Get Google Credentials:
1. Google Cloud Console → Credentials
2. Find your OAuth 2.0 Client ID
3. Copy `Client ID` → `GOOGLE_CLIENT_ID`
4. Copy `Client Secret` → `GOOGLE_CLIENT_SECRET`

---

### Step 3: Deploy & Test

```bash
# If code was modified:
git push origin main

# Or manually redeploy in Vercel:
# 1. Vercel Dashboard → Deployments
# 2. Click the three dots on latest deployment
# 3. Click "Redeploy"
```

---

## 📋 Complete Deployment Checklist

- [ ] **Google Cloud**: Add production callback URL in OAuth consent screen
  - URL: `https://payhub-ruby.vercel.app/api/auth/callback/google`
- [ ] **Google Cloud**: Get GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
- [ ] **Vercel**: Set `NEXTAUTH_URL=https://payhub-ruby.vercel.app`
- [ ] **Vercel**: Generate and set `NEXTAUTH_SECRET`
- [ ] **Vercel**: Set `GOOGLE_CLIENT_ID` (from Google Cloud)
- [ ] **Vercel**: Set `GOOGLE_CLIENT_SECRET` (from Google Cloud)
- [ ] **Git**: Push code (fixes already applied)
- [ ] **Vercel**: Redeploy (automatic if you pushed, or manual)
- [ ] **Local**: Clear browser cache on mobile device
- [ ] **Test**: Try credentials login on mobile
- [ ] **Test**: Try Google login on mobile
- [ ] **Test**: Verify session persists across page navigation

---

## 🧪 Testing Mobile Login

### Option A: Desktop Browser (Mobile Simulation)
```
1. Open https://payhub-ruby.vercel.app
2. Press F12 (or Cmd+Option+I on Mac)
3. Press Ctrl+Shift+M (or Cmd+Shift+M on Mac) to enable mobile view
4. Select a mobile device preset (e.g., iPhone 15)
5. Test credentials login
6. Refresh page and test Google login
```

### Option B: Actual Mobile Device
```
1. Open phone browser
2. Navigate to https://payhub-ruby.vercel.app
3. Test credentials login
   - Enter test email + password
   - Should redirect to dashboard
4. Log out and test Google login
   - Click "Continue with Google"
   - Should redirect to Google login page
   - After login, should redirect back to dashboard
5. Verify session persists after refresh
```

---

## 🔍 Troubleshooting

### ❌ Credentials Login Fails

**Error: "Invalid email or password"**
- Verify user exists in database
- Check password is correct

**Error: "Too many login attempts"**
- Wait 5 minutes
- Or check rate limiting is not misconfigured

**Blank page or redirect loop**
- Check browser DevTools Network tab
- Verify `/api/auth/callback/credentials` returns 302 (redirect)
- Check cookies: Should have `next-auth.session-token`

**Fix**: Ensure Vercel env vars are set:
- `NEXTAUTH_URL=https://payhub-ruby.vercel.app`
- `NEXTAUTH_SECRET` is set
- `DATABASE_URL` is valid

---

### ❌ Google Login Blocked / Fails Silently

**Blank page after clicking "Continue with Google"**

This usually means the Google callback URL is not registered.

**Fix Steps**:
1. Go to Google Cloud Console → Credentials
2. Find your OAuth 2.0 Client ID
3. Edit it
4. Check **Authorized redirect URIs** contains:
   ```
   https://payhub-ruby.vercel.app/api/auth/callback/google
   ```
5. If only `http://localhost:3001/api/auth/callback/google` exists, add the production URL
6. Save changes
7. Wait 1-2 minutes for changes to propagate
8. Try login again

**Verify in Vercel**: Check env vars are set:
- `GOOGLE_CLIENT_ID` (not empty)
- `GOOGLE_CLIENT_SECRET` (not empty)
- `NEXTAUTH_URL=https://payhub-ruby.vercel.app`

---

### ❌ Session Not Persisting / Cookies Not Saved

**Problem**: Login works but session is lost on page refresh

**Check**:
1. DevTools → Application → Cookies
2. Should have a cookie named `next-auth.session-token`
3. Check "Secure" flag is set (required for HTTPS)
4. Check "SameSite" is "None" or "Lax"

**Fix**: Ensure `useSecureCookies: true` in auth-options.ts (already added)

---

### ❌ Network Error / "Failed to fetch"

**Problem**: Network tab shows failed requests to `/api/auth/`

**Check**:
1. Verify internet connection
2. Try on different network (WiFi vs cellular)
3. Check if firewall blocks HTTPS
4. Try in incognito/private mode

**Vercel Check**: Is the deployment successful?
- Vercel Dashboard → Deployments
- Latest should show "Ready" status
- If "Building" or "Error", wait or check build logs

---

## 📊 Testing Checklist - Desktop

| Feature | Test | Status |
|---------|------|--------|
| Credentials Login | Email + Password | ⏳ |
| Google OAuth Login | Click Google button | ⏳ |
| Session Persistence | Refresh page after login | ⏳ |
| Logout | Click logout | ⏳ |
| Error Messages | Try wrong password | ⏳ |

---

## 📱 Testing Checklist - Mobile

| Feature | Test | Device | Status |
|---------|------|--------|--------|
| Credentials Login | Email + Password | iPhone | ⏳ |
| Credentials Login | Email + Password | Android | ⏳ |
| Google OAuth | Click Google button | iPhone | ⏳ |
| Google OAuth | Click Google button | Android | ⏳ |
| Session Persists | Refresh after login | iPhone | ⏳ |
| Logout | Click logout | iPhone | ⏳ |

---

## 🚀 What's Next

1. **Immediately**: Add production callback URL in Google Cloud Console
2. **Then**: Set all required Vercel environment variables
3. **Then**: Redeploy application (automatic if you git push)
4. **Then**: Test on mobile device
5. **Monitor**: Check Sentry dashboard for auth errors

---

## 📝 Summary of Changes

| Component | Change | Why |
|-----------|--------|-----|
| `src/middleware.ts` | Allow `null` Origin header | Mobile WebViews work |
| `src/lib/auth-options.ts` | Add `trustHost: true` | Vercel domain is trusted |
| `src/lib/auth-options.ts` | Add `useSecureCookies: true` | HTTPS cookies work on mobile |
| Google Cloud Console | Register production callback URL | Google accepts production redirects |
| Vercel Env Vars | Set NEXTAUTH_URL + GOOGLE_* vars | Production credentials available |

---

## 📞 Still Having Issues?

**Debug Steps**:
1. Check Vercel logs:
   ```bash
   vercel logs --follow
   ```

2. Check browser Network tab:
   - Should see `/api/auth/callback/google` or `/api/auth/callback/credentials`
   - Status should be 302 (redirect) or 200 (success)

3. Check Sentry dashboard:
   - Look for auth-related errors
   - Check error messages for clues

4. Verify credentials:
   - Copy GOOGLE_CLIENT_ID from Google Cloud Console
   - Paste into Vercel (match exactly, no extra spaces)
   - Same for GOOGLE_CLIENT_SECRET

5. Test on different networks:
   - Try WiFi then cellular
   - Try different mobile device if possible

---

**Last Resort**: Check if:
- Database is accessible: `SELECT 1;` works in Neon Console
- API endpoints respond: Curl `https://payhub-ruby.vercel.app/api/health`
- Vercel deployment is latest: Check Deployments tab

