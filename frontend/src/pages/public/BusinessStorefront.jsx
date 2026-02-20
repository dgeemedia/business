// frontend/src/pages/public/BusinessStorefront.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  ShoppingCart, Star, Phone, MapPin, Clock, X, Send,
  Plus, Minus, ChevronRight, Facebook, Instagram,
  Twitter, Youtube, LogIn, Search, Sparkles,
  ArrowUp, Package, Moon, Sun, Globe, ChevronDown, ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api, { getSubdomain } from '../../services/api';
import { formatCurrency } from '../../utils/helpers';

function useFonts() {
  useEffect(() => {
    if (document.getElementById('sf-fonts')) return;
    const el = document.createElement('link');
    el.id = 'sf-fonts'; el.rel = 'stylesheet';
    el.href = 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,600;0,9..144,700;1,9..144,400&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap';
    document.head.appendChild(el);
  }, []);
}

// ── Translations ────────────────────────────────────────────────────────────
const T = {
  en: {
    loading: 'Loading store…', notFound: 'Store Not Found',
    notFoundSub: 'This business does not exist or is unavailable.', goHome: 'Go to Homepage',
    cart: 'Cart', viewCart: 'View Cart', allItems: '✦ All Items',
    noProducts: 'No products found', noProductsSub: 'No products available yet',
    trySearch: 'Try a different search term', clearFilters: 'Clear filters',
    searchPlaceholder: 'Search products…', login: 'Login',
    addToCart: 'Add to cart', outOfStock: 'Out of stock', unavailable: 'Unavailable',
    only: 'Only', left: 'left', featured: 'Featured',
    subtotal: 'Subtotal', tax: 'Tax', delivery: 'Delivery', total: 'Total',
    yourCart: 'Your Cart', items: 'items', item: 'item', units: 'units',
    checkout: 'Proceed to Checkout', placeOrder: 'Place Your Order',
    placeOrderSub: "We'll send it straight to WhatsApp",
    fullName: 'Full Name', phone: 'Phone Number', email: 'Email Address',
    deliveryAddr: 'Delivery Address', note: 'Note to Seller',
    optional: 'optional', namePH: 'John Adeyemi', phonePH: '+234 803 000 0000',
    emailPH: 'john@example.com', addrPH: '22 Broad Street, Ikeja, Lagos',
    notePH: 'Any special instructions, colour preference, etc.',
    sendWhatsApp: 'Send Order on WhatsApp',
    redirectNotice: "You'll be redirected to WhatsApp to confirm your order with the seller",
    poweredBy: 'Powered by', heroTagline: 'Always yours.',
    heroReturn: 'Welcome back — your favourites await', heroShop: 'Shop Now',
    chatHelp: 'How can we help you today?',
    wa1: "Hi! I'd like to know more about your products 🛍️",
    wa2: "Is this item in stock? I'd like to order 📦",
    wa3: "What are your delivery options and charges? 🚚",
    wa4: "Can I get a bulk or wholesale discount? 💰",
    wa5: "What's your return or exchange policy? 🔄",
    callUs: 'Call us', chatUs: 'Chat on WhatsApp',
    orderSent: 'Order sent! Check WhatsApp.',
  },
  fr: {
    loading: 'Chargement…', notFound: 'Boutique introuvable',
    notFoundSub: "Cette boutique n'existe pas.", goHome: "Retour à l'accueil",
    cart: 'Panier', viewCart: 'Voir le panier', allItems: '✦ Tous les articles',
    noProducts: 'Aucun produit', noProductsSub: 'Pas encore de produits disponibles',
    trySearch: 'Essayez un autre terme', clearFilters: 'Effacer',
    searchPlaceholder: 'Rechercher…', login: 'Connexion',
    addToCart: 'Ajouter au panier', outOfStock: 'Rupture de stock', unavailable: 'Indisponible',
    only: 'Seulement', left: 'restant', featured: 'Vedette',
    subtotal: 'Sous-total', tax: 'Taxe', delivery: 'Livraison', total: 'Total',
    yourCart: 'Votre Panier', items: 'articles', item: 'article', units: 'unités',
    checkout: 'Passer commande', placeOrder: 'Passer votre commande',
    placeOrderSub: 'Envoi direct sur WhatsApp',
    fullName: 'Nom complet', phone: 'Téléphone', email: 'Email',
    deliveryAddr: 'Adresse de livraison', note: 'Note au vendeur',
    optional: 'optionnel', namePH: 'Jean Dupont', phonePH: '+234 803 000 0000',
    emailPH: 'jean@example.com', addrPH: '22 rue Principale, Lagos',
    notePH: 'Instructions spéciales…',
    sendWhatsApp: 'Envoyer la commande via WhatsApp',
    redirectNotice: 'Vous serez redirigé vers WhatsApp',
    poweredBy: 'Propulsé par', heroTagline: 'Toujours frais. Toujours pour vous.',
    heroReturn: 'Bon retour — vos favoris vous attendent', heroShop: 'Acheter',
    chatHelp: 'Comment pouvons-nous vous aider ?',
    wa1: "Bonjour ! Je voudrais en savoir plus sur vos produits 🛍️",
    wa2: "Cet article est-il en stock ? 📦",
    wa3: "Quelles sont vos options de livraison ? 🚚",
    wa4: "Puis-je obtenir une remise en gros ? 💰",
    wa5: "Quelle est votre politique de retour ? 🔄",
    callUs: 'Appeler', chatUs: 'WhatsApp',
    orderSent: 'Commande envoyée !',
  },
};

