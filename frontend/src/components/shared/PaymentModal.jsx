// frontend/src/components/shared/PaymentModal.jsx
//
// Complete payment modal that handles:
//  - Plan selection
//  - Live gateway (Flutterwave / Paystack) when keys are present
//  - Manual bank transfer fallback when keys are missing
//  - Processing / success / failed states

import React, { useState } from 'react';
import {
  CreditCard, CheckCircle, AlertCircle, Loader2,
  ArrowRight, Copy, ExternalLink, Building2, X,
  Smartphone, Landmark, RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Modal, Button, Badge } from './index';
import { usePayment, PAYMENT_STATE } from '../../hooks/usePayment';
import { PLANS, BANK_DETAILS, SUPPORT_WHATSAPP } from '../../config/paymentConfig';

// ── Plan selector card ────────────────────────────────────────────────────────
function PlanCard({ plan, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(plan.id)}
      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
        selected
          ? 'border-primary-500 bg-primary-50 shadow-md'
          : 'border-gray-200 hover:border-primary-200 hover:bg-gray-50'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-gray-900">{plan.name}</span>
            {plan.badge && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                {plan.badge}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mb-2">{plan.description}</p>
          <ul className="space-y-1">
            {plan.features.slice(0, 4).map(f => (
              <li key={f} className="text-xs text-gray-600 flex items-center gap-1.5">
                <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />{f}
              </li>
            ))}
          </ul>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xl font-black text-gray-900">{plan.price}</p>
          <p className="text-xs text-gray-400">{plan.period}</p>
          {selected && <CheckCircle className="w-5 h-5 text-primary-500 ml-auto mt-2" />}
        </div>
      </div>
    </button>
  );
}

