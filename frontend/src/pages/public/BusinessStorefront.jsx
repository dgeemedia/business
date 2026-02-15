// frontend/src/pages/public/BusinessStorefront.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  ShoppingCart, Star, Phone, MapPin, Clock, X, Send,
  Plus, Minus, ChevronRight, ExternalLink, Facebook,
  Instagram, Twitter, Youtube, LogIn, Search, Menu,
  MessageCircle, Heart, Sparkles, ArrowUp, Package
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api, { getSubdomain } from '../../services/api';
import { formatCurrency } from '../../utils/helpers';

// ─── Inject fonts once ─────────────────────────────────────────────────────
function useFonts() {
  useEffect(() => {
    if (document.getElementById('storefront-fonts')) return;
    const link = document.createElement('link');
    link.id = 'storefront-fonts';
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,600;0,9..144,700;1,9..144,400&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap';
    document.head.appendChild(link);
  }, []);
}

// ─── CSS-in-JS style block ─────────────────────────────────────────────────
function StoreStyles({ primary, secondary }) {
  const css = `
    .sf-root { font-family: 'Plus Jakarta Sans', sans-serif; }
    .sf-display { font-family: 'Fraunces', serif; }
    :root {
      --sf-primary: ${primary};
      --sf-secondary: ${secondary};
      --sf-bg: #F9F7F4;
      --sf-card: #FFFFFF;
      --sf-dark: #1A1A1A;
      --sf-muted: #6B6B6B;
    }
    .sf-btn-primary {
      background: var(--sf-primary);
      color: #fff;
      border: none;
      border-radius: 12px;
      padding: 12px 24px;
      font-weight: 600;
      font-family: 'Plus Jakarta Sans', sans-serif;
      cursor: pointer;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .sf-btn-primary:hover { filter: brightness(0.92); transform: translateY(-1px); }
    .sf-btn-primary:active { transform: translateY(0); }
    .sf-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
    .sf-btn-ghost {
      background: transparent;
      color: var(--sf-muted);
      border: 1.5px solid #E5E0D8;
      border-radius: 10px;
      padding: 8px 16px;
      font-weight: 500;
      font-family: 'Plus Jakarta Sans', sans-serif;
      cursor: pointer;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .sf-btn-ghost:hover { border-color: var(--sf-primary); color: var(--sf-primary); background: rgba(var(--sf-primary-rgb), 0.04); }
    .sf-input {
      width: 100%;
      padding: 12px 16px;
      border: 1.5px solid #E5E0D8;
      border-radius: 12px;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 15px;
      background: #FEFEFE;
      color: #1A1A1A;
      transition: border-color 0.2s;
      outline: none;
      box-sizing: border-box;
    }
    .sf-input:focus { border-color: var(--sf-primary); }
    .sf-input::placeholder { color: #B0A89C; }
    .sf-card {
      background: white;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04);
      transition: box-shadow 0.25s, transform 0.25s;
    }
    .sf-card:hover { box-shadow: 0 4px 8px rgba(0,0,0,0.08), 0 16px 40px rgba(0,0,0,0.08); transform: translateY(-3px); }
    .sf-cat-pill {
      padding: 8px 20px;
      border-radius: 100px;
      font-size: 14px;
      font-weight: 500;
      white-space: nowrap;
      cursor: pointer;
      border: 1.5px solid transparent;
      transition: all 0.2s;
      background: #EEEAE4;
      color: #5A5046;
    }
    .sf-cat-pill.active {
      background: var(--sf-primary);
      color: white;
    }
    .sf-cat-pill:not(.active):hover {
      border-color: var(--sf-primary);
      color: var(--sf-primary);
    }
    .sf-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      border-radius: 100px;
      font-size: 12px;
      font-weight: 600;
    }
    .sf-scroll-hide::-webkit-scrollbar { display: none; }
    .sf-scroll-hide { -ms-overflow-style: none; scrollbar-width: none; }
    .sf-wa-btn {
      background: #25D366;
      color: white;
      border: none;
      border-radius: 14px;
      padding: 14px 28px;
      font-weight: 700;
      font-size: 16px;
      font-family: 'Plus Jakarta Sans', sans-serif;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      width: 100%;
    }
    .sf-wa-btn:hover { background: #20BD5A; transform: translateY(-1px); }
    .sf-wa-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
    .sf-overlay {
      position: fixed; inset: 0;
      background: rgba(10,10,10,0.55);
      backdrop-filter: blur(3px);
      z-index: 100;
    }
    @keyframes sf-slide-up {
      from { opacity: 0; transform: translateY(24px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes sf-bounce-in {
      0% { transform: scale(0.5); opacity: 0; }
      60% { transform: scale(1.15); }
      100% { transform: scale(1); opacity: 1; }
    }
    .sf-bounce { animation: sf-bounce-in 0.35s ease forwards; }
    @media (max-width: 640px) {
      .sf-products-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 12px !important; }
      .sf-hero-text { font-size: clamp(2rem, 8vw, 3.5rem) !important; }
    }
  `;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}

