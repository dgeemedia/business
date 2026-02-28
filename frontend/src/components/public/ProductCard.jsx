// frontend/src/components/public/ProductCard.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Sparkles, Plus, MessageSquare, X } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';
import { ProductImageSlideshow } from './ProductImageSlideshow';
import { Stars } from './Stars';
import RatingWidget from './RatingWidget';

export function ProductCard({ product, currency, primary, dark, onAdd, cartQty, t }) {
  const [ratingOpen, setRatingOpen] = useState(false);

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
        {/* ── Image area — clicks add to cart ─────────────────────────────── */}
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

          {/* Stars row */}
          {product.averageRating > 0 && (
            <div className="flex items-center gap-1.5 mb-3">
              <Stars rating={product.averageRating} dark={dark} />
              <span className="text-xs" style={{ color: dark ? 'rgba(255,255,255,.3)' : '#a8a099' }}>
                ({product.averageRating.toFixed(1)})
              </span>
            </div>
          )}

          {/* ── Rate button ────────────────────────────────────────────────── */}
          <button
            onClick={e => { e.stopPropagation(); setRatingOpen(true); }}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all mt-1"
            style={{
              background: dark ? 'rgba(255,255,255,.06)' : `${primary}12`,
              color:      dark ? 'rgba(255,255,255,.5)'  : primary,
              border:     `1px solid ${dark ? 'rgba(255,255,255,.08)' : `${primary}25`}`,
            }}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            {product.averageRating > 0
              ? `Rate · ${product.averageRating.toFixed(1)} ★`
              : 'Be first to review'}
          </button>
        </div>
      </motion.div>

      {/* ── Rating modal ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {ratingOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setRatingOpen(false)}
            />
            {/* Widget */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1,    y: 0  }}
              exit={  { opacity: 0, scale: 0.96, y: 16  }}
              className="relative w-full max-w-md z-10"
            >
              <RatingWidget
                productId={product.id}
                productName={product.name}
                primary={primary}
                dark={dark}
                onClose={() => setRatingOpen(false)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}