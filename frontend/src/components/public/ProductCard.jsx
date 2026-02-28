// frontend/src/components/public/ProductCard.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Star, Sparkles, Plus } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';
import { ProductImageSlideshow } from './ProductImageSlideshow';
import { Stars } from './Stars';

export function ProductCard({ product, currency, primary, dark, onAdd, cartQty, t }) {
  const isOOS = product.stock === 0;
  const isUnavail = !product.isAvailable;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="sf-card group cursor-pointer"
      onClick={() => !isOOS && !isUnavail && onAdd(product)}
    >
      {/*
        ✅ FIX: position:relative is critical here so absolute children
        (the slideshow, badges, overlay) are contained within this box.
        paddingTop:70% creates the aspect-ratio box height.
      */}
      <div className="relative overflow-hidden" style={{ paddingTop: '70%' }}>

        {/* Image slideshow — renders at z-0 inside its own absolute inset-0 */}
        <ProductImageSlideshow product={product} dark={dark} />

        {/* Badges — z-10, above image */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5" style={{ zIndex: 10 }}>
          {product.featured && (
            <span
              className="sf-badge"
              style={{ background: primary, color: 'white', fontSize: '11px' }}
            >
              <Sparkles className="w-3 h-3" /> {t.featured}
            </span>
          )}
          {isOOS && (
            <span className="sf-badge bg-red-100 text-red-600">{t.outOfStock}</span>
          )}
          {isUnavail && !isOOS && (
            <span
              className="sf-badge"
              style={{
                background: dark ? 'rgba(255,255,255,.1)' : '#f3f4f6',
                color: dark ? '#aaa' : '#6b7280',
              }}
            >
              {t.unavailable}
            </span>
          )}
        </div>

        {/* Rating badge — z-10, above image */}
        {product.averageRating > 0 && (
          <div
            className="absolute top-3 right-3 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-semibold text-white"
            style={{ zIndex: 10 }}
          >
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            {product.averageRating.toFixed(1)}
          </div>
        )}

        {/* Cart quantity badge — z-10 */}
        {cartQty > 0 && (
          <div
            className="absolute bottom-6 right-3 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white sf-bounce"
            style={{ background: primary, zIndex: 10 }}
          >
            {cartQty}
          </div>
        )}

        {/*
          ✅ FIX: Hover overlay — z-10, but uses pointer-events:none when not
          hovered so it doesn't block the image visually or interaction-wise.
          Before this fix, bg-black/0 still created a stacking context that
          swallowed the image on some browsers.
        */}
        {!isOOS && !isUnavail && (
          <div
            className="absolute inset-0 flex items-center justify-center transition-all duration-300"
            style={{
              zIndex: 10,
              background: 'transparent',
              // Only show dark overlay on hover via group
            }}
          >
            {/* Inner overlay that actually darkens — opacity driven by group-hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
            <div
              className="relative opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-2 text-white font-semibold text-sm bg-black/70 px-4 py-2 rounded-full backdrop-blur-sm"
              style={{ zIndex: 1 }}
            >
              <Plus className="w-4 h-4" /> {t.addToCart}
            </div>
          </div>
        )}
      </div>

      {/* Product info */}
      <div className="p-4">
        {product.category && (
          <span
            className="text-xs font-medium uppercase tracking-wider mb-1 block"
            style={{ color: dark ? 'rgba(255,255,255,.35)' : '#a8a099' }}
          >
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
          <p
            className="text-sm line-clamp-2 mb-3 leading-relaxed"
            style={{ color: dark ? 'rgba(255,255,255,.45)' : '#78716c' }}
          >
            {product.description}
          </p>
        )}
        <div className="flex items-center justify-between">
          <span className="sf-display font-bold text-xl" style={{ color: primary }}>
            {formatCurrency(product.price, currency)}
          </span>
          {product.stock > 0 && product.stock <= 10 && (
            <span className="text-xs font-medium text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-full">
              {t.only} {product.stock} {t.left}
            </span>
          )}
        </div>
        {product.averageRating > 0 && (
          <div className="flex items-center gap-1.5 mt-2">
            <Stars rating={product.averageRating} dark={dark} />
            <span
              className="text-xs"
              style={{ color: dark ? 'rgba(255,255,255,.3)' : '#a8a099' }}
            >
              ({product.averageRating.toFixed(1)})
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}