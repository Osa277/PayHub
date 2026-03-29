# Testnet Wallet Setup Guide for PayHub

This guide helps you set up test wallets on Sepolia (Ethereum testnet) and Bitcoin testnet to try real crypto transactions safely.

## Why Testnet?

- **No real money**: Test transactions are free
- **Full blockchain**: Real transaction confirmations and network fees
- **Identical to mainnet**: Same code runs on both
- **Safe experimentation**: Perfect for development

## Step 1: Get Sepolia ETH (Ethereum Testnet)

### Option A: Using Sepolia Faucet
1. Go to https://sepoliafaucet.com
2. Enter any Ethereum address (or generate one below)
3. Click "Send Me ETH"
4. Wait ~30 seconds for funds (shows in wallet)

### Option B: Using Alchemy Faucet
1. Go to https://www.alchemy.com/faucets/ethereum
2. Connect with your wallet or enter address
3. Request testnet ETH

## Step 2: Generate a Test Wallet

### Using MetaMask (Easiest)
1. Install MetaMask browser extension
2. Click extension icon → Create new wallet
3. Save your seed phrase securely
4. Switch network to "Sepolia" (top right dropdown)
5. Copy your public address and private key

### Using Command Line
```bash
# Generate random private key (Node.js)
node -e "console.log('0x' + require('crypto').randomBytes(32).toString('hex'))"

# Example output:
# 0x1234567890abcdef...
```

## Step 3: Add to PayHub Environment

Edit `.env`:
```bash
# Testnet Configuration
BLOCKCHAIN_TESTNET=true
BLOCKCHAIN_NETWORK=ethereum

# Sepolia RPC (free from Infura)
ETHEREUM_RPC_URL="https://sepolia.infura.io/v3/YOUR_INFURA_KEY"
INFURA_API_KEY="YOUR_INFURA_KEY"

# Your test wallet private key (Sepolia only!)
ETHEREUM_PRIVATE_KEY="0x1234567890abcdef..."

# For Bitcoin testnet
BITCOIN_TESTNET_RPC="https://bitcoin-testnet.quiknode.pro/YOUR_KEY"
```

## Step 4: Get Free Infura API Key

1. Go to https://infura.io
2. Sign up (free)
3. Create new project
4. Select "Web3 API"
5. Copy your Project ID → use as `INFURA_API_KEY` and in `ETHEREUM_RPC_URL`

## Step 5: Verify Setup

```bash
# Check environment variables loaded
npm run dev

# Open app at http://localhost:3000
# Sign up with test account
# Go to Crypto page
# Try Buy → Sell → Send → Receive
```

## What You Can Do on Testnet

✅ Buy crypto with testnet ETH balance
✅ Sell crypto back to balance
✅ Send ETH to other addresses
✅ Send USDT (Sepolia testnet USDT)
✅ Receive crypto at generated addresses
✅ Monitor transaction confirmations
✅ View real network fees

## Test Account Setup

### Quick Test Flow
1. **Deposit**: Use Paystack with test card
   - Card: `4111 1111 1111 1111`
   - CVC: `123`
   - Date: Any future date
2. **Buy Crypto**: Convert NGN to BTC/ETH/USDT
3. **Send**: Transfer to another address
4. **Monitor**: Watch confirmations on blockchain

## View Transactions

### Sepolia Etherscan
https://sepolia.etherscan.io
- Search your address
- View all transactions
- Monitor confirmations

### Bitcoin Testnet Explorer
https://blockstream.info/testnet
- Search Bitcoin address
- Track BTC testnet transactions

## Troubleshooting

### "No funds" error
→ Request from faucet again (can take 1-2 minutes)

### "Invalid RPC response"
→ Check `INFURA_API_KEY` is correct
→ Verify `ETHEREUM_RPC_URL` includes your key

### Transaction stuck
→ Check Etherscan: might still be pending
→ Testnet blocks every ~12 seconds

## Safety Notes

⚠️ **NEVER** use mainnet private keys here
⚠️ **NEVER** share your private key
⚠️ **ONLY** use testnet addresses (start with 0x or sepolia addresses)
⚠️ Delete `.env` from Git if real keys added

## Next: Deploy to Mainnet

When ready for real transactions:
1. Get mainnet ETH
2. Change private key to real wallet
3. Set `BLOCKCHAIN_TESTNET=false`
4. Deploy to production
