@echo off
REM PayHub Application Setup Script for Windows

echo.
echo 🚀 PayHub Setup Script
echo =====================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed.
    echo.
    echo Please install Node.js first:
    echo   Visit: https://nodejs.org/
    echo.
    echo After installing Node.js, run this script again.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i

echo ✅ Node.js is installed: %NODE_VERSION%
echo ✅ npm is installed: %NPM_VERSION%
echo.

REM Check if we're in the right directory
if not exist package.json (
    echo ❌ package.json not found in current directory
    echo Please run this script from the PayHub project root directory
    pause
    exit /b 1
)

echo 📦 Installing dependencies...
call npm install

if not exist .env.local (
    echo.
    echo ⚠️  .env.local file not found
    echo Creating .env.local from .env.example...
    copy .env.example .env.local
    echo ✅ .env.local created
    echo.
    echo ⚠️  Important: Edit .env.local and add your API keys
)

echo.
echo ✅ Setup complete!
echo.
echo 🎯 Next steps:
echo    1. Edit .env.local with your API keys
echo    2. Run: npm run dev
echo    3. Visit: http://localhost:3000
echo.
pause
