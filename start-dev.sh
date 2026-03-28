#!/bin/bash

# PayHub Development Server Startup Script
# This script checks for Node.js and starts the development server

echo "🚀 PayHub - Starting Development Server"
echo "======================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed on your system."
    echo ""
    echo "Please install Node.js first:"
    echo ""
    echo "Option 1: Using Homebrew (macOS)"
    echo "  /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
    echo "  brew install node"
    echo ""
    echo "Option 2: Direct Download"
    echo "  Visit: https://nodejs.org/ (download LTS version)"
    echo ""
    echo "After installation, run this script again."
    exit 1
fi

NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)

echo "✅ Node.js found: $NODE_VERSION"
echo "✅ npm found: $NPM_VERSION"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    
    if [ $? -eq 0 ]; then
        echo "✅ Dependencies installed successfully!"
    else
        echo "❌ Failed to install dependencies"
        exit 1
    fi
else
    echo "✅ Dependencies already installed"
fi

echo ""
echo "🎯 Starting development server..."
echo "   URL: http://localhost:3000"
echo "   Press Ctrl+C to stop"
echo ""

npm run dev