// ── CSS ─────────────────────────────────────────────────────────────────────
function StoreStyles({ primary, secondary, dark }) {
  const bg = dark ? '#0F0F0F' : '#F9F7F4';
  const card = dark ? '#1C1C1E' : '#FFFFFF';
  const text = dark ? '#F0EDE8' : '#1A1A1A';
  const muted = dark ? '#888' : '#6B6B6B';
  const border = dark ? 'rgba(255,255,255,0.09)' : '#E5E0D8';
  return <style dangerouslySetInnerHTML={{ __html: `
    .sf-root{font-family:'Plus Jakarta Sans',sans-serif;background:${bg};color:${text};transition:background .3s,color .3s}
    .sf-display{font-family:'Fraunces',serif}
    :root{--sf-p:${primary};--sf-s:${secondary};--sf-bg:${bg};--sf-card:${card};--sf-text:${text};--sf-muted:${muted};--sf-border:${border}}
    .sf-btn-primary{background:var(--sf-p);color:#fff;border:none;border-radius:12px;padding:12px 24px;font-weight:600;font-family:'Plus Jakarta Sans',sans-serif;cursor:pointer;transition:all .2s;display:inline-flex;align-items:center;gap:8px}
    .sf-btn-primary:hover{filter:brightness(.92);transform:translateY(-1px)}
    .sf-btn-primary:disabled{opacity:.5;cursor:not-allowed;transform:none}
    .sf-btn-ghost{background:transparent;color:var(--sf-muted);border:1.5px solid var(--sf-border);border-radius:10px;padding:8px 16px;font-weight:500;font-family:'Plus Jakarta Sans',sans-serif;cursor:pointer;transition:all .2s;display:inline-flex;align-items:center;gap:6px}
    .sf-btn-ghost:hover{border-color:var(--sf-p);color:var(--sf-p)}
    .sf-input{width:100%;padding:12px 16px;border:1.5px solid var(--sf-border);border-radius:12px;font-family:'Plus Jakarta Sans',sans-serif;font-size:15px;background:${dark?'rgba(255,255,255,.06)':card};color:${text};transition:border-color .2s;outline:none;box-sizing:border-box}
    .sf-input:focus{border-color:var(--sf-p)}
    .sf-input::placeholder{color:${dark?'#555':'#B0A89C'}}
    .sf-card{background:${card};border-radius:20px;overflow:hidden;box-shadow:${dark?'0 1px 0 rgba(255,255,255,.06),0 4px 20px rgba(0,0,0,.4)':'0 1px 3px rgba(0,0,0,.06),0 4px 16px rgba(0,0,0,.04)'};transition:box-shadow .25s,transform .25s}
    .sf-card:hover{box-shadow:${dark?'0 4px 8px rgba(0,0,0,.5),0 16px 40px rgba(0,0,0,.5)':'0 4px 8px rgba(0,0,0,.08),0 16px 40px rgba(0,0,0,.08)'};transform:translateY(-3px)}
    .sf-cat-pill{padding:8px 20px;border-radius:100px;font-size:14px;font-weight:500;white-space:nowrap;cursor:pointer;border:1.5px solid transparent;transition:all .2s;background:${dark?'rgba(255,255,255,.08)':'#EEEAE4'};color:${dark?'#ccc':'#5A5046'}}
    .sf-cat-pill.active{background:var(--sf-p);color:white}
    .sf-cat-pill:not(.active):hover{border-color:var(--sf-p);color:var(--sf-p)}
    .sf-badge{display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:100px;font-size:12px;font-weight:600}
    .sf-scroll-hide::-webkit-scrollbar{display:none}.sf-scroll-hide{-ms-overflow-style:none;scrollbar-width:none}
    .sf-wa-btn{background:#25D366;color:white;border:none;border-radius:14px;padding:14px 28px;font-weight:700;font-size:16px;font-family:'Plus Jakarta Sans',sans-serif;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:10px;width:100%}
    .sf-wa-btn:hover{background:#20BD5A;transform:translateY(-1px)}
    .sf-wa-btn:disabled{opacity:.6;cursor:not-allowed;transform:none}
    .sf-overlay{position:fixed;inset:0;background:rgba(10,10,10,.6);backdrop-filter:blur(4px);z-index:100}
    @keyframes sf-bounce-in{0%{transform:scale(.5);opacity:0}60%{transform:scale(1.15)}100%{transform:scale(1);opacity:1}}
    .sf-bounce{animation:sf-bounce-in .35s ease forwards}
    @keyframes sf-wa-pulse{0%,100%{box-shadow:0 0 0 0 rgba(37,211,102,.5)}70%{box-shadow:0 0 0 14px rgba(37,211,102,0)}}
    .sf-wa-pulse{animation:sf-wa-pulse 2s infinite}
    @keyframes sf-phone-ring{0%,100%{box-shadow:0 0 0 0 rgba(59,130,246,.45)}70%{box-shadow:0 0 0 12px rgba(59,130,246,0)}}
    .sf-phone-ring{animation:sf-phone-ring 2.5s infinite}
    @media(max-width:640px){.sf-products-grid{grid-template-columns:repeat(2,1fr)!important;gap:12px!important}.sf-h1{font-size:clamp(1.9rem,7vw,3rem)!important}}
  ` }} />;
}

// ── WhatsApp SVG ─────────────────────────────────────────────────────────────
function WaIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="currentColor">
      <path d="M16 .5C7.44.5.5 7.44.5 16c0 2.83.74 5.5 2.04 7.84L.5 31.5l7.86-2.06A15.45 15.45 0 0016 31.5c8.56 0 15.5-6.94 15.5-15.5S24.56.5 16 .5zm0 28.5a12.9 12.9 0 01-6.6-1.8l-.47-.28-4.66 1.22 1.25-4.55-.31-.5A12.95 12.95 0 013.04 16C3.04 9.37 8.37 4.04 16 4.04S28.96 9.37 28.96 16 23.63 28.96 16 28.96zm7.1-9.76c-.39-.2-2.3-1.14-2.66-1.27-.36-.13-.62-.2-.88.2-.26.39-1 1.27-1.23 1.53-.22.26-.45.29-.84.1a10.64 10.64 0 01-3.14-1.94 11.77 11.77 0 01-2.17-2.7c-.23-.39-.03-.6.17-.8.18-.17.39-.45.59-.68.2-.22.26-.38.39-.64.13-.26.07-.49-.03-.68-.1-.2-.88-2.12-1.2-2.9-.32-.76-.64-.66-.88-.67l-.74-.01c-.26 0-.67.1-1.02.48-.36.38-1.36 1.33-1.36 3.24s1.39 3.76 1.59 4.02c.19.26 2.74 4.18 6.63 5.86.93.4 1.65.64 2.22.82.93.3 1.78.26 2.45.16.75-.11 2.3-.94 2.62-1.84.33-.9.33-1.68.23-1.84-.1-.16-.36-.26-.75-.46z"/>
    </svg>
  );
}

// ── Stars ─────────────────────────────────────────────────────────────────────
function Stars({ rating, dark }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} className={`w-3 h-3 ${i <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : dark ? 'text-white/10 fill-white/10' : 'text-gray-200 fill-gray-200'}`}/>
      ))}
    </span>
  );
}

