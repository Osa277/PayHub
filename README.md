# PayHub - Payment Application

A modern, full-stack payment application for local and international transactions built with **Next.js**, **TypeScript**, **React**, and **Tailwind CSS**.

## 🌟 Features

- **💳 Multi-Currency Payments** - Support for 12+ currencies with real-time exchange rates
- **🏦 Digital Wallet** - Manage funds in a secure digital wallet
- **💰 Payment Processing** - Stripe & PayPal integration
- **📋 Invoicing** - Create, manage, and track invoices
- **📊 Dashboard** - Comprehensive analytics and reporting
- **🔄 Recurring Payments** - Support for subscription-based payments
- **🌍 International Transactions** - Send money locally and globally
- **📱 Responsive Design** - Works seamlessly on desktop and mobile
- **🔒 Secure** - Bank-level security and encryption

## 🚀 Tech Stack

- **Frontend:** Next.js 14, React 18, TypeScript
- **Styling:** Tailwind CSS, CSS Modules
- **State Management:** Zustand
- **Payment Providers:** Stripe, PayPal
- **Database:** (Ready for PostgreSQL/MongoDB integration)
- **Testing:** Jest, React Testing Library
- **Utilities:** Axios, Date-fns, Currency Converter

## 📦 Prerequisites

- Node.js 18.17+
- npm or yarn
- Stripe account (for testing)
- PayPal account (for testing)

## 🏗️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd payment-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add your API keys:
   - Stripe keys from https://dashboard.stripe.com/apikeys
   - PayPal keys from https://developer.paypal.com

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── payments/      # Payment processing
│   │   ├── transactions/  # Transaction management
│   │   ├── wallets/       # Wallet operations
│   │   ├── invoices/      # Invoice management
│   │   └── exchange-rates/ # Currency conversion
│   ├── dashboard/         # Admin dashboard
│   ├── payment/           # Payment page
│   ├── wallet/            # Wallet page
│   └── layout.tsx         # Root layout
├── components/            # Reusable React components
│   ├── Navbar.tsx
│   ├── WalletDisplay.tsx
│   ├── PaymentForm.tsx
│   ├── TransactionList.tsx
│   └── InvoiceList.tsx
├── lib/                   # Utilities and helpers
│   ├── store.ts          # Zustand store
│   ├── constants.ts      # App constants
│   └── utils.ts          # Helper functions
└── types/                # TypeScript type definitions
    └── index.ts
```

## 🔌 API Routes

### Payments
- `POST /api/payments` - Create payment session
- `GET /api/payments` - Retrieve payment session

### Transactions
- `GET /api/transactions?userId=<id>` - Get user transactions
- `POST /api/transactions` - Create transaction

### Wallets
- `GET /api/wallets?userId=<id>` - Get wallet
- `POST /api/wallets` - Create wallet

### Invoices
- `GET /api/invoices?userId=<id>` - Get invoices
- `POST /api/invoices` - Create invoice

### Exchange Rates
- `GET /api/exchange-rates?from=USD&to=EUR` - Get exchange rate

## 💳 Payment Providers

### Stripe Integration
1. Get API keys from [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Add keys to `.env.local`:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```

### PayPal Integration
1. Get credentials from [PayPal Developer](https://developer.paypal.com)
2. Add keys to `.env.local`:
   ```
   PAYPAL_CLIENT_ID=...
   PAYPAL_CLIENT_SECRET=...
   ```

## 🧪 Running Tests

```bash
npm run test
```

## 🏗️ Production Build

```bash
npm run build
npm run start
```

## 📝 Environment Variables

See `.env.example` for a complete list of required environment variables.

## 🔐 Security Considerations

- Always use HTTPS in production
- Keep API keys secret (never commit to git)
- Implement rate limiting for API endpoints
- Use webhooks for payment verification
- Enable CORS only for trusted domains
- Implement proper authentication and authorization

## 🐛 Troubleshooting

### Port 3000 already in use
```bash
npm run dev -- -p 3001
```

### Build errors
```bash
rm -rf .next node_modules
npm install
npm run build
```

### Environment variables not loading
Ensure `.env.local` is in the root directory and restart the dev server.

## 📚 Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [Stripe Integration Guide](https://stripe.com/docs)
- [PayPal Integration Guide](https://developer.paypal.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 💬 Support

For support, email support@payhub.com or open an issue in the repository.

## 🙏 Acknowledgments

- Next.js and React teams
- Stripe and PayPal for payment infrastructure
- Tailwind CSS for styling
- All contributors and users

---

**Made with ❤️ by PayHub Team**
