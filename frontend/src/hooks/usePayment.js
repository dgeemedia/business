// frontend/src/hooks/usePayment.js
//
// ── VITE-SAFE: Zero dynamic imports ──────────────────────────────────────────
// Vite statically analyzes all import() calls at build time, even inside
// try/catch. This hook avoids that entirely by using:
//  - window.FlutterwaveCheckout (loaded via <script> tag on demand)
//  - window.PaystackPop         (loaded via <script> tag on demand)
//
// When keys are present:  gateway popup opens
// When keys are missing:  silently falls back to bank transfer flow
// No npm install needed until you're ready to go live.

import { useState, useCallback } from 'react';
import {
  keysConfigured,
  getProvider,
  buildFlutterwaveConfig,
  buildPaystackConfig,
  verifyPayment,
  recordManualPayment,
} from '../services/paymentService';

export const PAYMENT_STATE = {
  IDLE:       'idle',
  PROCESSING: 'processing',
  SUCCESS:    'success',
  FAILED:     'failed',
  MANUAL:     'manual',
};

// ── Load external script once ─────────────────────────────────────────────────
function loadScript(src, checkGlobal) {
  return new Promise((resolve, reject) => {
    if (window[checkGlobal]) return resolve();           // already loaded
    if (document.querySelector(`script[src="${src}"]`)) {
      // Script tag exists but may still be loading — poll
      const poll = setInterval(() => {
        if (window[checkGlobal]) { clearInterval(poll); resolve(); }
      }, 100);
      setTimeout(() => { clearInterval(poll); reject(new Error(`Timeout loading ${src}`)); }, 10000);
      return;
    }
    const script   = document.createElement('script');
    script.src     = src;
    script.onload  = resolve;
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

// ── Main hook ─────────────────────────────────────────────────────────────────
export function usePayment({ business, planId, onSuccess, onError }) {
  const [state,  setState]  = useState(PAYMENT_STATE.IDLE);
  const [error,  setError]  = useState(null);
  const [result, setResult] = useState(null);

  const hasKeys  = keysConfigured();
  const provider = getProvider();

  // ── Verify with backend after gateway confirms ──────────────────────────
  const handleVerify = useCallback(async ({ transactionId, txRef }) => {
    setState(PAYMENT_STATE.PROCESSING);
    try {
      const data = await verifyPayment({
        transactionId,
        txRef,
        planId,
        businessId: business.id,
        provider,
      });
      setResult(data);
      setState(PAYMENT_STATE.SUCCESS);
      onSuccess?.(data);
    } catch (err) {
      const msg = err.response?.data?.error || 'Verification failed. Contact support.';
      setError(msg);
      setState(PAYMENT_STATE.FAILED);
      onError?.(msg);
    }
  }, [planId, business?.id, provider, onSuccess, onError]);

  // ── Initiate payment ────────────────────────────────────────────────────
  const initiatePayment = useCallback(async () => {
    setError(null);

    // No keys yet → bank transfer
    if (!hasKeys) {
      setState(PAYMENT_STATE.MANUAL);
      return;
    }

    setState(PAYMENT_STATE.PROCESSING);

    try {
      if (provider === 'flutterwave') {
        await loadScript(
          'https://checkout.flutterwave.com/v3.js',
          'FlutterwaveCheckout'
        );

        if (!window.FlutterwaveCheckout) {
          console.warn('FlutterwaveCheckout not available — falling back to manual');
          setState(PAYMENT_STATE.MANUAL);
          return;
        }

        const config = buildFlutterwaveConfig({ planId, business });

        window.FlutterwaveCheckout({
          ...config,
          callback: async (response) => {
            if (response.status === 'successful') {
              await handleVerify({
                transactionId: response.transaction_id,
                txRef:         response.tx_ref,
              });
            } else {
              setState(PAYMENT_STATE.FAILED);
              setError('Payment was not completed.');
              onError?.('Payment was not completed.');
            }
          },
          onclose: () => {
            // Only reset if still processing (user closed before completing)
            setState(prev =>
              prev === PAYMENT_STATE.PROCESSING ? PAYMENT_STATE.IDLE : prev
            );
          },
        });

      } else if (provider === 'paystack') {
        await loadScript(
          'https://js.paystack.co/v1/inline.js',
          'PaystackPop'
        );

        if (!window.PaystackPop) {
          console.warn('PaystackPop not available — falling back to manual');
          setState(PAYMENT_STATE.MANUAL);
          return;
        }

        const config  = buildPaystackConfig({ planId, business });
        const handler = window.PaystackPop.setup({
          ...config,
          callback: async (response) => {
            await handleVerify({
              transactionId: response.trxref,
              txRef:         response.reference,
            });
          },
          onClose: () => {
            setState(prev =>
              prev === PAYMENT_STATE.PROCESSING ? PAYMENT_STATE.IDLE : prev
            );
          },
        });
        handler.openIframe();

      } else {
        setState(PAYMENT_STATE.MANUAL);
      }
    } catch (err) {
      console.warn('Payment init failed, falling back to manual:', err.message);
      setState(PAYMENT_STATE.MANUAL);
    }
  }, [business, planId, hasKeys, provider, handleVerify, onError]);

  // ── Submit manual (bank transfer) payment notification ──────────────────
  const submitManualPayment = useCallback(async () => {
    setState(PAYMENT_STATE.PROCESSING);
    try {
      await recordManualPayment({
        businessId: business.id,
        planId,
        slug:       business.slug,
      });
      setState(PAYMENT_STATE.SUCCESS);
      onSuccess?.({ manual: true });
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to submit. Please contact support.';
      setError(msg);
      setState(PAYMENT_STATE.FAILED);
      onError?.(msg);
    }
  }, [business?.id, business?.slug, planId, onSuccess, onError]);

  const reset = useCallback(() => {
    setState(PAYMENT_STATE.IDLE);
    setError(null);
    setResult(null);
  }, []);

  return {
    state,
    error,
    result,
    hasKeys,
    provider,
    isProcessing: state === PAYMENT_STATE.PROCESSING,
    isSuccess:    state === PAYMENT_STATE.SUCCESS,
    isFailed:     state === PAYMENT_STATE.FAILED,
    isManual:     state === PAYMENT_STATE.MANUAL,
    initiatePayment,
    submitManualPayment,
    reset,
  };
}