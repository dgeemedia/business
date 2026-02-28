// frontend/src/components/public/ProductCard.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Sparkles, Plus, MessageSquare, X, ChevronLeft, Edit3 } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';
import { ProductImageSlideshow } from './ProductImageSlideshow';
import { Stars } from './Stars';
import RatingWidget from './RatingWidget';
import ratingService from '../../services/ratingService';

// ── Read-only star display ────────────────────────────────────────────────────
function StarDisplay({ rating, size = 13 }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star
          key={s}
          style={{
            width: size, height: size,
            fill:  s <= Math.round(rating) ? '#FBBF24' : 'transparent',
            color: s <= Math.round(rating) ? '#FBBF24' : '#D1D5DB',
          }}
        />
      ))}
    </span>
  );
}

const LABEL = ['', 'Terrible', 'Poor', 'Average', 'Good', 'Excellent'];

// ── Reviews reader panel (shown inside the modal) ─────────────────────────────
function ReviewsPanel({ productId, primary, dark, onWriteReview, onClose }) {
  const [reviews, setReviews]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [avg,     setAvg]       = useState(0);
  const [total,   setTotal]     = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const data = await ratingService.getProductRatings(productId, { limit: 50 });
        setReviews(data.ratings || []);
        setAvg(data.averageRating || 0);
        setTotal(data.totalRatings || 0);
      } catch (err) {
        console.error('Failed to load reviews:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [productId]);

  const bg     = dark ? '#1c1c1e'              : '#ffffff';
  const border = dark ? 'rgba(255,255,255,.1)' : '#e5e7eb';
  const text   = dark ? '#f0f0f0'              : '#111827';
  const sub    = dark ? 'rgba(255,255,255,.45)': '#6B7280';
  const card   = dark ? 'rgba(255,255,255,.05)': '#F9FAFB';

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col"
      style={{
        background:  bg,
        border:      `1px solid ${border}`,
        boxShadow:   '0 8px 32px rgba(0,0,0,.15)',
        maxHeight:   '85vh',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
        style={{ borderColor: border }}
      >
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4" style={{ color: primary }} />
          <h3 className="font-bold text-base" style={{ color: text }}>Customer Reviews</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-black/5 transition-colors"
          style={{ color: sub }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Summary bar */}
      {total > 0 && (
        <div
          className="flex items-center gap-4 px-5 py-3 border-b flex-shrink-0"
          style={{ borderColor: border, background: dark ? 'rgba(255,255,255,.03)' : '#fafafa' }}
        >
          <div className="text-center">
            <p className="text-3xl font-black" style={{ color: primary }}>{avg.toFixed(1)}</p>
            <StarDisplay rating={avg} size={12} />
            <p className="text-xs mt-0.5" style={{ color: sub }}>{total} review{total !== 1 ? 's' : ''}</p>
          </div>
          {/* Star breakdown */}
          <div className="flex-1 space-y-1">
            {[5, 4, 3, 2, 1].map(s => {
              const count = reviews.filter(r => r.rating === s).length;
              const pct   = total > 0 ? (count / total) * 100 : 0;
              return (
                <div key={s} className="flex items-center gap-1.5">
                  <span className="text-[10px] w-2 text-right" style={{ color: sub }}>{s}</span>
                  <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400 flex-shrink-0" />
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: dark ? 'rgba(255,255,255,.08)' : '#e5e7eb' }}>
                    <div
                      className="h-full rounded-full bg-amber-400 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[10px] w-3 text-right" style={{ color: sub }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Review list — scrollable */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: primary }} />
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-10">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: text }} />
            <p className="text-sm font-medium" style={{ color: sub }}>No reviews yet</p>
            <p className="text-xs mt-1" style={{ color: sub }}>Be the first to share your experience</p>
          </div>
        ) : (
          reviews.map((r, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="p-3 rounded-xl"
              style={{ background: card, border: `1px solid ${border}` }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <StarDisplay rating={r.rating} size={12} />
                  <span className="text-xs font-semibold" style={{ color: primary }}>
                    {LABEL[r.rating]}
                  </span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ color: sub, background: dark ? 'rgba(255,255,255,.06)' : '#f3f4f6' }}>
                  {r.phone}
                </span>
              </div>

              {r.comment?.trim() ? (
                <p className="text-sm leading-relaxed" style={{ color: text }}>{r.comment}</p>
              ) : (
                <p className="text-xs italic" style={{ color: sub }}>No written comment</p>
              )}
            </motion.div>
          ))
        )}
      </div>

      {/* Footer — write a review */}
      <div className="px-5 py-4 border-t flex-shrink-0" style={{ borderColor: border }}>
        <button
          onClick={onWriteReview}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
          style={{ background: primary }}
        >
          <Edit3 className="w-4 h-4" />
          Write a Review
        </button>
      </div>
    </div>
  );
}

// ── Main ProductCard ──────────────────────────────────────────────────────────
export function ProductCard({ product, currency, primary, dark, onAdd, cartQty, t }) {
  // 'closed' | 'reviews' | 'write'
  const [modal, setModal] = useState('closed');

  const isOOS     = product.stock === 0;
  const isUnavail = !product.isAvailable;

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="sf-card group"
      >
        {/* ── Image area ───────────────────────────────────────────────────── */}
        <div
          className="relative overflow-hidden cursor-pointer"
          style={{ paddingTop: '70%' }}
          onClick={() => !isOOS && !isUnavail && onAdd(product)}
        >
          <ProductImageSlideshow product={product} dark={dark} />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5" style={{ zIndex: 10 }}>
            {product.featured && (
              <span className="sf-badge" style={{ background: primary, color: 'white', fontSize: '11px' }}>
                <Sparkles className="w-3 h-3" /> {t.featured}
              </span>
            )}
            {isOOS && <span className="sf-badge bg-red-100 text-red-600">{t.outOfStock}</span>}
            {isUnavail && !isOOS && (
              <span className="sf-badge"
                style={{ background: dark ? 'rgba(255,255,255,.1)' : '#f3f4f6', color: dark ? '#aaa' : '#6b7280' }}>
                {t.unavailable}
              </span>
            )}
          </div>

          {/* Rating badge */}
          {product.averageRating > 0 && (
            <div
              className="absolute top-3 right-3 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-semibold text-white"
              style={{ zIndex: 10 }}
            >
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              {product.averageRating.toFixed(1)}
            </div>
          )}

          {/* Cart qty badge */}
          {cartQty > 0 && (
            <div
              className="absolute bottom-6 right-3 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white sf-bounce"
              style={{ background: primary, zIndex: 10 }}
            >
              {cartQty}
            </div>
          )}

          {/* Hover overlay */}
          {!isOOS && !isUnavail && (
            <div className="absolute inset-0 flex items-center justify-center transition-all duration-300" style={{ zIndex: 10 }}>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
              <div className="relative opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-2 text-white font-semibold text-sm bg-black/70 px-4 py-2 rounded-full backdrop-blur-sm" style={{ zIndex: 1 }}>
                <Plus className="w-4 h-4" /> {t.addToCart}
              </div>
            </div>
          )}
        </div>

        {/* ── Product info ──────────────────────────────────────────────────── */}
        <div className="p-4">
          {product.category && (
            <span className="text-xs font-medium uppercase tracking-wider mb-1 block"
              style={{ color: dark ? 'rgba(255,255,255,.35)' : '#a8a099' }}>
              {product.category}
            </span>
          )}
          <h3
            className="sf-display font-semibold leading-snug line-clamp-2 mb-1"
            style={{ fontSize: '1.05rem', color: dark ? '#f0ede8' : '#1a1a1a' }}
          >
            {product.name}
          </h3>
          {product.description && (
            <p className="text-sm line-clamp-2 mb-3 leading-relaxed"
              style={{ color: dark ? 'rgba(255,255,255,.45)' : '#78716c' }}>
              {product.description}
            </p>
          )}

          <div className="flex items-center justify-between mb-3">
            <span className="sf-display font-bold text-xl" style={{ color: primary }}>
              {formatCurrency(product.price, currency)}
            </span>
            {product.stock > 0 && product.stock <= 10 && (
              <span className="text-xs font-medium text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-full">
                {t.only} {product.stock} {t.left}
              </span>
            )}
          </div>

          {/* Stars row — clicking opens reviews */}
          {product.averageRating > 0 && (
            <button
              onClick={e => { e.stopPropagation(); setModal('reviews'); }}
              className="flex items-center gap-1.5 mb-3 hover:opacity-80 transition-opacity"
            >
              <Stars rating={product.averageRating} dark={dark} />
              <span className="text-xs underline underline-offset-2" style={{ color: dark ? 'rgba(255,255,255,.3)' : '#a8a099' }}>
                ({product.totalRatings || product.averageRating.toFixed(1)}) · Read reviews
              </span>
            </button>
          )}

          {/* ── Review buttons row ─────────────────────────────────────────── */}
          <div className="flex gap-2 mt-1">
            {/* Read reviews button — only shown if there are ratings */}
            {product.averageRating > 0 && (
              <button
                onClick={e => { e.stopPropagation(); setModal('reviews'); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all"
                style={{
                  background: dark ? 'rgba(255,255,255,.04)' : '#f9fafb',
                  color:      dark ? 'rgba(255,255,255,.4)'  : '#6b7280',
                  border:     `1px solid ${dark ? 'rgba(255,255,255,.06)' : '#e5e7eb'}`,
                }}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                {product.totalRatings ?? ''} Reviews
              </button>
            )}

            {/* Write a review button */}
            <button
              onClick={e => { e.stopPropagation(); setModal('write'); }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: dark ? 'rgba(255,255,255,.06)' : `${primary}12`,
                color:      dark ? 'rgba(255,255,255,.5)'  : primary,
                border:     `1px solid ${dark ? 'rgba(255,255,255,.08)' : `${primary}25`}`,
              }}
            >
              <Star className="w-3.5 h-3.5" />
              {product.averageRating > 0 ? `${product.averageRating.toFixed(1)} · Rate` : 'Be first to review'}
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── Modal ────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {modal !== 'closed' && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setModal('closed')}
            />

            <motion.div
              key={modal}
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1,    y: 0  }}
              exit={  { opacity: 0, scale: 0.96, y: 16  }}
              className="relative w-full max-w-md z-10"
            >
              {modal === 'reviews' ? (
                <ReviewsPanel
                  productId={product.id}
                  primary={primary}
                  dark={dark}
                  onWriteReview={() => setModal('write')}
                  onClose={() => setModal('closed')}
                />
              ) : (
                /* Write review — with back button if reviews exist */
                <div className="relative">
                  {product.averageRating > 0 && (
                    <button
                      onClick={() => setModal('reviews')}
                      className="absolute -top-10 left-0 flex items-center gap-1.5 text-white/80 hover:text-white text-xs font-semibold transition-colors z-10"
                    >
                      <ChevronLeft className="w-4 h-4" /> Back to reviews
                    </button>
                  )}
                  <RatingWidget
                    productId={product.id}
                    productName={product.name}
                    primary={primary}
                    dark={dark}
                    onClose={() => setModal('closed')}
                  />
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}