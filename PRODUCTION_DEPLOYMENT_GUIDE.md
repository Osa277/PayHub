# Production Deployment Guide

Going from testnet to real money/crypto? Here's everything you need to know.

## Key Differences: Testnet vs Production

### Environment Variables

#### Testnet (Current Setup)
```bash
BLOCKCHAIN_TESTNET=true
ETHEREUM_RPC_URL="https://sepolia.infura.io/v3/YOUR_KEY"
BLOCKCHAIN_NETWORK="ethereum"
PAYSTACK_SECRET_KEY="sk_test_xxx"  # Test key
ETHEREUM_PRIVATE_KEY="0x123..."  # Testnet wallet
```

#### Production (Real Money)
```bash
BLOCKCHAIN_TESTNET=false
ETHEREUM_RPC_URL="https://mainnet.infura.io/v3/YOUR_KEY"
BLOCKCHAIN_NETWORK="ethereum"
PAYSTACK_SECRET_KEY="sk_live_xxx"  # REAL key
ETHEREUM_PRIVATE_KEY="0xabc..."  # Mainnet wallet with REAL funds
```

## Deployment Checklist

### 1. Blockchain Configuration ✅
- [ ] Switch `BLOCKCHAIN_TESTNET=false`
- [ ] Update `ETHEREUM_RPC_URL` to mainnet
- [ ] Use mainnet Infura/Alchemy key
- [ ] Set real `ETHEREUM_PRIVATE_KEY` (with real ETH)
- [ ] Use mainnet Bitcoin RPC URL
- [ ] Verify USDT contract address (mainnet vs testnet)

### 2. Payment Providers ✅
- [ ] Switch Paystack to LIVE keys (`sk_live_`, `pk_live_`)
- [ ] Switch NOWPayments to production mode
- [ ] Update Paystack webhook URLs
- [ ] Configure NOWPayments webhooks

### 3. Authentication ✅
- [ ] Update Google OAuth callback URL (production domain)
- [ ] Update `NEXTAUTH_URL` to production domain
- [ ] Generate new `NEXTAUTH_SECRET`
- [ ] Configure CORS for production domain

### 4. Database ✅
- [ ] Use production Neon database
- [ ] Backup production database before deploy
- [ ] Test database migrations on staging first
- [ ] Monitor database performance

### 5. Security ✅
- [ ] Never commit `.env` with real keys
- [ ] Use Vercel environment variables
- [ ] Enable HTTPS (automatic on Vercel)
- [ ] Set up rate limiting
- [ ] Enable request logging
- [ ] Audit sensitive API endpoints

### 6. Monitoring ✅
- [ ] Set up error tracking (Sentry)
- [ ] Enable transaction logging
- [ ] Monitor gas prices and fees
- [ ] Set up alerts for failed transactions
- [ ] Track failed payment attempts

## Production Wallet Setup

### Step 1: Create Production Wallet

```bash
# Option A: Use MetaMask
# 1. Create new wallet in MetaMask
# 2. Fund with real ETH
# 3. Export private key

# Option B: Use Ledger/Hardware Wallet
# 1. Generate address
# 2. Transfer real ETH
# 3. Use secure key management
```

### Step 2: Fund Production Wallet

1. Send real ETH to your production address
2. Keep at least 0.5 ETH for gas fees
3. Add more as needed for transactions

### Step 3: Configure in Vercel

```bash
# Vercel Dashboard → Settings → Environment Variables
ETHEREUM_PRIVATE_KEY=0xabc...
ETHEREUM_RPC_URL=https://mainnet...
BLOCKCHAIN_TESTNET=false
# ... other production keys
```

## Deployment Steps

### 1. Test on Staging
```bash
# Switch .env to mainnet (backup testnet version first)
# Keep BLOCKCHAIN_TESTNET=true but use small amounts
# Test all payment flows
# Monitor for errors in logs
```

### 2. Deploy to Vercel
```bash
git push origin main
# Vercel auto-deploys from main branch
# Monitor deployment: https://vercel.com/dashboard
```

### 3. Verify Production
- [ ] Check https://yourdomain.com loads
- [ ] Test sign up and login
- [ ] Test crypto buy/sell/send
- [ ] Verify transactions on Etherscan
- [ ] Check logs for errors

### 4. Monitor First 24 Hours
- Watch for transaction failures
- Monitor gas prices (might spike)
- Check error rates
- Verify payment confirmations
- Monitor user feedback

## Mainnet Network Addresses

### Ethereum Mainnet
- Network: `mainnet`
- RPC: `https://mainnet.infura.io/v3/YOUR_KEY`
- Chain ID: `1`
- Block Explorer: https://etherscan.io

### Bitcoin Mainnet
- Network: `mainnet`
- RPC: `https://bitcoind-mainnet.endpoint.com`
- Chain ID: N/A
- Block Explorer: https://blockchain.com

## Gas Fees & Costs

### Typical Mainnet Fees (2024)
- ETH Transfer: 0.0005 - 0.002 ETH (~$1-5)
- USDT Transfer: 0.0008 - 0.003 ETH (~$2-8)
- BTC Transfer: 5,000 - 50,000 satoshis (~$2-10)

### Cost Optimization
- Use Layer 2 (Polygon, Arbitrum) for cheaper fees
- Batch transactions during off-peak hours
- Set gas limits efficiently
- Monitor mempool for best fees

## Legal Requirements

Before going live with real transactions:

### KYC/AML Compliance
- [ ] Implement user identity verification
- [ ] Track transaction limits per user
- [ ] Monitor for suspicious patterns
- [ ] Keep audit logs

### Payment Compliance
- [ ] Paystack terms of service
- [ ] NOWPayments terms of service
- [ ] Local financial regulations
- [ ] Tax reporting requirements

### Privacy & Security
- [ ] Privacy policy updated
- [ ] Terms of service reviewed
- [ ] SSL/TLS enabled
- [ ] Data encryption at rest

## Rollback Plan

If something goes wrong:

### 1. Immediate Stop
```bash
# 1. Disable payment functions in Vercel env
# 2. Set BLOCKCHAIN_TESTNET=true
# 3. Stop accepting new transactions
# 4. Alert users
```

### 2. Investigate
- Check Vercel logs
- Review blockchain transactions
- Check database for corruption
- Check payment provider status

### 3. Recovery
- Deploy hotfix to main
- Manual transaction reversal if needed
- User notifications
- Post-mortem analysis

## Monitoring & Maintenance

### Daily Checks
- [ ] Check transaction queue
- [ ] Monitor error rates
- [ ] Review failed transactions
- [ ] Check blockchain network status

### Weekly Reviews
- [ ] Gas price trends
- [ ] User onboarding metrics
- [ ] Payment success rates
- [ ] System performance

### Monthly Tasks
- [ ] Database backup verification
- [ ] Security audit
- [ ] Compliance review
- [ ] Fee optimization

## Support Contacts

- **Infura Support**: https://support.infura.io
- **Paystack Support**: https://support.paystack.com
- **Vercel Support**: https://vercel.com/support
- **Neon Support**: https://neon.tech/docs/get-started-with-neon/support

## Post-Launch Improvements

After going live, consider:

- [ ] Multi-signature wallet for security
- [ ] Smart contract audit
- [ ] Hardware wallet integration
- [ ] Advanced analytics
- [ ] Mobile app
- [ ] Additional tokens (SOL, etc.)
- [ ] Staking features