// ─── Rating Stars ──────────────────────────────────────────────────────────
function Stars({ rating }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star
          key={i}
          className={`w-3 h-3 ${i <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200 fill-gray-200'}`}
        />
      ))}
    </span>
  );
}

// ─── Product Card ──────────────────────────────────────────────────────────
function ProductCard({ product, currency, primaryColor, onAdd, cartQty }) {
  const [imgError, setImgError] = useState(false);
  const isOOS = product.stock === 0;
  const isUnavailable = !product.isAvailable;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="sf-card group cursor-pointer"
      onClick={() => !isOOS && !isUnavailable && onAdd(product)}
    >
      {/* Image */}
      <div className="relative overflow-hidden" style={{ paddingTop: '70%' }}>
        {product.imageUrl && !imgError ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            onError={() => setImgError(true)}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200">
            <Package className="w-10 h-10 text-stone-300" />
          </div>
        )}
        {/* Overlay badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.featured && (
            <span className="sf-badge" style={{ background: primaryColor, color: 'white', fontSize: '11px' }}>
              <Sparkles className="w-3 h-3" /> Featured
            </span>
          )}
          {isOOS && (
            <span className="sf-badge bg-red-100 text-red-600">Out of stock</span>
          )}
          {isUnavailable && !isOOS && (
            <span className="sf-badge bg-gray-100 text-gray-500">Unavailable</span>
          )}
        </div>
        {/* Rating */}
        {product.averageRating > 0 && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-semibold shadow-sm">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            {product.averageRating.toFixed(1)}
          </div>
        )}
        {/* Cart qty indicator */}
        {cartQty > 0 && (
          <div
            className="absolute bottom-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white sf-bounce"
            style={{ background: primaryColor }}
          >
            {cartQty}
          </div>
        )}
        {/* Add overlay on hover */}
        {!isOOS && !isUnavailable && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 flex items-center justify-center">
            <div
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-2 text-white font-semibold text-sm bg-black/60 px-4 py-2 rounded-full backdrop-blur-sm"
            >
              <Plus className="w-4 h-4" /> Add to cart
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        {product.category && (
          <span className="text-xs font-medium uppercase tracking-wider text-stone-400 mb-1 block">
            {product.category}
          </span>
        )}
        <h3
          className="sf-display font-semibold text-gray-900 mb-1 leading-snug line-clamp-2"
          style={{ fontSize: '1.05rem' }}
        >
          {product.name}
        </h3>
        {product.description && (
          <p className="text-sm text-stone-500 line-clamp-2 mb-3 leading-relaxed">
            {product.description}
          </p>
        )}
        <div className="flex items-center justify-between">
          <span className="sf-display font-bold text-xl" style={{ color: primaryColor }}>
            {formatCurrency(product.price, currency)}
          </span>
          {product.stock > 0 && product.stock <= 10 && (
            <span className="text-xs font-medium text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">
              Only {product.stock} left
            </span>
          )}
        </div>
        {product.averageRating > 0 && (
          <div className="flex items-center gap-1.5 mt-2">
            <Stars rating={product.averageRating} />
            <span className="text-xs text-stone-400">({product.averageRating.toFixed(1)})</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Cart Panel (slide-in right) ──────────────────────────────────────────
function CartPanel({ cart, business, onClose, onUpdateQty, onRemove, onCheckout }) {
  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const tax = business?.taxRate ? subtotal * business.taxRate / 100 : 0;
  const delivery = business?.deliveryFee || 0;
  const total = subtotal + tax + delivery;
  const currency = business?.currency || 'NGN';

  return (
    <>
      <div className="sf-overlay" onClick={onClose} />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="fixed right-0 top-0 bottom-0 bg-white z-[110] flex flex-col shadow-2xl"
        style={{ width: 'min(420px, 100vw)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100">
          <div>
            <h2 className="sf-display font-bold text-xl text-gray-900">Your Cart</h2>
            <p className="text-sm text-stone-400 mt-0.5">
              {cart.reduce((s, i) => s + i.quantity, 0)} item{cart.reduce((s, i) => s + i.quantity, 0) !== 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-stone-500" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          <AnimatePresence>
            {cart.map(item => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20, height: 0 }}
                className="flex gap-3 p-3 bg-stone-50 rounded-2xl"
              >
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-cover rounded-xl flex-shrink-0" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-stone-200 flex items-center justify-center flex-shrink-0">
                    <Package className="w-6 h-6 text-stone-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{item.name}</p>
                  <p className="text-sm font-bold mt-0.5" style={{ color: business?.primaryColor || '#10B981' }}>
                    {formatCurrency(item.price, currency)}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => onUpdateQty(item.id, -1)}
                      className="w-7 h-7 rounded-lg bg-white border border-stone-200 flex items-center justify-center hover:bg-stone-50 transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-sm font-semibold w-5 text-center">{item.quantity}</span>
                    <button
                      onClick={() => onUpdateQty(item.id, 1)}
                      className="w-7 h-7 rounded-lg bg-white border border-stone-200 flex items-center justify-center hover:bg-stone-50 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-col items-end justify-between">
                  <button onClick={() => onRemove(item.id)} className="p-1 hover:text-red-500 transition-colors text-stone-300">
                    <X className="w-4 h-4" />
                  </button>
                  <p className="text-sm font-bold text-gray-900">
                    {formatCurrency(item.price * item.quantity, currency)}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Summary + CTA */}
        <div className="px-6 py-5 border-t border-stone-100 space-y-3">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-stone-600">
              <span>Subtotal</span>
              <span className="font-medium">{formatCurrency(subtotal, currency)}</span>
            </div>
            {tax > 0 && (
              <div className="flex justify-between text-stone-600">
                <span>Tax ({business.taxRate}%)</span>
                <span className="font-medium">{formatCurrency(tax, currency)}</span>
              </div>
            )}
            {delivery > 0 && (
              <div className="flex justify-between text-stone-600">
                <span>Delivery</span>
                <span className="font-medium">{formatCurrency(delivery, currency)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-stone-100">
              <span className="sf-display">Total</span>
              <span>{formatCurrency(total, currency)}</span>
            </div>
          </div>
          <button className="sf-btn-primary w-full justify-center text-base py-4" onClick={onCheckout}>
            Proceed to Checkout <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    </>
  );
}

// ─── Checkout Modal ────────────────────────────────────────────────────────
function CheckoutModal({ cart, business, onClose, onSuccess }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const tax = business?.taxRate ? subtotal * business.taxRate / 100 : 0;
  const delivery = business?.deliveryFee || 0;
  const total = subtotal + tax + delivery;
  const currency = business?.currency || 'NGN';

  const field = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const buildWhatsAppMessage = () => {
    const name = business?.name || 'the store';
    let msg = `🛍️ *New Order — ${form.name}*\n\n`;
    msg += `📱 Phone: ${form.phone}\n`;
    if (form.email) msg += `📧 Email: ${form.email}\n`;
    msg += `📍 Delivery: ${form.address}\n\n`;
    msg += `━━━━━━━━━━━━━\n*Order Items:*\n━━━━━━━━━━━━━\n`;
    cart.forEach((item, i) => {
      msg += `\n${i + 1}. *${item.name}*\n`;
      msg += `   ${item.quantity} × ${formatCurrency(item.price, currency)} = ${formatCurrency(item.price * item.quantity, currency)}\n`;
    });
    msg += `\n━━━━━━━━━━━━━\n`;
    msg += `Subtotal: ${formatCurrency(subtotal, currency)}\n`;
    if (tax > 0) msg += `Tax (${business.taxRate}%): ${formatCurrency(tax, currency)}\n`;
    if (delivery > 0) msg += `Delivery: ${formatCurrency(delivery, currency)}\n`;
    msg += `*TOTAL: ${formatCurrency(total, currency)}*\n`;
    if (form.message) msg += `\n📝 Note: ${form.message}\n`;
    msg += `\nThank you for shopping at *${name}* 🙏`;
    return msg;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!business?.whatsappNumber) {
      toast.error('WhatsApp ordering not configured for this store');
      return;
    }
    setSubmitting(true);
    const msg = buildWhatsAppMessage();
    const clean = business.whatsappNumber.replace(/[^\d+]/g, '');
    window.open(`https://wa.me/${clean}?text=${encodeURIComponent(msg)}`, '_blank');
    setTimeout(() => {
      setSubmitting(false);
      onSuccess();
    }, 500);
  };

  return (
    <>
      <div className="sf-overlay" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="fixed inset-x-4 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 top-6 bottom-6 md:top-8 md:bottom-8 bg-white rounded-3xl shadow-2xl z-[110] flex flex-col overflow-hidden"
        style={{ maxWidth: '520px', width: '100%' }}
      >
        {/* Header */}
        <div
          className="px-7 py-6 flex items-center justify-between flex-shrink-0"
          style={{
            background: `linear-gradient(135deg, ${business?.primaryColor || '#10B981'} 0%, ${business?.secondaryColor || '#F59E0B'} 100%)`
          }}
        >
          <div>
            <h2 className="sf-display text-2xl font-bold text-white">Place Your Order</h2>
            <p className="text-white/80 text-sm mt-0.5">We'll send it straight to WhatsApp</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {/* Order summary strip */}
          <div className="px-7 py-4 bg-stone-50 border-b border-stone-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-stone-500 font-medium">
                {cart.length} item{cart.length !== 1 ? 's' : ''} ·{' '}
                {cart.reduce((s, i) => s + i.quantity, 0)} units
              </span>
              <span className="sf-display font-bold text-lg text-gray-900">
                {formatCurrency(total, currency)}
              </span>
            </div>
          </div>

          <form id="sf-checkout-form" onSubmit={handleSubmit} className="px-7 py-6 space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  className="sf-input"
                  placeholder="John Adeyemi"
                  value={form.name}
                  onChange={field('name')}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">
                  Phone Number <span className="text-red-400">*</span>
                </label>
                <input
                  className="sf-input"
                  type="tel"
                  placeholder="+234 803 000 0000"
                  value={form.phone}
                  onChange={field('phone')}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">
                  Email Address <span className="text-stone-400 font-normal text-xs ml-1">(optional)</span>
                </label>
                <input
                  className="sf-input"
                  type="email"
                  placeholder="john@example.com"
                  value={form.email}
                  onChange={field('email')}
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">
                  Delivery Address <span className="text-red-400">*</span>
                </label>
                <textarea
                  className="sf-input"
                  rows={2}
                  placeholder="22 Broad Street, Ikeja, Lagos"
                  value={form.address}
                  onChange={field('address')}
                  required
                  style={{ resize: 'none' }}
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">
                  Note to Seller <span className="text-stone-400 font-normal text-xs ml-1">(optional)</span>
                </label>
                <textarea
                  className="sf-input"
                  rows={2}
                  placeholder="Any special instructions, colour preference, etc."
                  value={form.message}
                  onChange={field('message')}
                  style={{ resize: 'none' }}
                />
              </div>
            </div>
          </form>
        </div>

        {/* Footer CTA */}
        <div className="px-7 pb-7 pt-4 flex-shrink-0 border-t border-stone-100">
          <button
            form="sf-checkout-form"
            type="submit"
            className="sf-wa-btn"
            disabled={submitting}
          >
            {submitting ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}>
                <Send className="w-5 h-5" />
              </motion.div>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.528 5.854L.057 23.882l6.196-1.623A11.944 11.944 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.893a9.876 9.876 0 01-5.032-1.374l-.362-.214-3.735.979 1.001-3.638-.235-.374A9.847 9.847 0 012.107 12c0-5.454 4.439-9.893 9.893-9.893 5.454 0 9.893 4.439 9.893 9.893S17.454 21.893 12 21.893z"/>
                </svg>
                Send Order on WhatsApp
              </>
            )}
          </button>
          <p className="text-center text-xs text-stone-400 mt-3">
            You'll be redirected to WhatsApp to confirm your order with the seller
          </p>
        </div>
      </motion.div>
    </>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────
const BusinessStorefront = () => {
  useFonts();

  const [business, setBusiness] = useState(null);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const searchRef = useRef(null);

  // Scroll tracking
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 60);
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (showSearch) searchRef.current?.focus();
  }, [showSearch]);

  // ── Redirect helpers ──
  const redirectToMain = () => {
    if (import.meta.env.DEV) {
      window.location.href = window.location.origin;
      return;
    }
    const parts = window.location.hostname.split('.');
    if (parts.length >= 3) {
      const domain = parts.slice(-2).join('.');
      window.location.href = `${window.location.protocol}//${domain}`;
    } else {
      window.location.href = window.location.origin;
    }
  };

  // ── Data fetching ──
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const subdomain = getSubdomain();
        if (!subdomain) { redirectToMain(); return; }

        const [bizRes, prodRes] = await Promise.all([
          api.get(`/api/business/public/${subdomain}`),
          api.get(`/api/business/public/${subdomain}/products`),
        ]);

        if (!bizRes.data.business) { redirectToMain(); return; }
        setBusiness(bizRes.data.business);
        setProducts(prodRes.data.products || []);
      } catch (err) {
        if (err.response?.status === 404) { redirectToMain(); return; }
        toast.error('Failed to load store. Please refresh.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Cart helpers ──
  const addToCart = (product) => {
    setCart(prev => {
      const exists = prev.find(i => i.id === product.id);
      if (exists) return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...product, quantity: 1 }];
    });
    toast.success(`${product.name} added!`, { icon: '🛒', duration: 1500 });
  };

  const updateQty = (id, delta) => {
    setCart(prev =>
      prev.map(i => i.id === id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i)
          .filter(i => i.quantity > 0)
    );
  };

  const removeItem = (id) => {
    setCart(prev => prev.filter(i => i.id !== id));
    toast('Item removed', { icon: '🗑️', duration: 1200 });
  };

  const totalQty = cart.reduce((s, i) => s + i.quantity, 0);

  // ── Filtering ──
  const categories = ['all', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];
  const displayed = products.filter(p => {
    const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
    const matchSearch = !searchQuery
      || p.name.toLowerCase().includes(searchQuery.toLowerCase())
      || p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const primary = business?.primaryColor || '#10B981';
  const secondary = business?.secondaryColor || '#F59E0B';

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: '#F9F7F4' }}>
        <StoreStyles primary="#10B981" secondary="#F59E0B" />
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center mb-4"
        >
          <ShoppingCart className="w-6 h-6 text-white" />
        </motion.div>
        <p className="text-stone-400 font-medium" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          Loading store…
        </p>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F9F7F4' }}>
        <StoreStyles primary="#10B981" secondary="#F59E0B" />
        <div className="text-center">
          <h1 className="sf-display text-3xl font-bold text-gray-900 mb-3">Store Not Found</h1>
          <p className="text-stone-500 mb-6">This business does not exist or is unavailable.</p>
          <button className="sf-btn-primary" onClick={redirectToMain}>Go to Homepage</button>
        </div>
      </div>
    );
  }

  return (
    <div className="sf-root min-h-screen" style={{ background: 'var(--sf-bg)' }}>
      <StoreStyles primary={primary} secondary={secondary} />

      {/* ── Sticky Header ─────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? 'rgba(255,255,255,0.95)' : 'transparent',
          backdropFilter: scrolled ? 'blur(16px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(0,0,0,0.06)' : '1px solid transparent',
          boxShadow: scrolled ? '0 4px 24px rgba(0,0,0,0.06)' : 'none',
        }}
      >
        <div className="max-w-6xl mx-auto px-4 md:px-6 flex items-center justify-between h-16">
          {/* Logo + Name */}
          <div className="flex items-center gap-3 min-w-0">
            {business.logo ? (
              <img src={business.logo} alt={business.name} className="w-9 h-9 rounded-xl object-cover flex-shrink-0" />
            ) : (
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-sm sf-display"
                style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}
              >
                {(business.name || 'B')[0]}
              </div>
            )}
            <span
              className="sf-display font-bold text-gray-900 truncate"
              style={{ fontSize: '1.1rem', maxWidth: '180px' }}
            >
              {business.name}
            </span>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Search toggle */}
            <button
              onClick={() => setShowSearch(s => !s)}
              className="p-2.5 hover:bg-stone-100 rounded-xl transition-colors text-stone-500 hover:text-stone-800"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Owner Login — subtle */}
            <a
              href="/login"
              className="hidden sm:flex items-center gap-1.5 text-sm text-stone-400 hover:text-stone-700 transition-colors px-3 py-2 hover:bg-stone-100 rounded-xl"
            >
              <LogIn className="w-4 h-4" />
              <span>Login</span>
            </a>

            {/* Cart */}
            <button
              onClick={() => totalQty > 0 && setCartOpen(true)}
              className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all"
              style={{
                background: totalQty > 0 ? primary : '#F0EDE8',
                color: totalQty > 0 ? '#fff' : '#9A9089',
              }}
            >
              <ShoppingCart className="w-4.5 h-4.5 w-[18px] h-[18px]" />
              <span className="hidden sm:inline">Cart</span>
              {totalQty > 0 && (
                <motion.span
                  key={totalQty}
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center"
                >
                  {totalQty}
                </motion.span>
              )}
            </button>
          </div>
        </div>

        {/* Search bar */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-stone-100"
              style={{ background: 'white' }}
            >
              <div className="max-w-6xl mx-auto px-4 md:px-6 py-3">
                <input
                  ref={searchRef}
                  className="sf-input"
                  placeholder="Search products…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${primary}18 0%, ${secondary}12 50%, ${primary}08 100%)`,
          borderBottom: `1px solid ${primary}22`,
        }}
      >
        {/* decorative circles */}
        <div
          className="absolute -top-20 -right-20 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ background: primary }}
        />
        <div
          className="absolute -bottom-16 -left-16 w-72 h-72 rounded-full opacity-8 blur-3xl"
          style={{ background: secondary }}
        />

        <div className="relative max-w-6xl mx-auto px-4 md:px-6 py-14 md:py-20">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {/* Logo */}
            {business.logo && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 20 }}
                className="flex-shrink-0"
              >
                <img
                  src={business.logo}
                  alt={business.name}
                  className="w-24 h-24 md:w-32 md:h-32 rounded-3xl object-cover shadow-xl border-4 border-white"
                />
              </motion.div>
            )}

            <div className="flex-1">
              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="sf-display sf-hero-text font-bold text-gray-900 leading-tight mb-3"
                style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)' }}
              >
                {business.name}
              </motion.h1>

              {business.description && (
                <motion.p
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-stone-600 text-lg max-w-xl leading-relaxed mb-4"
                >
                  {business.description}
                </motion.p>
              )}

              {/* Meta info */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex flex-wrap gap-4 text-sm text-stone-500"
              >
                {business.phone && (
                  <a href={`tel:${business.phone}`} className="flex items-center gap-1.5 hover:text-stone-800 transition-colors">
                    <Phone className="w-4 h-4" style={{ color: primary }} />
                    {business.phone}
                  </a>
                )}
                {business.address && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" style={{ color: primary }} />
                    {business.address}
                  </span>
                )}
                {business.businessHours && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" style={{ color: primary }} />
                    {business.businessHours}
                  </span>
                )}
              </motion.div>
            </div>

            {/* WhatsApp CTA */}
            {business.whatsappNumber && totalQty === 0 && (
              <motion.a
                href={`https://wa.me/${business.whatsappNumber.replace(/[^\d+]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="hidden md:flex flex-shrink-0 items-center gap-2 text-white font-semibold px-5 py-3 rounded-2xl transition-all hover:scale-105"
                style={{ background: '#25D366' }}
              >
                <MessageCircle className="w-5 h-5" />
                Chat with us
              </motion.a>
            )}
          </div>
        </div>
      </section>

      {/* ── Category pills ─────────────────────────────────────────────── */}
      {categories.length > 1 && (
        <div className="sticky z-30" style={{ top: '64px', background: 'var(--sf-bg)' }}>
          <div className="max-w-6xl mx-auto px-4 md:px-6">
            <div className="flex gap-2 py-4 overflow-x-auto sf-scroll-hide">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`sf-cat-pill ${selectedCategory === cat ? 'active' : ''}`}
                >
                  {cat === 'all' ? '✦ All Items' : cat}
                </button>
              ))}
            </div>
          </div>
          <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, #E5E0D844, transparent)' }} />
        </div>
      )}

      {/* ── Products ───────────────────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8 pb-24">
        {displayed.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-20 h-20 rounded-3xl bg-stone-100 flex items-center justify-center mx-auto mb-5">
              <Package className="w-9 h-9 text-stone-300" />
            </div>
            <h3 className="sf-display text-2xl font-semibold text-gray-900 mb-2">No products found</h3>
            <p className="text-stone-400 text-base">
              {searchQuery ? 'Try a different search term' : 'No products available yet'}
            </p>
            {searchQuery && (
              <button
                className="mt-4 sf-btn-ghost"
                onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-stone-400 text-sm font-medium">
                {displayed.length} item{displayed.length !== 1 ? 's' : ''}{selectedCategory !== 'all' ? ` in ${selectedCategory}` : ''}
              </p>
            </div>
            <div
              className="sf-products-grid grid gap-5"
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}
            >
              {displayed.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  currency={business.currency || 'NGN'}
                  primaryColor={primary}
                  onAdd={addToCart}
                  cartQty={cart.find(i => i.id === product.id)?.quantity || 0}
                />
              ))}
            </div>
          </>
        )}
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer
        className="border-t border-stone-200 py-10"
        style={{ background: '#1A1A1A' }}
      >
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                {business.logo ? (
                  <img src={business.logo} alt={business.name} className="w-8 h-8 rounded-lg object-cover" />
                ) : (
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold sf-display"
                    style={{ background: primary }}
                  >
                    {(business.name || 'B')[0]}
                  </div>
                )}
                <span className="sf-display font-bold text-white text-lg">{business.name}</span>
              </div>

              {business.footerText && (
                <p className="text-stone-400 text-sm max-w-xs leading-relaxed">{business.footerText}</p>
              )}

              {(business.footerAddress || business.address) && (
                <p className="text-stone-500 text-xs mt-2 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {business.footerAddress || business.address}
                </p>
              )}
            </div>

            {/* Social + contact */}
            <div className="flex flex-col items-start md:items-end gap-3">
              <div className="flex gap-2">
                {business.facebookUrl && (
                  <a href={business.facebookUrl} target="_blank" rel="noopener noreferrer"
                    className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                    <Facebook className="w-4 h-4" />
                  </a>
                )}
                {business.instagramUrl && (
                  <a href={business.instagramUrl} target="_blank" rel="noopener noreferrer"
                    className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                    <Instagram className="w-4 h-4" />
                  </a>
                )}
                {business.twitterUrl && (
                  <a href={business.twitterUrl} target="_blank" rel="noopener noreferrer"
                    className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                    <Twitter className="w-4 h-4" />
                  </a>
                )}
                {business.youtubeUrl && (
                  <a href={business.youtubeUrl} target="_blank" rel="noopener noreferrer"
                    className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                    <Youtube className="w-4 h-4" />
                  </a>
                )}
                {business.whatsappNumber && (
                  <a
                    href={`https://wa.me/${business.whatsappNumber.replace(/[^\d+]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white transition-colors"
                    style={{ background: '#25D366' }}
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                )}
              </div>

              <p className="text-stone-500 text-xs">
                {business.footerCopyright
                  ? business.footerCopyright.replace('{year}', new Date().getFullYear())
                  : `© ${new Date().getFullYear()} ${business.name}. All rights reserved.`}
              </p>
            </div>
          </div>

          {/* Powered by */}
          <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-center gap-2 text-stone-600 text-xs">
            <Sparkles className="w-3 h-3" />
            <span>Powered by</span>
            <a href="https://mypadifood.com" className="text-stone-400 hover:text-stone-200 font-semibold transition-colors">
              MyPadiFood
            </a>
          </div>
        </div>
      </footer>

      {/* ── Floating Cart Button (mobile) ──────────────────────────────── */}
      <AnimatePresence>
        {totalQty > 0 && !cartOpen && !checkoutOpen && (
          <motion.button
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setCartOpen(true)}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 md:hidden z-40 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl text-white font-bold text-base"
            style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}
          >
            <ShoppingCart className="w-5 h-5" />
            View Cart · {totalQty} item{totalQty !== 1 ? 's' : ''}
            <span className="ml-1 opacity-80 font-normal text-sm">
              {formatCurrency(cart.reduce((s, i) => s + i.price * i.quantity, 0), business.currency || 'NGN')}
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Scroll to top */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-6 right-6 w-11 h-11 rounded-2xl bg-white border border-stone-200 flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow z-40"
          >
            <ArrowUp className="w-5 h-5 text-stone-600" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Cart Panel ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {cartOpen && (
          <CartPanel
            cart={cart}
            business={business}
            onClose={() => setCartOpen(false)}
            onUpdateQty={updateQty}
            onRemove={removeItem}
            onCheckout={() => { setCartOpen(false); setCheckoutOpen(true); }}
          />
        )}
      </AnimatePresence>

      {/* ── Checkout Modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {checkoutOpen && (
          <CheckoutModal
            cart={cart}
            business={business}
            onClose={() => setCheckoutOpen(false)}
            onSuccess={() => {
              setCart([]);
              setCheckoutOpen(false);
              toast.success('Order sent! Check WhatsApp.', { duration: 4000 });
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default BusinessStorefront;