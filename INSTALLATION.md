# PayHub Installation Guide

## Prerequisites: Node.js Installation

Your system currently does not have Node.js installed, which is required to run the PayHub payment application.

### Option 1: Install via Homebrew (Recommended for macOS)

1. First, install Homebrew if you don't have it:
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. Then install Node.js:
   ```bash
   brew install node
   ```

3. Verify installation:
   ```bash
   node --version
   npm --version
   ```

### Option 2: Direct Download from NodeJS.org

1. Visit https://nodejs.org/
2. Download the LTS (Long Term Support) version
3. Run the installer and follow the setup wizard
4. Verify installation by opening a new terminal and running:
   ```bash
   node --version
   npm --version
   ```

### Option 3: Using NVM (Node Version Manager)

1. Install NVM:
   ```bash
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   ```

2. Load NVM:
   ```bash
   source ~/.nvm/nvm.sh
   ```

3. Install Node.js:
   ```bash
   nvm install node
   ```

4. Verify:
   ```bash
   node --version
   ```

## After Installing Node.js

Once Node.js and npm are installed, run these commands in the project directory:

```bash
# Navigate to project
cd "/Users/apple/untitled folder"

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at: **http://localhost:3000**

## Troubleshooting

### "npm: command not found" after installation
- Close and reopen your terminal
- Restart your computer
- Check your PATH environment variable

### Port 3000 already in use
```bash
npm run dev -- -p 3001
```

### Permission errors
```bash
sudo npm install -g npm
```

## System Requirements

- **Node.js:** v18.17 or higher
- **npm:** v9.0 or higher
- **RAM:** 2GB minimum
- **Disk Space:** 500MB for node_modules

## Next Steps

1. Install Node.js using one of the methods above
2. Run `npm install` to install project dependencies
3. Add your payment provider API keys to `.env.local`
4. Run `npm run dev` to start the development server
5. Open http://localhost:3000 in your browser

For detailed project setup, see `QUICKSTART.md`.