function ProductImageSlideshow({ product, dark }) {
  // Build flat URL list: prefer images[] relation, fall back to imageUrl string
  const imageList = React.useMemo(() => {
    if (product.images && product.images.length > 0) {
      return product.images
        .slice()
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map(img => img.imageUrl)
        .filter(Boolean);
    }
    if (product.imageUrl) return [product.imageUrl];
    return [];
  }, [product.images, product.imageUrl]);

  const [idx, setIdx] = React.useState(0);
  const [imgErrors, setImgErrors] = React.useState({});

  // Reset index when product changes
  React.useEffect(() => { setIdx(0); setImgErrors({}); }, [product.id]);

  // Auto-advance every 3 s — only when multiple images exist
  React.useEffect(() => {
    if (imageList.length <= 1) return;
    const id = setInterval(() => setIdx(i => (i + 1) % imageList.length), 3000);
    return () => clearInterval(id);        // ✅ clean up on unmount / imageList change
  }, [imageList.length]);

  // Fallback placeholder
  if (imageList.length === 0 || imgErrors[idx]) {
    return (
      <div className="absolute inset-0 flex items-center justify-center"
        style={{ background: dark ? 'rgba(255,255,255,.04)' : 'linear-gradient(135deg,#f3f0ea,#e8e4dc)' }}>
        <Package className="w-10 h-10" style={{ color: dark ? 'rgba(255,255,255,.15)' : '#ccc' }} />
      </div>
    );
  }

  return (
    <>
      {/* Slide images — use key= so React always mounts a fresh img when index changes */}
      <AnimatePresence mode="wait">
        <motion.img
          key={`${product.id}-${idx}`}
          src={imageList[idx]}
          alt={product.name}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          onError={() => setImgErrors(prev => ({ ...prev, [idx]: true }))}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </AnimatePresence>

      {/* Dot indicators — only shown for 2+ images */}
      {imageList.length > 1 && (
        <div
          className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10"
          onClick={e => e.stopPropagation()}   // don't trigger addToCart on dot click
        >
          {imageList.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className="rounded-full transition-all duration-300"
              style={{
                width:  i === idx ? 14 : 5,
                height: 5,
                background: i === idx ? 'white' : 'rgba(255,255,255,.45)',
              }}
            />
          ))}
        </div>
      )}
    </>
  );
}

