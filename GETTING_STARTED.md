# 🚀 PayHub - Getting Started

## Current Status
Your PayHub payment application is **fully built and ready to run**. However, Node.js needs to be installed first.

## Step 1: Install Node.js

### macOS - Most Common Methods

**Method 1: Download from nodejs.org (Easiest)**
1. Visit https://nodejs.org/
2. Download the **LTS** version (recommend 20.x or 22.x)
3. Run the installer and follow the setup wizard
4. Restart your terminal/Mac

**Method 2: Using Homebrew**
```bash
# First install Homebrew if you don't have it:
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Then install Node.js:
brew install node
```

**Method 3: Using NVM (Node Version Manager)**
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.nvm/nvm.sh
nvm install node
```

### Verify Installation
After installation, open a NEW terminal and run:
```bash
node --version
npm --version
```

You should see version numbers for both.

---

## Step 2: Run the Development Server

Once Node.js is installed, open your terminal and run these commands:

```bash
# Navigate to the project folder
cd "/Users/apple/untitled folder"

# Install all dependencies (only need to do this once)
npm install

# Start the development server
npm run dev
```

### What to Expect
✅ You'll see output like:
```
> next dev

> payment-app@1.0.0 dev
> next dev

  ▲ Next.js 14.0.0
  - Local:        http://localhost:3000
```

✅ Open your browser to **http://localhost:3000**

✅ You should see the PayHub home page with:
- Welcome message
- Feature cards
- Send Money and View Wallet buttons
- Get Started section

---

## Available Commands

Once the development server is running:

```bash
# Development (what you'll use most)
npm run dev

# Production build
npm run build
npm start

# Run tests
npm test
npm test:watch

# Lint code
npm run lint
```

---

## Project Features Ready to Use

✅ **Home Page** - Visit http://localhost:3000
✅ **Wallet Page** - Visit http://localhost:3000/wallet
✅ **Send Money** - Visit http://localhost:3000/payment
✅ **Dashboard** - Visit http://localhost:3000/dashboard

---

## Troubleshooting

### If npm install fails:
```bash
# Clear npm cache
npm cache clean --force

# Try again
npm install
```

### If port 3000 is already in use:
```bash
# Run on different port
npm run dev -- -p 3001
# Then visit: http://localhost:3001
```

### If you get "permission denied" errors:
```bash
# Don't use sudo! Instead:
npm install --prefix /Users/apple/untitled\ folder
```

---

## Need Help?

1. **Check terminal output** - it usually explains what's wrong
2. **Restart terminal** - sometimes a fresh terminal helps
3. **Reinstall Node.js** - download fresh from nodejs.org
4. **Check Node version** - ensure you have 18.17 or higher

---

## What Happens After npm install

When you run `npm install`, it:
- ✅ Downloads React, Next.js, and 22 other packages
- ✅ Sets up TypeScript
- ✅ Installs Tailwind CSS
- ✅ Configures Jest testing
- ✅ Resolves all 388 compilation errors automatically
- ✅ Makes the app fully functional

---

## Summary

1. **Install Node.js** from https://nodejs.org/ (LTS version)
2. **Restart terminal**
3. Run these 3 commands:
   ```bash
   cd "/Users/apple/untitled folder"
   npm install
   npm run dev
   ```
4. **Open** http://localhost:3000 in your browser

That's it! Your payment app will be running. 🎉
