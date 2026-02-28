// frontend/src/services/paymentService.js
//
// Handles Flutterwave & Paystack initialisation.
// When keys are not yet set, all methods return { pending: true }
// so the UI can show the manual bank-transfer fallback instead of crashing.

import api from './api';
import {
  PAYMENT_PROVIDER,
  FLUTTERWAVE_PUBLIC_KEY,
  PAYSTACK_PUBLIC_KEY,
  PLANS,
} from '../config/paymentConfig';

// ── Check if real keys are present ───────────────────────────────────────────
export function keysConfigured() {
  if (PAYMENT_PROVIDER === 'flutterwave') {
    return (
      FLUTTERWAVE_PUBLIC_KEY &&
      !FLUTTERWAVE_PUBLIC_KEY.includes('PASTE')
    );
  }
  return (
    PAYSTACK_PUBLIC_KEY &&
    !PAYSTACK_PUBLIC_KEY.includes('PASTE')
  );
}

export function getProvider() {
  return PAYMENT_PROVIDER;
}

// ── Build Flutterwave config object ──────────────────────────────────────────
export function buildFlutterwaveConfig({ planId, business, onSuccess, onClose }) {
  const plan = PLANS.find(p => p.id === planId);
  if (!plan) throw new Error('Invalid plan');

  return {
    public_key:      FLUTTERWAVE_PUBLIC_KEY,
    tx_ref:          `${business.slug}-${planId}-${Date.now()}`,
    amount:          plan.amount,
    currency:        'NGN',
    payment_options: 'card,banktransfer,ussd,mobilemoney',
    customer: {
      email:        business.email        || business.ownerEmail || '',
      phone_number: business.phone        || business.ownerPhone || '',
      name:         business.businessName || business.name       || '',
    },
    customizations: {
      title:       'MyPadiBusiness Subscription',
      description: `${plan.name} Plan — ${plan.price}`,
      logo:        `${window.location.origin}/logo.png`,
    },
    meta: {
      businessId: business.id,
      planId,
    },
  };
}

// ── Build Paystack config object ─────────────────────────────────────────────
export function buildPaystackConfig({ planId, business, onSuccess, onClose }) {
  const plan = PLANS.find(p => p.id === planId);
  if (!plan) throw new Error('Invalid plan');

  return {
    reference:  `${business.slug}-${planId}-${Date.now()}`,
    email:      business.email || business.ownerEmail || '',
    amount:     plan.amount * 100,   // Paystack uses kobo
    publicKey:  PAYSTACK_PUBLIC_KEY,
    currency:   'NGN',
    metadata: {
      businessId:    business.id,
      businessName:  business.businessName,
      planId,
      custom_fields: [
        { display_name: 'Business', variable_name: 'business', value: business.businessName },
        { display_name: 'Plan',     variable_name: 'plan',     value: plan.name             },
      ],
    },
    onSuccess,
    onClose,
  };
}

// ── Verify payment with backend ───────────────────────────────────────────────
export async function verifyPayment({ transactionId, txRef, planId, businessId, provider }) {
  const response = await api.post(`/api/business/${businessId}/verify-payment`, {
    transaction_id: transactionId,
    tx_ref:         txRef,
    plan:           planId,
    provider:       provider || PAYMENT_PROVIDER,
  });
  return response.data;
}

// ── Record manual (bank transfer) payment request ────────────────────────────
export async function recordManualPayment({ businessId, planId, slug }) {
  const plan = PLANS.find(p => p.id === planId);
  const response = await api.post('/api/contact-support', {
    type:       'subscription_renewal',
    plan:       planId,
    businessId,
    message:    `Manual bank transfer submitted — ${plan?.name} plan. Ref: MANUAL-${slug?.toUpperCase()}-${Date.now()}`,
  });
  return response.data;
}