// ── Product Card ──────────────────────────────────────────────────────────────
function ProductCard({ product, currency, primary, dark, onAdd, cartQty, t }) {
  const isOOS = product.stock === 0, isUnavail = !product.isAvailable;
  return (
    <motion.div layout initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
      className="sf-card group cursor-pointer" onClick={() => !isOOS && !isUnavail && onAdd(product)}>
      <div className="relative overflow-hidden" style={{ paddingTop:'70%' }}>
        <ProductImageSlideshow product={product} dark={dark} />

        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {product.featured && <span className="sf-badge" style={{ background:primary, color:'white', fontSize:'11px' }}><Sparkles className="w-3 h-3"/> {t.featured}</span>}
          {isOOS && <span className="sf-badge bg-red-100 text-red-600">{t.outOfStock}</span>}
          {isUnavail && !isOOS && <span className="sf-badge" style={{ background:dark?'rgba(255,255,255,.1)':'#f3f4f6', color:dark?'#aaa':'#6b7280' }}>{t.unavailable}</span>}
        </div>
        {product.averageRating > 0 && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-semibold text-white z-10">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400"/>{product.averageRating.toFixed(1)}
          </div>
        )}
        {cartQty > 0 && (
          <div className="absolute bottom-6 right-3 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white sf-bounce z-10" style={{ background:primary }}>{cartQty}</div>
        )}
        {!isOOS && !isUnavail && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-all duration-300 flex items-center justify-center z-10">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-2 text-white font-semibold text-sm bg-black/70 px-4 py-2 rounded-full backdrop-blur-sm">
              <Plus className="w-4 h-4"/> {t.addToCart}
            </div>
          </div>
        )}
      </div>
      <div className="p-4">
        {product.category && <span className="text-xs font-medium uppercase tracking-wider mb-1 block" style={{ color:dark?'rgba(255,255,255,.35)':'#a8a099' }}>{product.category}</span>}
        <h3 className="sf-display font-semibold leading-snug line-clamp-2 mb-1" style={{ fontSize:'1.05rem', color:dark?'#f0ede8':'#1a1a1a' }}>{product.name}</h3>
        {product.description && <p className="text-sm line-clamp-2 mb-3 leading-relaxed" style={{ color:dark?'rgba(255,255,255,.45)':'#78716c' }}>{product.description}</p>}
        <div className="flex items-center justify-between">
          <span className="sf-display font-bold text-xl" style={{ color:primary }}>{formatCurrency(product.price, currency)}</span>
          {product.stock > 0 && product.stock <= 10 && <span className="text-xs font-medium text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-full">{t.only} {product.stock} {t.left}</span>}
        </div>
        {product.averageRating > 0 && (
          <div className="flex items-center gap-1.5 mt-2">
            <Stars rating={product.averageRating} dark={dark}/>
            <span className="text-xs" style={{ color:dark?'rgba(255,255,255,.3)':'#a8a099' }}>({product.averageRating.toFixed(1)})</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Cart Panel ────────────────────────────────────────────────────────────────
function CartPanel({ cart, business, dark, primary, onClose, onUpdateQty, onRemove, onCheckout, t }) {
  const currency = business?.currency || 'NGN';
  const subtotal = cart.reduce((s,i)=>s+i.price*i.quantity,0);
  const tax = business?.taxRate ? subtotal*business.taxRate/100 : 0;
  const delivery = business?.deliveryFee || 0;
  const total = subtotal+tax+delivery;
  return (
    <>
      <div className="sf-overlay" onClick={onClose}/>
      <motion.div initial={{ x:'100%' }} animate={{ x:0 }} exit={{ x:'100%' }}
        transition={{ type:'spring', damping:28, stiffness:300 }}
        className="fixed right-0 top-0 bottom-0 z-[110] flex flex-col shadow-2xl"
        style={{ width:'min(420px,100vw)', background:dark?'#1c1c1e':'white' }}>
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom:`1px solid ${dark?'rgba(255,255,255,.07)':'#f1f0ee'}` }}>
          <div>
            <h2 className="sf-display font-bold text-xl" style={{ color:dark?'#f0ede8':'#1a1a1a' }}>{t.yourCart}</h2>
            <p className="text-sm mt-0.5" style={{ color:dark?'rgba(255,255,255,.35)':'#a8a099' }}>
              {cart.reduce((s,i)=>s+i.quantity,0)} {cart.reduce((s,i)=>s+i.quantity,0)!==1?t.items:t.item}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl" style={{ background:dark?'rgba(255,255,255,.06)':'#f5f3f0' }}><X className="w-5 h-5" style={{ color:dark?'#888':'#666' }}/></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          <AnimatePresence>
            {cart.map(item => (
              <motion.div key={item.id} layout initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:20,height:0}}
                className="flex gap-3 p-3 rounded-2xl" style={{ background:dark?'rgba(255,255,255,.05)':'#f9f7f4' }}>
                {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-cover rounded-xl flex-shrink-0"/>
                  : <div className="w-16 h-16 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background:dark?'rgba(255,255,255,.08)':'#e8e4dc' }}><Package className="w-6 h-6" style={{ color:dark?'#555':'#ccc' }}/></div>}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate" style={{ color:dark?'#f0ede8':'#1a1a1a' }}>{item.name}</p>
                  <p className="text-sm font-bold mt-0.5" style={{ color:primary }}>{formatCurrency(item.price,currency)}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {[-1,null,1].map((d,i) => d===null
                      ? <span key="q" className="text-sm font-semibold w-5 text-center">{item.quantity}</span>
                      : <button key={d} onClick={()=>onUpdateQty(item.id,d)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{ background:dark?'rgba(255,255,255,.08)':'white', border:`1px solid ${dark?'rgba(255,255,255,.1)':'#e5e0d8'}` }}>
                          {d<0?<Minus className="w-3 h-3"/>:<Plus className="w-3 h-3"/>}
                        </button>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end justify-between">
                  <button onClick={()=>onRemove(item.id)} className="p-1 text-red-400 hover:text-red-500"><X className="w-4 h-4"/></button>
                  <p className="text-sm font-bold" style={{ color:dark?'#f0ede8':'#1a1a1a' }}>{formatCurrency(item.price*item.quantity,currency)}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <div className="px-6 py-5 space-y-3" style={{ borderTop:`1px solid ${dark?'rgba(255,255,255,.07)':'#f1f0ee'}` }}>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between" style={{ color:dark?'rgba(255,255,255,.5)':'#78716c' }}><span>{t.subtotal}</span><span className="font-medium">{formatCurrency(subtotal,currency)}</span></div>
            {tax>0&&<div className="flex justify-between" style={{ color:dark?'rgba(255,255,255,.5)':'#78716c' }}><span>{t.tax} ({business.taxRate}%)</span><span className="font-medium">{formatCurrency(tax,currency)}</span></div>}
            {delivery>0&&<div className="flex justify-between" style={{ color:dark?'rgba(255,255,255,.5)':'#78716c' }}><span>{t.delivery}</span><span className="font-medium">{formatCurrency(delivery,currency)}</span></div>}
            <div className="flex justify-between text-lg font-bold pt-2" style={{ borderTop:`1px solid ${dark?'rgba(255,255,255,.07)':'#f1f0ee'}`, color:dark?'#f0ede8':'#1a1a1a' }}>
              <span className="sf-display">{t.total}</span><span>{formatCurrency(total,currency)}</span>
            </div>
          </div>
          <button className="sf-btn-primary w-full justify-center text-base py-4" onClick={onCheckout}>{t.checkout} <ChevronRight className="w-5 h-5"/></button>
        </div>
      </motion.div>
    </>
  );
}

// ── Checkout Modal ────────────────────────────────────────────────────────────
// ✅ FIX: Now POSTs to /api/orders/checkout FIRST to register the order in DB,
//         THEN opens WhatsApp. Order is saved + notification is created before WA opens.
function CheckoutModal({ cart, business, dark, primary, secondary, onClose, onSuccess, t }) {
  const [form, setForm] = useState({ name:'', phone:'', email:'', address:'', message:'' });
  const [submitting, setSubmitting] = useState(false);
  const currency = business?.currency || 'NGN';
  const subtotal = cart.reduce((s,i)=>s+i.price*i.quantity,0);
  const tax = business?.taxRate ? subtotal*business.taxRate/100 : 0;
  const delivery = business?.deliveryFee || 0;
  const total = subtotal+tax+delivery;
  const fld = k => e => setForm(f=>({...f,[k]:e.target.value}));

  const buildWhatsAppMsg = () => {
    let m=`🛍️ *New Order — ${form.name}*\n\n📱 Phone: ${form.phone}\n`;
    if(form.email) m+=`📧 Email: ${form.email}\n`;
    m+=`📍 Delivery: ${form.address}\n\n━━━━━━━━━━━━━\n*Order Items:*\n━━━━━━━━━━━━━\n`;
    cart.forEach((item,i)=>{ m+=`\n${i+1}. *${item.name}*\n   ${item.quantity} × ${formatCurrency(item.price,currency)} = ${formatCurrency(item.price*item.quantity,currency)}\n`; });
    m+=`\n━━━━━━━━━━━━━\n${t.subtotal}: ${formatCurrency(subtotal,currency)}\n`;
    if(tax>0) m+=`${t.tax} (${business.taxRate}%): ${formatCurrency(tax,currency)}\n`;
    if(delivery>0) m+=`${t.delivery}: ${formatCurrency(delivery,currency)}\n`;
    m+=`*TOTAL: ${formatCurrency(total,currency)}*\n`;
    if(form.message) m+=`\n📝 Note: ${form.message}\n`;
    m+=`\nThank you for shopping at *${business?.name||'the store'}* 🙏`;
    return m;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if(!business?.whatsappNumber){ toast.error('WhatsApp not configured'); return; }
    setSubmitting(true);

    try {
      // ✅ STEP 1: Save order to DB — this creates the notification too
      await api.post('/api/orders/checkout', {
        customerName: form.name,
        phone: form.phone,
        email: form.email || '',
        address: form.address,
        message: form.message || '',
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity,
        })),
      });
    } catch (err) {
      // Order save failed (e.g. stock issue) — show error, don't open WA
      const msg = err?.response?.data?.error || 'Failed to place order. Please try again.';
      toast.error(msg);
      setSubmitting(false);
      return;
    }

    // ✅ STEP 2: Open WhatsApp with the order summary
    window.open(
      `https://wa.me/${business.whatsappNumber.replace(/[^\d+]/g,'')}?text=${encodeURIComponent(buildWhatsAppMsg())}`,
      '_blank'
    );

    setTimeout(()=>{ setSubmitting(false); onSuccess(); }, 500);
  };

  const inp = { background:dark?'rgba(255,255,255,.06)':'#fefefe', color:dark?'#f0ede8':'#1a1a1a' };
  const lbl = { color:dark?'rgba(255,255,255,.65)':'#374151' };
  return (
    <>
      <div className="sf-overlay" onClick={onClose}/>
      <motion.div initial={{opacity:0,scale:.96,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:.96,y:20}}
        transition={{type:'spring',damping:28,stiffness:300}}
        className="fixed inset-x-4 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 top-6 bottom-6 md:top-8 md:bottom-8 rounded-3xl shadow-2xl z-[110] flex flex-col overflow-hidden"
        style={{ maxWidth:'520px', width:'100%', background:dark?'#1c1c1e':'white' }}>
        <div className="px-7 py-6 flex items-center justify-between flex-shrink-0"
          style={{ background:`linear-gradient(135deg,${primary},${secondary})` }}>
          <div>
            <h2 className="sf-display text-2xl font-bold text-white">{t.placeOrder}</h2>
            <p className="text-white/80 text-sm mt-0.5">{t.placeOrderSub}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"><X className="w-5 h-5 text-white"/></button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="px-7 py-4" style={{ background:dark?'rgba(255,255,255,.03)':'#f9f8f6', borderBottom:`1px solid ${dark?'rgba(255,255,255,.06)':'#f0ede8'}` }}>
            <div className="flex items-center justify-between text-sm">
              <span style={{ color:dark?'rgba(255,255,255,.4)':'#78716c' }}>{cart.length} {cart.length!==1?t.items:t.item} · {cart.reduce((s,i)=>s+i.quantity,0)} {t.units}</span>
              <span className="sf-display font-bold text-lg" style={{ color:dark?'#f0ede8':'#1a1a1a' }}>{formatCurrency(total,currency)}</span>
            </div>
          </div>
          <form id="sf-checkout" onSubmit={handleSubmit} className="px-7 py-6 space-y-4">
            {[
              {k:'name',l:t.fullName,type:'text',ph:t.namePH,req:true},
              {k:'phone',l:t.phone,type:'tel',ph:t.phonePH,req:true},
              {k:'email',l:t.email,type:'email',ph:t.emailPH,req:false},
            ].map(({k,l,type,ph,req})=>(
              <div key={k}>
                <label className="text-sm font-semibold block mb-1.5" style={lbl}>{l} {req?<span className="text-red-400">*</span>:<span className="font-normal text-xs" style={{ color:dark?'#555':'#a8a099' }}>({t.optional})</span>}</label>
                <input className="sf-input" style={inp} type={type} placeholder={ph} value={form[k]} onChange={fld(k)} required={req}/>
              </div>
            ))}
            <div>
              <label className="text-sm font-semibold block mb-1.5" style={lbl}>{t.deliveryAddr} <span className="text-red-400">*</span></label>
              <textarea className="sf-input" style={{...inp,resize:'none'}} rows={2} placeholder={t.addrPH} value={form.address} onChange={fld('address')} required/>
            </div>
            <div>
              <label className="text-sm font-semibold block mb-1.5" style={lbl}>{t.note} <span className="font-normal text-xs" style={{ color:dark?'#555':'#a8a099' }}>({t.optional})</span></label>
              <textarea className="sf-input" style={{...inp,resize:'none'}} rows={2} placeholder={t.notePH} value={form.message} onChange={fld('message')}/>
            </div>
          </form>
        </div>
        <div className="px-7 pb-7 pt-4 flex-shrink-0" style={{ borderTop:`1px solid ${dark?'rgba(255,255,255,.06)':'#f1f0ee'}` }}>
          <button form="sf-checkout" type="submit" className="sf-wa-btn" disabled={submitting}>
            {submitting
              ? <motion.div animate={{rotate:360}} transition={{repeat:Infinity,duration:.8,ease:'linear'}}><Send className="w-5 h-5"/></motion.div>
              : <><WaIcon size={20}/> {t.sendWhatsApp}</>
            }
          </button>
          <p className="text-center text-xs mt-3" style={{ color:dark?'rgba(255,255,255,.25)':'#a8a099' }}>{t.redirectNotice}</p>
        </div>
      </motion.div>
    </>
  );
}

// ── Floating WA + Phone ───────────────────────────────────────────────────────
function FloatingContacts({ business, dark, t }) {
  const [waOpen, setWaOpen] = useState(false);
  const waNum = business?.whatsappNumber?.replace(/[^\d+]/g, '');
  const phone = business?.phone;
  if (!waNum && !phone) return null;
  const preformed = [t.wa1, t.wa2, t.wa3, t.wa4, t.wa5];
  const emojiRe = /\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu;
  return (
    <div className="fixed bottom-24 right-5 z-[90] flex flex-col items-end gap-3">
      <AnimatePresence>
        {waOpen && waNum && (
          <motion.div initial={{opacity:0,scale:.9,y:8}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:.9,y:8}}
            className="rounded-2xl shadow-2xl overflow-hidden mb-1"
            style={{ width:292, background:dark?'#1c1c1e':'white', border:`1px solid ${dark?'rgba(255,255,255,.08)':'#e8e4dc'}` }}>
            <div className="flex items-center justify-between px-4 py-3" style={{ background:'#075E54' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background:'rgba(255,255,255,.2)' }}>
                  <WaIcon size={17}/>
                </div>
                <div>
                  <p className="text-white font-semibold text-sm leading-none">{business?.name}</p>
                  <p className="text-green-200 text-xs mt-0.5">● Online</p>
                </div>
              </div>
              <button onClick={()=>setWaOpen(false)} className="text-white/60 hover:text-white p-1"><X className="w-4 h-4"/></button>
            </div>
            <div className="p-3 space-y-1.5">
              <p className="text-xs font-semibold px-1 mb-2" style={{ color:dark?'rgba(255,255,255,.35)':'#a8a099' }}>{t.chatHelp}</p>
              {preformed.map((msg, i) => {
                const emojis = msg.match(emojiRe) || [];
                const emoji = emojis[emojis.length-1] || '💬';
                const text = msg.replace(emojiRe,'').trim();
                return (
                  <motion.a key={i} href={`https://wa.me/${waNum}?text=${encodeURIComponent(msg)}`}
                    target="_blank" rel="noopener noreferrer"
                    initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} transition={{delay:i*.06}}
                    whileHover={{scale:1.02}} onClick={()=>setWaOpen(false)}
                    className="flex items-center gap-2 w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors"
                    style={{ background:dark?'rgba(255,255,255,.06)':'#f5f3f0' }}>
                    <span className="text-lg flex-shrink-0">{emoji}</span>
                    <span className="text-xs leading-snug" style={{ color:dark?'rgba(255,255,255,.7)':'#4b5563' }}>{text}</span>
                  </motion.a>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {phone && (
        <motion.a href={`tel:${phone}`} whileHover={{scale:1.1}} whileTap={{scale:.95}} title={t.callUs}
          className="w-[52px] h-[52px] rounded-full flex items-center justify-center text-white shadow-xl sf-phone-ring"
          style={{ background:'#3B82F6' }}>
          <Phone className="w-5 h-5"/>
        </motion.a>
      )}
      {waNum && (
        <motion.button onClick={()=>setWaOpen(o=>!o)} whileHover={{scale:1.1}} whileTap={{scale:.95}} title={t.chatUs}
          className="w-[58px] h-[58px] rounded-full flex items-center justify-center text-white shadow-2xl sf-wa-pulse"
          style={{ background:'#25D366' }}>
          <WaIcon size={27}/>
        </motion.button>
      )}
    </div>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────
const HERO_IMGS = [
  'https://images.pexels.com/photos/1128318/pexels-photo-1128318.jpeg?auto=compress&cs=tinysrgb&w=1920',
  'https://images.pexels.com/photos/3769747/pexels-photo-3769747.jpeg?auto=compress&cs=tinysrgb&w=1920',
  'https://images.pexels.com/photos/1024311/pexels-photo-1024311.jpeg?auto=compress&cs=tinysrgb&w=1920',
  'https://images.pexels.com/photos/8363104/pexels-photo-8363104.jpeg?auto=compress&cs=tinysrgb&w=1920',
  'https://images.pexels.com/photos/5632371/pexels-photo-5632371.jpeg?auto=compress&cs=tinysrgb&w=1920',
];
function HeroSection({ business, primary, secondary, t, onShop }) {
  const [imgIdx, setImgIdx] = useState(0);
  useEffect(()=>{ const id=setInterval(()=>setImgIdx(i=>(i+1)%HERO_IMGS.length),5000); return()=>clearInterval(id); },[]);
  return (
    <section className="relative overflow-hidden" style={{ minHeight:'62vh' }}>
      <AnimatePresence mode="wait">
        <motion.div key={imgIdx} initial={{opacity:0,scale:1.08}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:.96}} transition={{duration:1.4}} className="absolute inset-0">
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage:`url(${HERO_IMGS[imgIdx]})` }}/>
          <div className="absolute inset-0" style={{ background:'rgba(0,0,0,.5)' }}/>
          <div className="absolute inset-0" style={{ background:'linear-gradient(to bottom,transparent 35%,rgba(0,0,0,.72) 100%)' }}/>
        </motion.div>
      </AnimatePresence>
      <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-6 py-16 md:py-24 flex flex-col md:flex-row md:items-end gap-8">
        {business.logo && (
          <motion.img initial={{scale:.8,opacity:0}} animate={{scale:1,opacity:1}} transition={{type:'spring',damping:20}}
            src={business.logo} alt={business.name}
            className="w-24 h-24 md:w-28 md:h-28 rounded-3xl object-cover shadow-2xl flex-shrink-0"
            style={{ border:'4px solid rgba(255,255,255,.25)' }}/>
        )}
        <div className="flex-1">
          <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 text-sm font-semibold text-white"
            style={{ background:'rgba(255,255,255,.15)', backdropFilter:'blur(12px)', border:'1px solid rgba(255,255,255,.25)' }}>
            <Sparkles className="w-4 h-4 text-amber-300"/> {t.heroReturn}
          </motion.div>
          <motion.h1 initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:.1}}
            className="sf-display sf-h1 font-bold text-white leading-tight mb-2 drop-shadow-lg"
            style={{ fontSize:'clamp(2.2rem,5vw,3.8rem)' }}>
            {business.name}
          </motion.h1>
          <motion.p initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:.16}}
            className="sf-display text-white/75 italic mb-4" style={{ fontSize:'1.15rem' }}>
            "{t.heroTagline}"
          </motion.p>
          {business.description && (
            <motion.p initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:.22}}
              className="text-white/65 text-base max-w-lg leading-relaxed mb-5">
              {business.description}
            </motion.p>
          )}
          <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.28}} className="flex flex-wrap gap-4 mb-6 text-sm text-white/65">
            {business.phone && <a href={`tel:${business.phone}`} className="flex items-center gap-1.5 hover:text-white transition-colors"><Phone className="w-4 h-4 text-emerald-400"/> {business.phone}</a>}
            {business.address && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-rose-400"/> {business.address}</span>}
            {business.businessHours && <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-amber-400"/> {business.businessHours}</span>}
          </motion.div>
          <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:.34}} className="flex gap-3 flex-wrap">
            <button onClick={onShop}
              className="px-7 py-3.5 rounded-2xl font-bold text-white transition-all hover:scale-105 shadow-lg"
              style={{ background:`linear-gradient(135deg,${primary},${secondary})` }}>
              {t.heroShop} →
            </button>
            {business.whatsappNumber && (
              <a href={`https://wa.me/${business.whatsappNumber.replace(/[^\d+]/g,'')}`} target="_blank" rel="noopener noreferrer"
                className="px-7 py-3.5 rounded-2xl font-bold text-white flex items-center gap-2 hover:scale-105 transition-all"
                style={{ background:'rgba(255,255,255,.15)', backdropFilter:'blur(12px)', border:'1px solid rgba(255,255,255,.3)' }}>
                <WaIcon size={18}/> Chat
              </a>
            )}
          </motion.div>
        </div>
      </div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
        {HERO_IMGS.map((_,i)=>(
          <button key={i} onClick={()=>setImgIdx(i)}
            className="rounded-full transition-all duration-300"
            style={{ width:i===imgIdx?20:6, height:6, background:i===imgIdx?primary:'rgba(255,255,255,.35)' }}/>
        ))}
      </div>
    </section>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
