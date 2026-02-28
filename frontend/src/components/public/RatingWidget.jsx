// frontend/src/components/public/RatingWidget.jsx
// Shown on the product detail / after adding to cart.
// A customer enters the phone number they ordered with, sees whether
// they can rate, and submits (or updates) a 1–5 star rating + comment.

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Phone, Send, CheckCircle, Loader2, X } from 'lucide-react';
import ratingService from '../../services/ratingService';

// ── Star input ────────────────────────────────────────────────────────────────
function StarInput({ value, onChange, disabled }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
          className="focus:outline-none transition-transform hover:scale-110 disabled:cursor-not-allowed"
        >
          <Star
            className="w-8 h-8 transition-colors"
            style={{
              fill:  (hovered || value) >= star ? '#FBBF24' : 'transparent',
              color: (hovered || value) >= star ? '#FBBF24' : '#D1D5DB',
            }}
          />
        </button>
      ))}
    </div>
  );
}

const LABEL = ['', 'Terrible', 'Poor', 'Average', 'Good', 'Excellent'];

export default function RatingWidget({ productId, productName, primary = '#10B981', dark = false, onClose }) {
  const [phone,    setPhone]    = useState('');
  const [verified, setVerified] = useState(false);   // true after canRate check passes
  const [canRate,  setCanRate]  = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [existing, setExisting] = useState(null);
  const [rating,   setRating]   = useState(0);
  const [comment,  setComment]  = useState('');
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [error,    setError]    = useState('');

  // ── Step 1: verify phone ─────────────────────────────────────────────────
  async function handleVerify(e) {
    e.preventDefault();
    if (!phone.trim()) return;
    setChecking(true);
    setError('');
    try {
      const data = await ratingService.canRate(productId, phone.trim());
      setVerified(true);
      setCanRate(data.canRate);
      setHasRated(data.hasRated);
      if (data.rating) {
        setExisting(data.rating);
        setRating(data.rating.rating);
        setComment(data.rating.comment || '');
      }
      if (!data.canRate) {
        setError('This phone number has no completed & delivered order for this product.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed. Please try again.');
    } finally {
      setChecking(false);
    }
  }

  // ── Step 2: submit rating ─────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    if (!rating) return setError('Please select a star rating.');
    setSubmitting(true);
    setError('');
    try {
      await ratingService.submitRating(productId, { phone: phone.trim(), rating, comment });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit rating. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const bg    = dark ? '#1c1c1e' : '#ffffff';
  const border= dark ? 'rgba(255,255,255,.1)' : '#e5e7eb';
  const text  = dark ? '#f0f0f0' : '#111827';
  const sub   = dark ? 'rgba(255,255,255,.45)' : '#6B7280';
  const inputBg = dark ? 'rgba(255,255,255,.06)' : '#F9FAFB';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: bg, border: `1px solid ${border}`, boxShadow: '0 8px 32px rgba(0,0,0,.12)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: border }}>
        <div>
          <h3 className="font-bold text-base" style={{ color: text }}>Rate this product</h3>
          <p className="text-xs mt-0.5" style={{ color: sub }}>{productName}</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/5 transition-colors" style={{ color: sub }}>
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="p-5">
        {/* ── Success state ───────────────────────────────────────────────── */}
        {submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-6 text-center gap-3"
          >
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: `${primary}20` }}>
              <CheckCircle className="w-8 h-8" style={{ color: primary }} />
            </div>
            <p className="font-bold text-base" style={{ color: text }}>
              {hasRated ? 'Rating updated!' : 'Thank you for your review!'}
            </p>
            <p className="text-sm" style={{ color: sub }}>Your feedback helps other customers.</p>
            {onClose && (
              <button
                onClick={onClose}
                className="mt-2 px-5 py-2 rounded-xl text-sm font-semibold text-white"
                style={{ background: primary }}
              >
                Close
              </button>
            )}
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            {/* ── Step 1: phone verification ──────────────────────────────── */}
            {!verified ? (
              <motion.form
                key="verify"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onSubmit={handleVerify}
                className="space-y-4"
              >
                <p className="text-sm" style={{ color: sub }}>
                  Enter the phone number you used when placing your order.
                </p>

                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: sub }}>
                    Order Phone Number
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: sub }} />
                      <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="+234 800 000 0000"
                        required
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm border focus:outline-none"
                        style={{
                          background: inputBg, borderColor: border,
                          color: text,
                        }}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={checking || !phone.trim()}
                      className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center gap-2 disabled:opacity-60"
                      style={{ background: primary }}
                    >
                      {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
                )}
              </motion.form>
            ) : (
              /* ── Step 2: rating form ───────────────────────────────────── */
              <motion.form
                key="rate"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                {!canRate ? (
                  <div className="text-center py-4">
                    <p className="text-sm font-medium" style={{ color: '#EF4444' }}>{error}</p>
                    <button
                      type="button"
                      onClick={() => { setVerified(false); setPhone(''); setError(''); }}
                      className="mt-3 text-xs underline"
                      style={{ color: primary }}
                    >
                      Try a different number
                    </button>
                  </div>
                ) : (
                  <>
                    {hasRated && (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium"
                        style={{ background: `${primary}15`, color: primary }}>
                        <CheckCircle className="w-3.5 h-3.5" />
                        You've already rated this. You can update your rating below.
                      </div>
                    )}

                    {/* Stars */}
                    <div>
                      <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: sub }}>Your Rating</p>
                      <div className="flex items-center gap-3">
                        <StarInput value={rating} onChange={setRating} disabled={submitting} />
                        {rating > 0 && (
                          <span className="text-sm font-semibold" style={{ color: primary }}>{LABEL[rating]}</span>
                        )}
                      </div>
                    </div>

                    {/* Comment */}
                    <div>
                      <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: sub }}>
                        Review (optional)
                      </label>
                      <textarea
                        rows={3}
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        placeholder="Share your experience with this product..."
                        className="w-full px-3 py-2.5 rounded-xl text-sm border resize-none focus:outline-none"
                        style={{ background: inputBg, borderColor: border, color: text }}
                      />
                    </div>

                    {error && (
                      <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
                    )}

                    <button
                      type="submit"
                      disabled={submitting || !rating}
                      className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60"
                      style={{ background: primary }}
                    >
                      {submitting
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
                        : <><Send className="w-4 h-4" /> {hasRated ? 'Update Review' : 'Submit Review'}</>
                      }
                    </button>
                  </>
                )}
              </motion.form>
            )}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}