// ── Copy helper ───────────────────────────────────────────────────────────────
function CopyRow({ label, value }) {
  const copy = () => {
    navigator.clipboard.writeText(value);
    toast.success(`${label} copied!`);
  };
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-gray-900 font-mono">{value}</span>
        <button onClick={copy} className="p-1 hover:bg-gray-100 rounded transition-colors">
          <Copy className="w-3.5 h-3.5 text-gray-400" />
        </button>
      </div>
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────
export function PaymentModal({ isOpen, onClose, business, onPaymentSuccess }) {
  const [selectedPlanId, setSelectedPlanId] = useState('monthly');
  const selectedPlan = PLANS.find(p => p.id === selectedPlanId);

  const {
    state, error, hasKeys, provider,
    isProcessing, isSuccess, isFailed, isManual,
    initiatePayment, submitManualPayment, reset,
  } = usePayment({
    business,
    planId: selectedPlanId,
    onSuccess: (data) => {
      onPaymentSuccess?.(data);
    },
    onError: (msg) => {
      toast.error(msg);
    },
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  const waRef = `${business?.slug?.toUpperCase()}-${selectedPlanId.toUpperCase()}`;
  const waText = encodeURIComponent(
    `Hi! I've made a bank transfer for the ${selectedPlan?.name} plan (${selectedPlan?.price}).\nRef: ${waRef}\nBusiness: ${business?.businessName}`
  );

  // ── Modal title ───────────────────────────────────────────────────────────
  const title = isSuccess    ? '✅ Payment Successful!'
    : isFailed   ? '❌ Payment Failed'
    : isManual   ? '🏦 Bank Transfer Details'
    : isProcessing ? 'Processing…'
    : 'Subscribe / Renew';

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} size="lg">
      <AnimatePresence mode="wait">

        {/* ── SUCCESS ──────────────────────────────────────────────────────── */}
        {isSuccess && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-6 space-y-4"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 220, delay: 0.1 }}
              className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto"
            >
              <CheckCircle className="w-10 h-10 text-green-500" />
            </motion.div>
            <div>
              <p className="text-xl font-bold text-gray-900">
                {state === PAYMENT_STATE.SUCCESS && error === null
                  ? 'Subscription Activated!'
                  : 'Request Received!'}
              </p>
              <p className="text-gray-500 text-sm mt-2">
                Your <strong>{selectedPlan?.name}</strong> plan is now active.
                You have full access to all features.
              </p>
            </div>
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800 text-left space-y-1.5">
              <p className="font-semibold">What's included:</p>
              {selectedPlan?.features.map(f => (
                <p key={f} className="flex items-center gap-2 text-xs">
                  <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />{f}
                </p>
              ))}
            </div>
            <Button fullWidth onClick={handleClose}>Done</Button>
          </motion.div>
        )}

        {/* ── FAILED ───────────────────────────────────────────────────────── */}
        {isFailed && (
          <motion.div
            key="failed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-6 space-y-4"
          >
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">Payment Failed</p>
              <p className="text-sm text-gray-500 mt-1">{error}</p>
            </div>
            <div className="flex gap-3">
              <Button fullWidth icon={RefreshCw} onClick={reset}>Try Again</Button>
              <Button fullWidth variant="outline" onClick={() => {
                reset();
                // Jump straight to manual fallback
                setTimeout(() => initiatePayment(), 50);
              }}>Pay via Transfer</Button>
            </div>
          </motion.div>
        )}

        {/* ── PROCESSING ───────────────────────────────────────────────────── */}
        {isProcessing && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 space-y-4"
          >
            <Loader2 className="w-12 h-12 animate-spin text-primary-500 mx-auto" />
            <p className="font-semibold text-gray-700">Verifying your payment…</p>
            <p className="text-sm text-gray-400">Please do not close this window</p>
          </motion.div>
        )}

        {/* ── MANUAL BANK TRANSFER ─────────────────────────────────────────── */}
        {isManual && !isSuccess && !isFailed && !isProcessing && (
          <motion.div
            key="manual"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            {/* Selected plan summary */}
            <div className="flex items-center justify-between p-3 bg-primary-50 rounded-xl">
              <div>
                <p className="font-bold text-primary-800">{selectedPlan?.name} Plan</p>
                <p className="text-xs text-primary-600">{selectedPlan?.period}</p>
              </div>
              <p className="text-2xl font-black text-primary-600">{selectedPlan?.price}</p>
            </div>

            {/* If keys not yet set, show informational badge */}
            {!hasKeys && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>Online payment gateway not yet configured — use bank transfer below</span>
              </div>
            )}

            {/* Bank details */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <Landmark className="w-4 h-4 text-gray-500" />
                <p className="font-semibold text-gray-800 text-sm">Bank Transfer Details</p>
              </div>
              <CopyRow label="Bank"           value={BANK_DETAILS.bankName}      />
              <CopyRow label="Account Name"   value={BANK_DETAILS.accountName}   />
              <CopyRow label="Account Number" value={BANK_DETAILS.accountNumber} />
              <CopyRow label="Amount"         value={selectedPlan?.price}        />
              <CopyRow label="Reference"      value={waRef}                      />
            </div>

            <p className="text-xs text-center text-gray-500">
              After transfer, click below to notify our team via WhatsApp.
              Your subscription will be activated within <strong>24 hours</strong>.
            </p>

            {/* Actions */}
            <div className="space-y-2">
              {/* WhatsApp notification */}
              <a
                href={`https://wa.me/${SUPPORT_WHATSAPP}?text=${waText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white bg-[#25D366] hover:bg-[#1fb856] transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 32 32" fill="currentColor">
                  <path d="M16 .5C7.44.5.5 7.44.5 16c0 2.83.74 5.5 2.04 7.84L.5 31.5l7.86-2.06A15.45 15.45 0 0016 31.5c8.56 0 15.5-6.94 15.5-15.5S24.56.5 16 .5zm7.1 21.7c-.39-.2-2.3-1.14-2.66-1.27-.36-.13-.62-.2-.88.2-.26.39-1 1.27-1.23 1.53-.22.26-.45.29-.84.1a10.64 10.64 0 01-3.14-1.94 11.77 11.77 0 01-2.17-2.7c-.23-.39-.03-.6.17-.8.18-.17.39-.45.59-.68.2-.22.26-.38.39-.64.13-.26.07-.49-.03-.68-.1-.2-.88-2.12-1.2-2.9-.32-.76-.64-.66-.88-.67l-.74-.01c-.26 0-.67.1-1.02.48-.36.38-1.36 1.33-1.36 3.24s1.39 3.76 1.59 4.02c.19.26 2.74 4.18 6.63 5.86.93.4 1.65.64 2.22.82.93.3 1.78.26 2.45.16.75-.11 2.3-.94 2.62-1.84.33-.9.33-1.68.23-1.84-.1-.16-.36-.26-.75-.46z"/>
                </svg>
                I've Paid — Notify via WhatsApp
              </a>

              {/* Or submit via system */}
              <Button
                fullWidth
                variant="outline"
                icon={CheckCircle}
                loading={isProcessing}
                onClick={submitManualPayment}
              >
                I've Paid — Notify via System
              </Button>
            </div>

            <button
              onClick={reset}
              className="w-full text-xs text-center text-gray-400 hover:text-gray-600 underline transition-colors"
            >
              ← Back to plan selection
            </button>
          </motion.div>
        )}

        {/* ── PLAN SELECTION (idle) ─────────────────────────────────────────── */}
        {state === PAYMENT_STATE.IDLE && (
          <motion.div
            key="select"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <p className="text-sm text-gray-600">
              Choose a plan below.
              {hasKeys
                ? ' Pay securely online with your card, bank transfer, or USSD.'
                : ' Pay via bank transfer — your subscription is activated within 24 hours.'}
            </p>

            {/* Payment method badges */}
            <div className="flex items-center gap-2 flex-wrap">
              {hasKeys ? (
                <>
                  <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                    <CreditCard className="w-3 h-3" /> Card
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                    <Landmark className="w-3 h-3" /> Bank Transfer
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                    <Smartphone className="w-3 h-3" /> USSD / Mobile Money
                  </span>
                  <Badge variant="success" className="text-xs">🌍 International Cards OK</Badge>
                </>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full">
                  <Landmark className="w-3 h-3" /> Bank Transfer Only
                </span>
              )}
            </div>

            {/* Plans */}
            <div className="space-y-3">
              {PLANS.map(plan => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  selected={selectedPlanId === plan.id}
                  onSelect={setSelectedPlanId}
                />
              ))}
            </div>

            {/* How it works */}
            <div className="p-4 bg-gray-50 rounded-xl text-xs text-gray-600 space-y-1.5">
              <p className="font-semibold text-gray-700 text-sm mb-2">📋 How it works</p>
              {hasKeys ? (
                <>
                  <p>1. Select your plan and click Pay Now</p>
                  <p>2. Complete payment in the secure popup</p>
                  <p>3. Subscription is activated <strong>instantly</strong></p>
                </>
              ) : (
                <>
                  <p>1. Select your plan and click Proceed</p>
                  <p>2. Transfer exact amount to the account shown</p>
                  <p>3. Notify us via WhatsApp or the system button</p>
                  <p>4. Subscription activated within <strong>24 hours</strong></p>
                </>
              )}
            </div>

            {/* CTA */}
            <div className="flex gap-3">
              <Button
                fullWidth
                icon={hasKeys ? CreditCard : ArrowRight}
                onClick={initiatePayment}
              >
                {hasKeys ? `Pay ${selectedPlan?.price}` : 'Proceed to Payment'}
              </Button>
              <Button variant="outline" fullWidth onClick={handleClose}>
                Cancel
              </Button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </Modal>
  );
}