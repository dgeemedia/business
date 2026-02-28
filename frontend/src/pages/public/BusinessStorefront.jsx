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
import { WaIcon } from '../../components/public/WaIcon';
import api, { getSubdomain } from '../../services/api';
import { formatCurrency } from '../../utils/helpers';
import { T } from '../../utils/translations';
import { LANGS } from '../../utils/constants';
import { useFonts } from '../../hooks/useFonts';
import { StoreStyles } from '../../components/public/StoreStyles';
import { HeroSection } from '../../components/public/HeroSection';
import { ProductCard } from '../../components/public/ProductCard';
import { CartPanel } from '../../components/public/CartPanel';
import { CheckoutModal } from '../../components/public/CheckoutModal';
import { FloatingContacts } from '../../components/public/FloatingContacts';

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
  const [showTop, setShowTop] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [lang, setLang] = useState('en');
  const [langOpen, setLangOpen] = useState(false);

  const searchRef = useRef(null);
  const productsRef = useRef(null);
  const t = T[lang];

  // Theme persistence
  useEffect(() => {
    const saved = localStorage.getItem('sf-theme');
    if (saved === 'dark') setDarkMode(true);
  }, []);
  useEffect(() => {
    localStorage.setItem('sf-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Scroll effects
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 60);
      setShowTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (showSearch) searchRef.current?.focus();
  }, [showSearch]);

  // Redirect to main domain if subdomain invalid
  const redirectToMain = () => {
    if (import.meta.env.DEV) {
      window.location.href = window.location.origin;
      return;
    }
    const parts = window.location.hostname.split('.');
    window.location.href =
      parts.length >= 3
        ? `${window.location.protocol}//${parts.slice(-2).join('.')}`
        : window.location.origin;
  };

  // Fetch business and products
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const sub = getSubdomain();
        if (!sub) {
          redirectToMain();
          return;
        }
        const [b, p] = await Promise.all([
          api.get(`/api/business/public/${sub}`),
          api.get(`/api/business/public/${sub}/products`),
        ]);
        if (!b.data.business) {
          redirectToMain();
          return;
        }
        setBusiness(b.data.business);
        setProducts(p.data.products || []);
        if (b.data.business.language && T[b.data.business.language]) {
          setLang(b.data.business.language);
        }
      } catch (e) {
        if (e.response?.status === 404) {
          redirectToMain();
          return;
        }
        toast.error('Failed to load store.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Cart actions
  const addToCart = prod => {
    setCart(prev => {
      const existing = prev.find(i => i.id === prod.id);
      if (existing) {
        return prev.map(i => (i.id === prod.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { ...prod, quantity: 1 }];
    });
    toast.success(`${prod.name} added!`, { icon: '🛒', duration: 1500 });
  };

  const updateQty = (id, delta) => {
    setCart(prev =>
      prev
        .map(i => (i.id === id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i))
        .filter(i => i.quantity > 0)
    );
  };

  const removeItem = id => {
    setCart(prev => prev.filter(i => i.id !== id));
    toast('Removed', { icon: '🗑️', duration: 1200 });
  };

  const totalQty = cart.reduce((s, i) => s + i.quantity, 0);

  // Filtering
  const categories = ['all', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];
  const displayed = products.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const primary = business?.primaryColor || '#10B981';
  const secondary = business?.secondaryColor || '#F59E0B';
  const headerTextColor = scrolled ? (darkMode ? '#f0ede8' : '#1a1a1a') : '#fff';

  // Loading / error screens
  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: darkMode ? '#0f0f0f' : '#F9F7F4',
        }}
      >
        <StoreStyles primary="#10B981" secondary="#F59E0B" dark={darkMode} />
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center mb-4"
        >
          <ShoppingCart className="w-6 h-6 text-white" />
        </motion.div>
        <p style={{ fontFamily: 'Plus Jakarta Sans,sans-serif', color: darkMode ? '#555' : '#a8a099' }}>
          {t.loading}
        </p>
      </div>
    );
  }

  if (!business) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: darkMode ? '#0f0f0f' : '#F9F7F4',
        }}
      >
        <StoreStyles primary="#10B981" secondary="#F59E0B" dark={darkMode} />
        <div className="text-center">
          <h1 className="sf-display text-3xl font-bold mb-3" style={{ color: darkMode ? '#f0ede8' : '#1a1a1a' }}>
            {t.notFound}
          </h1>
          <p className="mb-6" style={{ color: darkMode ? '#555' : '#a8a099' }}>
            {t.notFoundSub}
          </p>
          <button className="sf-btn-primary" onClick={redirectToMain}>
            {t.goHome}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="sf-root min-h-screen">
      <StoreStyles primary={primary} secondary={secondary} dark={darkMode} />

      {/* HEADER */}
      <header
        className="sticky top-0 z-50 transition-all duration-300"
        style={{
          background: scrolled
            ? darkMode
              ? 'rgba(15,15,15,.95)'
              : 'rgba(255,255,255,.95)'
            : 'transparent',
          backdropFilter: scrolled ? 'blur(16px)' : 'none',
          borderBottom: `1px solid ${
            scrolled
              ? darkMode
                ? 'rgba(255,255,255,.08)'
                : 'rgba(0,0,0,.07)'
              : 'transparent'
          }`,
          boxShadow: scrolled ? '0 4px 24px rgba(0,0,0,.08)' : 'none',
        }}
      >
        <div className="max-w-6xl mx-auto px-4 md:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-3 min-w-0">
            {business.logo ? (
              <img
                src={business.logo}
                alt={business.name}
                className="w-9 h-9 rounded-xl object-cover flex-shrink-0"
              />
            ) : (
              <div
                className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-bold text-sm sf-display"
                style={{ background: `linear-gradient(135deg,${primary},${secondary})` }}
              >
                {(business.name || 'B')[0]}
              </div>
            )}
            <span
              className="sf-display font-bold truncate"
              style={{ fontSize: '1.1rem', maxWidth: 160, color: headerTextColor }}
            >
              {business.name}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowSearch(s => !s)}
              className="p-2.5 rounded-xl transition-colors"
              style={{
                color: headerTextColor,
                opacity: 0.8,
                background: showSearch
                  ? darkMode
                    ? 'rgba(255,255,255,.08)'
                    : 'rgba(0,0,0,.06)'
                  : 'transparent',
              }}
            >
              <Search className="w-5 h-5" />
            </button>

            <div className="relative">
              <button
                onClick={() => setLangOpen(o => !o)}
                className="flex items-center gap-1 px-2.5 py-2 rounded-xl transition-colors text-sm font-medium"
                style={{ color: headerTextColor, opacity: 0.85 }}
              >
                <Globe className="w-4 h-4" />
                <span className="text-base">{LANGS[lang].flag}</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              <AnimatePresence>
                {langOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    className="absolute right-0 mt-2 rounded-xl shadow-2xl overflow-hidden z-50"
                    style={{
                      width: 152,
                      background: darkMode ? '#1c1c1e' : 'white',
                      border: `1px solid ${darkMode ? 'rgba(255,255,255,.08)' : '#e8e4dc'}`,
                    }}
                  >
                    {Object.entries(LANGS).map(([code, l]) => (
                      <button
                        key={code}
                        onClick={() => {
                          setLang(code);
                          setLangOpen(false);
                        }}
                        className="w-full px-4 py-3 text-left flex items-center gap-2.5 text-sm transition-colors"
                        style={{
                          background:
                            lang === code
                              ? darkMode
                                ? 'rgba(255,255,255,.08)'
                                : '#f5f3f0'
                              : 'transparent',
                          color: darkMode ? '#e0ddd8' : '#374151',
                          fontWeight: lang === code ? 600 : 400,
                        }}
                      >
                        <span className="text-lg">{l.flag}</span>
                        {l.name}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={() => setDarkMode(d => !d)}
              className="p-2.5 rounded-xl transition-all"
              style={{
                background: darkMode ? '#F59E0B' : 'rgba(255,255,255,.15)',
                color: darkMode ? '#1a1a1a' : '#fff',
              }}
            >
              <motion.div animate={{ rotate: darkMode ? 180 : 0 }} transition={{ duration: 0.3 }}>
                {darkMode ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
              </motion.div>
            </button>

            <a
              href="/login"
              className="hidden sm:flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl font-medium"
              style={{ color: headerTextColor, opacity: 0.5 }}
            >
              <LogIn className="w-4 h-4" /> {t.login}
            </a>

            <button
              onClick={() => totalQty > 0 && setCartOpen(true)}
              className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all"
              style={{
                background:
                  totalQty > 0
                    ? primary
                    : darkMode
                    ? 'rgba(255,255,255,.08)'
                    : 'rgba(0,0,0,.07)',
                color:
                  totalQty > 0
                    ? '#fff'
                    : darkMode
                    ? 'rgba(255,255,255,.35)'
                    : '#9A9089',
              }}
            >
              <ShoppingCart className="w-[18px] h-[18px]" />
              <span className="hidden sm:inline">{t.cart}</span>
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

        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
              style={{
                borderTop: `1px solid ${darkMode ? 'rgba(255,255,255,.06)' : '#f1f0ee'}`,
                background: darkMode ? '#1c1c1e' : 'white',
              }}
            >
              <div className="max-w-6xl mx-auto px-4 md:px-6 py-3">
                <input
                  ref={searchRef}
                  className="sf-input"
                  placeholder={t.searchPlaceholder}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <HeroSection
        business={business}
        primary={primary}
        secondary={secondary}
        t={t}
        onShop={() => productsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
      />

      {categories.length > 1 && (
        <div className="sticky z-30 transition-colors" style={{ top: 64, background: darkMode ? '#0f0f0f' : '#F9F7F4' }}>
          <div className="max-w-6xl mx-auto px-4 md:px-6">
            <div className="flex gap-2 py-4 overflow-x-auto sf-scroll-hide">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`sf-cat-pill ${selectedCategory === cat ? 'active' : ''}`}
                >
                  {cat === 'all' ? t.allItems : cat}
                </button>
              ))}
            </div>
          </div>
          <div style={{ height: 1, background: darkMode ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.04)' }} />
        </div>
      )}

      <main ref={productsRef} className="max-w-6xl mx-auto px-4 md:px-6 py-8 pb-32">
        {displayed.length === 0 ? (
          <div className="text-center py-24">
            <div
              className="w-20 h-20 rounded-3xl mx-auto mb-5 flex items-center justify-center"
              style={{ background: darkMode ? 'rgba(255,255,255,.05)' : '#f0ede8' }}
            >
              <Package className="w-9 h-9" style={{ color: darkMode ? 'rgba(255,255,255,.15)' : '#ccc' }} />
            </div>
            <h3 className="sf-display text-2xl font-semibold mb-2" style={{ color: darkMode ? '#f0ede8' : '#1a1a1a' }}>
              {t.noProducts}
            </h3>
            <p style={{ color: darkMode ? '#555' : '#a8a099' }}>{searchQuery ? t.trySearch : t.noProductsSub}</p>
            {searchQuery && (
              <button
                className="mt-4 sf-btn-ghost"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
              >
                {t.clearFilters}
              </button>
            )}
          </div>
        ) : (
          <>
            <p
              className="text-sm font-medium mb-6"
              style={{ color: darkMode ? 'rgba(255,255,255,.3)' : '#a8a099' }}
            >
              {displayed.length} {displayed.length !== 1 ? t.items : t.item}
              {selectedCategory !== 'all' && ` — ${selectedCategory}`}
            </p>
            <div
              className="sf-products-grid grid gap-5"
              style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))' }}
            >
              {displayed.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  currency={business.currency || 'NGN'}
                  primary={primary}
                  dark={darkMode}
                  t={t}
                  onAdd={addToCart}
                  cartQty={cart.find(i => i.id === product.id)?.quantity || 0}
                />
              ))}
            </div>
          </>
        )}
      </main>

      <footer style={{ background: '#111111', borderTop: '1px solid rgba(255,255,255,.06)' }}>
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-10">
          <div className="flex flex-col md:flex-row justify-between gap-8">
            <div>
              <div className="flex items-center gap-3 mb-3">
                {business.logo ? (
                  <img src={business.logo} alt="" className="w-8 h-8 rounded-lg object-cover" />
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
                <p className="text-sm leading-relaxed max-w-xs" style={{ color: 'rgba(255,255,255,.4)' }}>
                  {business.footerText}
                </p>
              )}
              {(business.footerAddress || business.address) && (
                <p className="text-xs mt-2 flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,.3)' }}>
                  <MapPin className="w-3 h-3" />
                  {business.footerAddress || business.address}
                </p>
              )}
            </div>
            <div className="flex flex-col items-start md:items-end gap-3">
              <div className="flex gap-2 flex-wrap">
                {[
                  [business.facebookUrl, Facebook],
                  [business.instagramUrl, Instagram],
                  [business.twitterUrl, Twitter],
                  [business.youtubeUrl, Youtube],
                ]
                  .filter(([url]) => url)
                  .map(([url, Icon], i) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white hover:scale-110 transition-transform"
                      style={{ background: 'rgba(255,255,255,.08)' }}
                    >
                      <Icon className="w-4 h-4" />
                    </a>
                  ))}
                {business.whatsappNumber && (
                  <a
                    href={`https://wa.me/${business.whatsappNumber.replace(/[^\d+]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white hover:scale-110 transition-transform"
                    style={{ background: '#25D366' }}
                  >
                    <WaIcon size={16} />
                  </a>
                )}
              </div>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,.2)' }}>
                {business.footerCopyright
                  ? business.footerCopyright.replace('{year}', new Date().getFullYear())
                  : `© ${new Date().getFullYear()} ${business.name}. All rights reserved.`}
              </p>
            </div>
          </div>
          <div
            className="mt-8 pt-6 flex items-center justify-center gap-2 text-xs"
            style={{ borderTop: '1px solid rgba(255,255,255,.05)', color: 'rgba(255,255,255,.2)' }}
          >
            <Sparkles className="w-3 h-3" /> {t.poweredBy}
            <a
              href="https://mypadifood.com"
              className="hover:text-white transition-colors font-semibold"
              style={{ color: 'rgba(255,255,255,.35)' }}
            >
              MyPadiFood
            </a>
          </div>
        </div>
      </footer>

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
            style={{ background: `linear-gradient(135deg,${primary},${secondary})` }}
          >
            <ShoppingCart className="w-5 h-5" />
            {t.viewCart} · {totalQty}
            <span className="opacity-75 font-normal text-sm">
              {formatCurrency(cart.reduce((s, i) => s + i.price * i.quantity, 0), business.currency || 'NGN')}
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-6 right-20 w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg z-40"
            style={{
              background: darkMode ? '#1c1c1e' : 'white',
              border: `1px solid ${darkMode ? 'rgba(255,255,255,.08)' : '#e8e4dc'}`,
            }}
          >
            <ArrowUp className="w-5 h-5" style={{ color: darkMode ? '#888' : '#555' }} />
          </motion.button>
        )}
      </AnimatePresence>

      <FloatingContacts business={business} dark={darkMode} t={t} />

      <AnimatePresence>
        {cartOpen && (
          <CartPanel
            cart={cart}
            business={business}
            dark={darkMode}
            primary={primary}
            onClose={() => setCartOpen(false)}
            onUpdateQty={updateQty}
            onRemove={removeItem}
            onCheckout={() => {
              setCartOpen(false);
              setCheckoutOpen(true);
            }}
            t={t}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {checkoutOpen && (
          <CheckoutModal
            cart={cart}
            business={business}
            dark={darkMode}
            primary={primary}
            secondary={secondary}
            onClose={() => setCheckoutOpen(false)}
            onSuccess={() => {
              setCart([]);
              setCheckoutOpen(false);
              toast.success(t.orderSent, { duration: 4000 });
            }}
            t={t}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default BusinessStorefront;