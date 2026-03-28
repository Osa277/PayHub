#!/bin/bash

# PayHub Application Setup Script
# This script automates the setup process for the PayHub payment application

set -e

echo "🚀 PayHub Setup Script"
echo "====================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed."
    echo ""
    echo "Please install Node.js first:"
    echo "  macOS: brew install node"
    echo "  OR visit: https://nodejs.org/"
    echo ""
    echo "After installing Node.js, run this script again."
    exit 1
fi

NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)

echo "✅ Node.js is installed: $NODE_VERSION"
echo "✅ npm is installed: $NPM_VERSION"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found in current directory"
    echo "Please run this script from the PayHub project root directory:"
    echo "  cd '/Users/apple/untitled folder'"
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

if [ ! -f ".env.local" ]; then
    echo ""
    echo "⚠️  .env.local file not found"
    echo "Creating .env.local from .env.example..."
    cp .env.example .env.local
    echo "✅ .env.local created"
    echo ""
    echo "⚠️  Important: Edit .env.local and add your API keys:"
    echo "   - Stripe keys from https://dashboard.stripe.com/apikeys"
    echo "   - PayPal keys from https://developer.paypal.com/"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "🎯 Next steps:"
echo "   1. Edit .env.local with your API keys"
echo "   2. Run: npm run dev"
echo "   3. Visit: http://localhost:3000"
echo ""
echo "📚 Documentation:"
echo "   - QUICKSTART.md - Quick start guide"
echo "   - README.md - Full documentation"
echo "   - INSTALLATION.md - Installation guide"
echo ""