const BusinessStorefront = () => {
  useFonts();
  const [business, setBusiness] = useState(null);
  const [products, setProducts] = useState([]);
  const [cart, setCart]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showTop, setShowTop]   = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [lang, setLang]         = useState('en');
  const [langOpen, setLangOpen] = useState(false);
  const searchRef   = useRef(null);
  const productsRef = useRef(null);
  const t = T[lang];

  useEffect(()=>{ const s=localStorage.getItem('sf-theme'); if(s==='dark') setDarkMode(true); },[]);
  useEffect(()=>{ localStorage.setItem('sf-theme',darkMode?'dark':'light'); },[darkMode]);

  useEffect(()=>{
    const fn=()=>{ setScrolled(window.scrollY>60); setShowTop(window.scrollY>400); };
    window.addEventListener('scroll',fn,{passive:true}); return()=>window.removeEventListener('scroll',fn);
  },[]);
  useEffect(()=>{ if(showSearch) searchRef.current?.focus(); },[showSearch]);

  const redirectToMain = ()=>{
    if(import.meta.env.DEV){ window.location.href=window.location.origin; return; }
    const p=window.location.hostname.split('.');
    window.location.href=p.length>=3?`${window.location.protocol}//${p.slice(-2).join('.')}`:window.location.origin;
  };

  useEffect(()=>{
    (async()=>{
      try{
        setLoading(true);
        const sub=getSubdomain(); if(!sub){ redirectToMain(); return; }
        const [b,p]=await Promise.all([
          api.get(`/api/business/public/${sub}`),
          api.get(`/api/business/public/${sub}/products`),
        ]);
        if(!b.data.business){ redirectToMain(); return; }
        setBusiness(b.data.business);
        setProducts(p.data.products||[]);
        if(b.data.business.language && T[b.data.business.language]) setLang(b.data.business.language);
      }catch(e){
        if(e.response?.status===404){ redirectToMain(); return; }
        toast.error('Failed to load store.');
      }
      finally{ setLoading(false); }
    })();
  },[]);

  const addToCart = prod => {
    setCart(prev=>{ const ex=prev.find(i=>i.id===prod.id); return ex?prev.map(i=>i.id===prod.id?{...i,quantity:i.quantity+1}:i):[...prev,{...prod,quantity:1}]; });
    toast.success(`${prod.name} added!`,{icon:'🛒',duration:1500});
  };
  const updateQty = (id,d)=>setCart(prev=>prev.map(i=>i.id===id?{...i,quantity:Math.max(0,i.quantity+d)}:i).filter(i=>i.quantity>0));
  const removeItem= id=>{ setCart(prev=>prev.filter(i=>i.id!==id)); toast('Removed',{icon:'🗑️',duration:1200}); };
  const totalQty  = cart.reduce((s,i)=>s+i.quantity,0);

  const categories= ['all',...Array.from(new Set(products.map(p=>p.category).filter(Boolean)))];
  const displayed = products.filter(p=>{
    const mc=selectedCategory==='all'||p.category===selectedCategory;
    const ms=!searchQuery||p.name.toLowerCase().includes(searchQuery.toLowerCase())||p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return mc&&ms;
  });

  const primary   = business?.primaryColor   || '#10B981';
  const secondary = business?.secondaryColor || '#F59E0B';
  const hdrTextColor = scrolled?(darkMode?'#f0ede8':'#1a1a1a'):'#fff';
  const LANGS = { en:{name:'English',flag:'🇬🇧'}, fr:{name:'Français',flag:'🇫🇷'} };

  if(loading) return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:darkMode?'#0f0f0f':'#F9F7F4' }}>
      <StoreStyles primary="#10B981" secondary="#F59E0B" dark={darkMode}/>
      <motion.div animate={{scale:[1,1.15,1],opacity:[.5,1,.5]}} transition={{repeat:Infinity,duration:1.5}}
        className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center mb-4">
        <ShoppingCart className="w-6 h-6 text-white"/>
      </motion.div>
      <p style={{ fontFamily:'Plus Jakarta Sans,sans-serif', color:darkMode?'#555':'#a8a099' }}>{t.loading}</p>
    </div>
  );
  if(!business) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:darkMode?'#0f0f0f':'#F9F7F4' }}>
      <StoreStyles primary="#10B981" secondary="#F59E0B" dark={darkMode}/>
      <div className="text-center">
        <h1 className="sf-display text-3xl font-bold mb-3" style={{ color:darkMode?'#f0ede8':'#1a1a1a' }}>{t.notFound}</h1>
        <p className="mb-6" style={{ color:darkMode?'#555':'#a8a099' }}>{t.notFoundSub}</p>
        <button className="sf-btn-primary" onClick={redirectToMain}>{t.goHome}</button>
      </div>
    </div>
  );

  return (
    <div className="sf-root min-h-screen">
      <StoreStyles primary={primary} secondary={secondary} dark={darkMode}/>

      {/* HEADER */}
      <header className="sticky top-0 z-50 transition-all duration-300"
        style={{ background:scrolled?(darkMode?'rgba(15,15,15,.95)':'rgba(255,255,255,.95)'):'transparent',
          backdropFilter:scrolled?'blur(16px)':'none',
          borderBottom:`1px solid ${scrolled?(darkMode?'rgba(255,255,255,.08)':'rgba(0,0,0,.07)'):'transparent'}`,
          boxShadow:scrolled?'0 4px 24px rgba(0,0,0,.08)':'none' }}>
        <div className="max-w-6xl mx-auto px-4 md:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-3 min-w-0">
            {business.logo
              ? <img src={business.logo} alt={business.name} className="w-9 h-9 rounded-xl object-cover flex-shrink-0"/>
              : <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-bold text-sm sf-display"
                  style={{ background:`linear-gradient(135deg,${primary},${secondary})` }}>{(business.name||'B')[0]}</div>
            }
            <span className="sf-display font-bold truncate" style={{ fontSize:'1.1rem', maxWidth:160, color:hdrTextColor }}>{business.name}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button onClick={()=>setShowSearch(s=>!s)} className="p-2.5 rounded-xl transition-colors"
              style={{ color:hdrTextColor, opacity:.8, background:showSearch?(darkMode?'rgba(255,255,255,.08)':'rgba(0,0,0,.06)'):'transparent' }}>
              <Search className="w-5 h-5"/>
            </button>

            <div className="relative">
              <button onClick={()=>setLangOpen(o=>!o)}
                className="flex items-center gap-1 px-2.5 py-2 rounded-xl transition-colors text-sm font-medium"
                style={{ color:hdrTextColor, opacity:.85 }}>
                <Globe className="w-4 h-4"/>
                <span className="text-base">{LANGS[lang].flag}</span>
                <ChevronDown className="w-3 h-3"/>
              </button>
              <AnimatePresence>
                {langOpen && (
                  <motion.div initial={{opacity:0,y:-8,scale:.95}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:-8,scale:.95}}
                    className="absolute right-0 mt-2 rounded-xl shadow-2xl overflow-hidden z-50"
                    style={{ width:152, background:darkMode?'#1c1c1e':'white', border:`1px solid ${darkMode?'rgba(255,255,255,.08)':'#e8e4dc'}` }}>
                    {Object.entries(LANGS).map(([code,l])=>(
                      <button key={code} onClick={()=>{setLang(code);setLangOpen(false);}}
                        className="w-full px-4 py-3 text-left flex items-center gap-2.5 text-sm transition-colors"
                        style={{ background:lang===code?(darkMode?'rgba(255,255,255,.08)':'#f5f3f0'):'transparent', color:darkMode?'#e0ddd8':'#374151', fontWeight:lang===code?600:400 }}>
                        <span className="text-lg">{l.flag}</span>{l.name}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button onClick={()=>setDarkMode(d=>!d)} className="p-2.5 rounded-xl transition-all"
              style={{ background:darkMode?'#F59E0B':'rgba(255,255,255,.15)', color:darkMode?'#1a1a1a':'#fff' }}>
              <motion.div animate={{rotate:darkMode?180:0}} transition={{duration:.3}}>
                {darkMode?<Sun className="w-[18px] h-[18px]"/>:<Moon className="w-[18px] h-[18px]"/>}
              </motion.div>
            </button>

            <a href="/login" className="hidden sm:flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl font-medium"
              style={{ color:hdrTextColor, opacity:.5 }}>
              <LogIn className="w-4 h-4"/> {t.login}
            </a>

            <button onClick={()=>totalQty>0&&setCartOpen(true)}
              className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all"
              style={{ background:totalQty>0?primary:(darkMode?'rgba(255,255,255,.08)':'rgba(0,0,0,.07)'), color:totalQty>0?'#fff':(darkMode?'rgba(255,255,255,.35)':'#9A9089') }}>
              <ShoppingCart className="w-[18px] h-[18px]"/>
              <span className="hidden sm:inline">{t.cart}</span>
              {totalQty>0&&(
                <motion.span key={totalQty} initial={{scale:.5}} animate={{scale:1}}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                  {totalQty}
                </motion.span>
              )}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showSearch && (
            <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}}
              className="overflow-hidden"
              style={{ borderTop:`1px solid ${darkMode?'rgba(255,255,255,.06)':'#f1f0ee'}`, background:darkMode?'#1c1c1e':'white' }}>
              <div className="max-w-6xl mx-auto px-4 md:px-6 py-3">
                <input ref={searchRef} className="sf-input" placeholder={t.searchPlaceholder}
                  value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}/>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <HeroSection business={business} primary={primary} secondary={secondary} t={t}
        onShop={()=>productsRef.current?.scrollIntoView({behavior:'smooth',block:'start'})}/>

      {categories.length > 1 && (
        <div className="sticky z-30 transition-colors" style={{ top:64, background:darkMode?'#0f0f0f':'#F9F7F4' }}>
          <div className="max-w-6xl mx-auto px-4 md:px-6">
            <div className="flex gap-2 py-4 overflow-x-auto sf-scroll-hide">
              {categories.map(cat=>(
                <button key={cat} onClick={()=>setSelectedCategory(cat)} className={`sf-cat-pill ${selectedCategory===cat?'active':''}`}>
                  {cat==='all'?t.allItems:cat}
                </button>
              ))}
            </div>
          </div>
          <div style={{ height:1, background:darkMode?'rgba(255,255,255,.04)':'rgba(0,0,0,.04)' }}/>
        </div>
      )}

      <main ref={productsRef} className="max-w-6xl mx-auto px-4 md:px-6 py-8 pb-32">
        {displayed.length===0 ? (
          <div className="text-center py-24">
            <div className="w-20 h-20 rounded-3xl mx-auto mb-5 flex items-center justify-center"
              style={{ background:darkMode?'rgba(255,255,255,.05)':'#f0ede8' }}>
              <Package className="w-9 h-9" style={{ color:darkMode?'rgba(255,255,255,.15)':'#ccc' }}/>
            </div>
            <h3 className="sf-display text-2xl font-semibold mb-2" style={{ color:darkMode?'#f0ede8':'#1a1a1a' }}>{t.noProducts}</h3>
            <p style={{ color:darkMode?'#555':'#a8a099' }}>{searchQuery?t.trySearch:t.noProductsSub}</p>
            {searchQuery&&<button className="mt-4 sf-btn-ghost" onClick={()=>{setSearchQuery('');setSelectedCategory('all');}}>{t.clearFilters}</button>}
          </div>
        ) : (
          <>
            <p className="text-sm font-medium mb-6" style={{ color:darkMode?'rgba(255,255,255,.3)':'#a8a099' }}>
              {displayed.length} {displayed.length!==1?t.items:t.item}{selectedCategory!=='all'?` — ${selectedCategory}`:''}
            </p>
            <div className="sf-products-grid grid gap-5" style={{ gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))' }}>
              {displayed.map(product=>(
                <ProductCard key={product.id} product={product} currency={business.currency||'NGN'}
                  primary={primary} dark={darkMode} t={t} onAdd={addToCart}
                  cartQty={cart.find(i=>i.id===product.id)?.quantity||0}/>
              ))}
            </div>
          </>
        )}
      </main>

      <footer style={{ background:'#111111', borderTop:'1px solid rgba(255,255,255,.06)' }}>
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-10">
          <div className="flex flex-col md:flex-row justify-between gap-8">
            <div>
              <div className="flex items-center gap-3 mb-3">
                {business.logo?<img src={business.logo} alt="" className="w-8 h-8 rounded-lg object-cover"/>
                  :<div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold sf-display" style={{ background:primary }}>{(business.name||'B')[0]}</div>}
                <span className="sf-display font-bold text-white text-lg">{business.name}</span>
              </div>
              {business.footerText&&<p className="text-sm leading-relaxed max-w-xs" style={{ color:'rgba(255,255,255,.4)' }}>{business.footerText}</p>}
              {(business.footerAddress||business.address)&&<p className="text-xs mt-2 flex items-center gap-1.5" style={{ color:'rgba(255,255,255,.3)' }}><MapPin className="w-3 h-3"/>{business.footerAddress||business.address}</p>}
            </div>
            <div className="flex flex-col items-start md:items-end gap-3">
              <div className="flex gap-2 flex-wrap">
                {[[business.facebookUrl,Facebook],[business.instagramUrl,Instagram],[business.twitterUrl,Twitter],[business.youtubeUrl,Youtube]].filter(([u])=>u).map(([url,Icon],i)=>(
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white hover:scale-110 transition-transform"
                    style={{ background:'rgba(255,255,255,.08)' }}><Icon className="w-4 h-4"/></a>
                ))}
                {business.whatsappNumber&&(
                  <a href={`https://wa.me/${business.whatsappNumber.replace(/[^\d+]/g,'')}`} target="_blank" rel="noopener noreferrer"
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white hover:scale-110 transition-transform"
                    style={{ background:'#25D366' }}><WaIcon size={16}/></a>
                )}
              </div>
              <p className="text-xs" style={{ color:'rgba(255,255,255,.2)' }}>
                {business.footerCopyright?business.footerCopyright.replace('{year}',new Date().getFullYear()):`© ${new Date().getFullYear()} ${business.name}. All rights reserved.`}
              </p>
            </div>
          </div>
          <div className="mt-8 pt-6 flex items-center justify-center gap-2 text-xs" style={{ borderTop:'1px solid rgba(255,255,255,.05)', color:'rgba(255,255,255,.2)' }}>
            <Sparkles className="w-3 h-3"/> {t.poweredBy}
            <a href="https://mypadifood.com" className="hover:text-white transition-colors font-semibold" style={{ color:'rgba(255,255,255,.35)' }}>MyPadiFood</a>
          </div>
        </div>
      </footer>

      <AnimatePresence>
        {totalQty>0&&!cartOpen&&!checkoutOpen&&(
          <motion.button initial={{y:80,opacity:0}} animate={{y:0,opacity:1}} exit={{y:80,opacity:0}}
            whileHover={{scale:1.04}} whileTap={{scale:.97}}
            onClick={()=>setCartOpen(true)}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 md:hidden z-40 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl text-white font-bold text-base"
            style={{ background:`linear-gradient(135deg,${primary},${secondary})` }}>
            <ShoppingCart className="w-5 h-5"/>
            {t.viewCart} · {totalQty}
            <span className="opacity-75 font-normal text-sm">{formatCurrency(cart.reduce((s,i)=>s+i.price*i.quantity,0),business.currency||'NGN')}</span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTop&&(
          <motion.button initial={{opacity:0,scale:.8}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:.8}}
            onClick={()=>window.scrollTo({top:0,behavior:'smooth'})}
            className="fixed bottom-6 right-20 w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg z-40"
            style={{ background:darkMode?'#1c1c1e':'white', border:`1px solid ${darkMode?'rgba(255,255,255,.08)':'#e8e4dc'}` }}>
            <ArrowUp className="w-5 h-5" style={{ color:darkMode?'#888':'#555' }}/>
          </motion.button>
        )}
      </AnimatePresence>

      <FloatingContacts business={business} dark={darkMode} t={t}/>

      <AnimatePresence>
        {cartOpen&&<CartPanel cart={cart} business={business} dark={darkMode} primary={primary}
          onClose={()=>setCartOpen(false)} onUpdateQty={updateQty} onRemove={removeItem}
          onCheckout={()=>{setCartOpen(false);setCheckoutOpen(true);}} t={t}/>}
      </AnimatePresence>
      <AnimatePresence>
        {checkoutOpen&&<CheckoutModal cart={cart} business={business} dark={darkMode} primary={primary} secondary={secondary}
          onClose={()=>setCheckoutOpen(false)}
          onSuccess={()=>{setCart([]);setCheckoutOpen(false);toast.success(t.orderSent,{duration:4000});}} t={t}/>}
      </AnimatePresence>
    </div>
  );
};

export default BusinessStorefront;