// frontend/src/config/paymentConfig.js
//
// ── DROP YOUR KEYS HERE WHEN READY ───────────────────────────────────────────
// Get keys from:
//   Flutterwave → https://dashboard.flutterwave.com/dashboard/settings/apis
//   Paystack    → https://dashboard.paystack.com/#/settings/developer
//
// Set REACT_APP_PAYMENT_PROVIDER to 'flutterwave' or 'paystack' in your .env

export const PAYMENT_PROVIDER      = import.meta.env.VITE_PAYMENT_PROVIDER      ?? 'flutterwave';
export const FLUTTERWAVE_PUBLIC_KEY = import.meta.env.VITE_FLW_PUBLIC_KEY        ?? 'FLWPUBK-PASTE-YOUR-KEY-HERE';
export const PAYSTACK_PUBLIC_KEY    = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY   ?? 'pk_live_PASTE-YOUR-KEY-HERE';

// ── Plan pricing (NGN) ────────────────────────────────────────────────────────
export const PLANS = [
  {
    id:          'monthly',
    name:        'Monthly',
    price:       '₦15,000',
    amount:      15000,          // in NGN — used for payment
    period:      'per month',
    description: 'Billed every 30 days — cancel anytime',
    durationDays: 30,
    badge:       null,
    features: [
      'Full platform access',
      'Unlimited products',
      'All analytics & reports',
      'Customer support',
      'Custom storefront',
      'WhatsApp integration',
    ],
  },
  {
    id:          'annual',
    name:        'Annual',
    price:       '₦150,000',
    amount:      150000,
    period:      'per year',
    description: 'Save 17% compared to monthly billing',
    durationDays: 365,
    badge:       'Best Value',
    features: [
      'Everything in Monthly',
      '2 months free',
      'Priority support',
      'Early access to new features',
      'Dedicated account manager',
    ],
  },
];

// ── Bank transfer fallback (shown when gateway is unavailable) ────────────────
export const BANK_DETAILS = {
  bankName:      'First Bank Nigeria',
  accountName:   'Olumah Lucky George',
  accountNumber: '3117923181',
};

// ── Support contact ───────────────────────────────────────────────────────────
export const SUPPORT_WHATSAPP = '2348110252143';
export const SUPPORT_EMAIL    = 'support@mypadibusiness.com';