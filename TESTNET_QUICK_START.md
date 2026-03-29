# 🚀 Testnet Setup - Quick Start

Your PayHub is now configured for real blockchain transactions on Sepolia testnet!

## Get Started in 5 Minutes

### 1. Open Your App
```
http://localhost:3000
```

### 2. Look for "Testnet Setup" Button
Bottom-right corner (purple button) — click it

### 3. Generate Test Wallet
- Click "Generate Test Wallet"
- Copy the privateKey shown
- Save it safely (never share!)

### 4. Get Free Testnet ETH
- Click "Get Sepolia ETH"
- Paste your address to faucet
- Wait 30 seconds for funds

### 5. Add Private Key to .env
```bash
# .env
ETHEREUM_PRIVATE_KEY="0x1234567890abcdef..."  # Your generated key
INFURA_API_KEY="your_infura_key"  # Get free from infura.io
```

### 6. Restart Dev Server
```bash
npm run dev
```

### 7. Sign Up & Test!
- Create account → Crypto page
- Buy crypto with test balance
- Send to another address
- Watch transactions confirm on Etherscan

## Useful Links

| What | Link |
|------|------|
| **Get Sepolia ETH** | https://sepoliafaucet.com |
| **Get Infura Key** | https://infura.io (free tier) |
| **View Transactions** | https://sepolia.etherscan.io |
| **Bitcoin Testnet** | https://blockstream.info/testnet |
| **Full Setup Guide** | /TESTNET_SETUP_GUIDE.md |

## What You Can Do Now

✅ **Buy Crypto** - Convert test balance to BTC/ETH/USDT
✅ **Sell Crypto** - Convert back to fiat balance
✅ **Send Crypto** - Transfer to other addresses
✅ **Monitor Transactions** - Watch confirmations in real-time
✅ **Track Fees** - See actual network fee costs
✅ **Test Deposits** - Use Paystack test card (4111 1111 1111 1111)

## Test Card for Deposits

```
Card: 4111 1111 1111 1111
CVC: 123 (any)
Date: Any future date
```

## Important Notes

⚠️ **Testnet Money is FREE & NOT REAL**
- You can request unlimited test ETH
- Transactions are real but no money involved
- Perfect for testing!

⚠️ **NEVER Use Real Money Here**
- Only use testnet private keys
- To go live: change `BLOCKCHAIN_TESTNET=false` + use mainnet keys

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No funds after deposit | Wait 30 sec, reload page |
| RPC connection error | Check INFURA_API_KEY is correct |
| Private key invalid | Regenerate new key: click "Generate Test Wallet" |
| Transactions stuck | Check Etherscan (might need more gas) |

## Next Steps

1. ✅ Open app → Click Testnet Setup
2. ✅ Generate wallet + add to .env
3. ✅ Request Sepolia ETH
4. ✅ Create test account
5. ✅ Try buying/sending crypto
6. ✅ Watch transactions on Etherscan
7. Ready to deploy to mainnet? Change ENV vars

---

**Questions?** Check `TESTNET_SETUP_GUIDE.md` or look at `WITHDRAWAL_GUIDE.md` for payment flows.
