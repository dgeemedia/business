// frontend/src/pages/public/MainLanding.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Store, Moon, Sun, Globe, Star, Zap, Shield,
  Sparkles, ChevronDown, X, Building2, TrendingUp, Award,
  Phone, ShoppingBag, Flame, ExternalLink, Package, CheckCircle,
} from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { buildSubdomainUrl } from '../../services/api';

/* ─── helpers ───────────────────────────────────────────────────────────────── */
function hexToRgb(hex = '#10b981') {
  const h = hex.replace('#', '');
  return { r: parseInt(h.slice(0,2),16), g: parseInt(h.slice(2,4),16), b: parseInt(h.slice(4,6),16) };
}
function rgba(hex, a) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}
function monthYear(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

/* ─── WaIcon ─────────────────────────────────────────────────────────────────── */
function WaIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="currentColor">
      <path d="M16 .5C7.44.5.5 7.44.5 16c0 2.83.74 5.5 2.04 7.84L.5 31.5l7.86-2.06A15.45 15.45 0 0016 31.5c8.56 0 15.5-6.94 15.5-15.5S24.56.5 16 .5zm0 28.5a12.9 12.9 0 01-6.6-1.8l-.47-.28-4.66 1.22 1.25-4.55-.31-.5A12.95 12.95 0 013.04 16C3.04 9.37 8.37 4.04 16 4.04S28.96 9.37 28.96 16 23.63 28.96 16 28.96zm7.1-9.76c-.39-.2-2.3-1.14-2.66-1.27-.36-.13-.62-.2-.88.2-.26.39-1 1.27-1.23 1.53-.22.26-.45.29-.84.1a10.64 10.64 0 01-3.14-1.94 11.77 11.77 0 01-2.17-2.7c-.23-.39-.03-.6.17-.8.18-.17.39-.45.59-.68.2-.22.26-.38.39-.64.13-.26.07-.49-.03-.68-.1-.2-.88-2.12-1.2-2.9-.32-.76-.64-.66-.88-.67l-.74-.01c-.26 0-.67.1-1.02.48-.36.38-1.36 1.33-1.36 3.24s1.39 3.76 1.59 4.02c.19.26 2.74 4.18 6.63 5.86.93.4 1.65.64 2.22.82.93.3 1.78.26 2.45.16.75-.11 2.3-.94 2.62-1.84.33-.9.33-1.68.23-1.84-.1-.16-.36-.26-.75-.46z" />
    </svg>
  );
}

/* ─── Premium Business Card (REAL DATA ONLY) ─────────────────────────────────── */
function BusinessCard({ business, index, darkMode }) {
  const cardRef  = useRef(null);
  const [hovered, setHovered] = useState(false);

  // 3-D tilt
  const mx   = useMotionValue(0);
  const my   = useMotionValue(0);
  const rotX = useSpring(useTransform(my, [-0.5, 0.5], [6, -6]), { stiffness: 200, damping: 25 });
  const rotY = useSpring(useTransform(mx, [-0.5, 0.5], [-6, 6]), { stiffness: 200, damping: 25 });

  function onMouseMove(e) {
    const r = cardRef.current?.getBoundingClientRect();
    if (!r) return;
    mx.set((e.clientX - r.left) / r.width  - 0.5);
    my.set((e.clientY - r.top)  / r.height - 0.5);
  }
  function onMouseLeave() { mx.set(0); my.set(0); }

  const p1   = business.primaryColor   || '#10b981';
  const p2   = business.secondaryColor || '#f59e0b';
  const name = business.businessName   || business.name || 'Business';

  // ── REAL counts from the API ──────────────────────────────────────────────
  const productCount = business._count?.products ?? null;
  const orderCount   = business._count?.orders   ?? null;
  const joinedDate   = monthYear(business.createdAt);  // e.g. "Mar 2024"

  // Build only the stats chips that have real data
  const stats = [
    productCount !== null && { icon: Package,     value: productCount, label: 'products' },
    orderCount   !== null && { icon: ShoppingBag, value: orderCount,   label: 'orders'   },
  ].filter(Boolean);

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      style={{ rotateX: rotX, rotateY: rotY, transformStyle: 'preserve-3d', perspective: 900 }}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <a
        href={buildSubdomainUrl(business.slug)}
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-[22px] overflow-hidden no-underline"
        style={{
          background: darkMode ? '#0e0e11' : '#ffffff',
          border: `1px solid ${hovered ? rgba(p1, 0.5) : darkMode ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.09)'}`,
          boxShadow: hovered
            ? `0 28px 64px -10px ${rgba(p1, 0.35)}, 0 0 0 1px ${rgba(p1, 0.2)}`
            : '0 2px 16px rgba(0,0,0,.07)',
          transition: 'box-shadow .3s ease, border-color .3s ease',
        }}
      >

        {/* ── HERO ── */}
        <div className="relative overflow-hidden" style={{ height: 148 }}>

          {/* Mesh gradient using real brand colours */}
          <div className="absolute inset-0" style={{
            background: `
              radial-gradient(ellipse at 15% 60%, ${p1}cc 0%, transparent 55%),
              radial-gradient(ellipse at 85% 15%, ${p2}aa 0%, transparent 52%),
              radial-gradient(ellipse at 55% 95%, ${rgba(p1, 0.4)} 0%, transparent 48%)
            `,
          }} />

          {/* Dot grid */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.12] pointer-events-none">
            <defs>
              <pattern id={`g${business.id}`} x="0" y="0" width="18" height="18" patternUnits="userSpaceOnUse">
                <circle cx="1.5" cy="1.5" r="1.5" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#g${business.id})`} />
          </svg>

          {/* Soft orb */}
          <div className="absolute -top-8 -right-8 rounded-full opacity-25 pointer-events-none"
            style={{ width: 130, height: 130, background: p2, filter: 'blur(38px)' }} />

          {/* Shimmer on hover */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={hovered ? { x: ['−130%', '230%'] } : { x: '-130%' }}
            transition={hovered ? { duration: 0.6, ease: 'easeInOut' } : { duration: 0 }}
            style={{ background: 'linear-gradient(105deg, transparent 36%, rgba(255,255,255,.2) 50%, transparent 64%)', transform: 'skewX(-14deg)' }}
          />

          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none"
            style={{ background: `linear-gradient(to bottom, transparent, ${darkMode ? '#0e0e11' : '#fff'})` }} />

          {/* Business type — top left */}
          {business.businessType && (
            <div className="absolute top-3 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(0,0,0,.3)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,.18)' }}>
              <Flame className="w-3 h-3 text-orange-300" />
              <span className="text-white text-[10px] font-bold tracking-widest uppercase">{business.businessType}</span>
            </div>
          )}

          {/* Verified badge — top right */}
          <div className="absolute top-3 right-4 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full"
            style={{ background: 'rgba(0,0,0,.3)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,.18)' }}>
            <CheckCircle className="w-3 h-3 text-emerald-400" />
            <span className="text-white text-[10px] font-bold">Verified</span>
          </div>

          {/* Logo avatar — bleeds into body */}
          <div className="absolute -bottom-6 left-5" style={{ zIndex: 10 }}>
            <motion.div
              animate={hovered ? { opacity: 1, scale: 1.18 } : { opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 rounded-[16px] pointer-events-none"
              style={{ background: p1, filter: 'blur(14px)' }}
            />
            <div
              className="relative w-[56px] h-[56px] rounded-[16px] overflow-hidden flex items-center justify-center shadow-2xl"
              style={{
                background: `linear-gradient(135deg, ${p1}, ${p2})`,
                border: `3px solid ${darkMode ? '#0e0e11' : '#fff'}`,
              }}
            >
              {business.logo
                ? <img src={business.logo} alt={name} className="w-full h-full object-cover"
                    onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
                : null}
              <span className="text-white font-black text-xl flex items-center justify-center w-full h-full"
                style={{ display: business.logo ? 'none' : 'flex', fontFamily: '"Georgia", serif' }}>
                {name[0]?.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Product count — bottom right of hero */}
          {productCount !== null && (
            <div className="absolute bottom-3 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(0,0,0,.35)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,.12)' }}>
              <Package className="w-3 h-3 text-white/70" />
              <span className="text-white text-[11px] font-bold">
                {productCount} product{productCount !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        {/* ── BODY ── */}
        <div className="px-5 pt-9 pb-5">

          {/* Name */}
          <h3 className="font-black text-[17px] leading-tight tracking-tight mb-1.5"
            style={{ color: darkMode ? '#f0f0f0' : '#0a0a0a', fontFamily: '"Georgia","Times New Roman",serif' }}>
            {name}
          </h3>

          {/* Description — real or nothing */}
          {business.description ? (
            <p className="text-[13px] line-clamp-2 leading-relaxed mb-4"
              style={{ color: darkMode ? 'rgba(255,255,255,.38)' : '#666' }}>
              {business.description}
            </p>
          ) : (
            <div className="mb-4" />
          )}

          {/* Real stats chips — only shown when count > 0 */}
          {stats.length > 0 && (
            <div className="flex gap-2 mb-4">
              {stats.map(({ icon: Icon, value, label }, i) => (
                <div key={i}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-[12px] flex-1 justify-center"
                  style={{
                    background: darkMode ? 'rgba(255,255,255,.04)' : rgba(p1, 0.06),
                    border: `1px solid ${darkMode ? 'rgba(255,255,255,.06)' : rgba(p1, 0.13)}`,
                  }}>
                  <Icon className="w-3.5 h-3.5" style={{ color: p1 }} />
                  <span className="text-[12px] font-black" style={{ color: darkMode ? '#e0e0e0' : '#111' }}>{value}</span>
                  <span className="text-[10px] uppercase tracking-wide" style={{ color: darkMode ? 'rgba(255,255,255,.3)' : '#999' }}>{label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Joined date badge */}
          {joinedDate && (
            <div className="flex items-center gap-1.5 mb-4">
              <span className="text-[11px] px-2.5 py-1 rounded-full font-semibold"
                style={{ background: rgba(p1, 0.1), color: p1, border: `1px solid ${rgba(p1, 0.2)}` }}>
                Member since {joinedDate}
              </span>
            </div>
          )}

          {/* Divider — brand tinted */}
          <div className="h-px mb-4"
            style={{ background: `linear-gradient(90deg, ${rgba(p1, 0.35)}, transparent)` }} />

          {/* Footer row */}
          <div className="flex items-center justify-between">
            {/* Live pulse */}
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-70"
                  style={{ background: p1 }} />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: p1 }} />
              </span>
              <span className="text-[11px] font-medium"
                style={{ color: darkMode ? 'rgba(255,255,255,.32)' : '#999' }}>
                Live store
              </span>
            </div>

            {/* CTA */}
            <motion.div
              animate={hovered
                ? { background: `linear-gradient(135deg, ${p1}, ${p2})`, color: '#fff' }
                : { background: darkMode ? 'rgba(255,255,255,.07)' : rgba(p1, 0.09), color: p1 }
              }
              transition={{ duration: 0.22 }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-bold"
            >
              Visit Store
              <motion.span animate={hovered ? { x: 2 } : { x: 0 }} transition={{ duration: 0.18 }}>
                <ExternalLink className="w-3.5 h-3.5" />
              </motion.span>
            </motion.div>
          </div>
        </div>

        {/* Bottom accent bar */}
        <motion.div
          animate={{ scaleX: hovered ? 1 : 0, opacity: hovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="absolute bottom-0 left-0 right-0 origin-left"
          style={{ height: 3, background: `linear-gradient(90deg, ${p1}, ${p2})` }}
        />
      </a>
    </motion.div>
  );
}

/* ─── Floating Contacts ──────────────────────────────────────────────────────── */
const PLATFORM_PHONE = '+2348110252143';
const PLATFORM_WA    = '2348110252143';
const WA_MESSAGES    = [
  "Hi! I'd like to list my business on MyPadiBusiness 🏪",
  "Hello! How do I get started on the platform? 🚀",
  "I need help setting up my online store 🛒",
  "What are the pricing plans for MyPadiBusiness? 💰",
  "Can I get a demo of the platform before signing up? 👀",
];

function FloatingContacts({ darkMode }) {
  const [waOpen, setWaOpen] = useState(false);
  const emojiRe = /\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu;
  return (
    <div className="fixed bottom-8 right-5 z-[90] flex flex-col items-end gap-3">
      <AnimatePresence>
        {waOpen && (
          <motion.div initial={{ opacity:0, scale:0.9, y:8 }} animate={{ opacity:1, scale:1, y:0 }}
            exit={{ opacity:0, scale:0.9, y:8 }} transition={{ type:'spring', damping:20, stiffness:300 }}
            className="rounded-2xl shadow-2xl overflow-hidden mb-1"
            style={{ width:300, background: darkMode?'#1c1c1e':'white', border:`1px solid ${darkMode?'rgba(255,255,255,.08)':'#e5e7eb'}` }}>
            <div className="flex items-center justify-between px-4 py-3" style={{ background:'#075E54' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center"><WaIcon size={18}/></div>
                <div>
                  <p className="text-white font-semibold text-sm leading-none">MyPadiBusiness</p>
                  <p className="text-green-200 text-xs mt-0.5">● Typically replies instantly</p>
                </div>
              </div>
              <button onClick={() => setWaOpen(false)} className="text-white/60 hover:text-white p-1"><X className="w-4 h-4"/></button>
            </div>
            <div className="p-3 space-y-1.5">
              <p className="text-xs font-semibold px-1 mb-2.5" style={{ color: darkMode?'rgba(255,255,255,.4)':'#9ca3af' }}>How can we help?</p>
              {WA_MESSAGES.map((msg, i) => {
                const emojis = msg.match(emojiRe)||[]; const emoji = emojis[emojis.length-1]||'💬';
                const text = msg.replace(emojiRe,'').trim();
                return (
                  <motion.a key={i} href={`https://wa.me/${PLATFORM_WA}?text=${encodeURIComponent(msg)}`}
                    target="_blank" rel="noopener noreferrer"
                    initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.06 }}
                    whileHover={{ scale:1.02 }} onClick={() => setWaOpen(false)}
                    className="flex items-center gap-2.5 w-full text-left px-3 py-2.5 rounded-xl"
                    style={{ background: darkMode?'rgba(255,255,255,.06)':'#f9fafb' }}>
                    <span className="text-lg flex-shrink-0">{emoji}</span>
                    <span className="text-xs leading-snug" style={{ color: darkMode?'rgba(255,255,255,.7)':'#374151' }}>{text}</span>
                  </motion.a>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.a href={`tel:${PLATFORM_PHONE}`} whileHover={{ scale:1.1 }} whileTap={{ scale:0.95 }}
        className="w-[52px] h-[52px] rounded-full flex items-center justify-center text-white shadow-xl"
        style={{ background:'#3B82F6', animation:'ml-phone-ring 2.5s infinite' }}>
        <Phone className="w-5 h-5"/>
      </motion.a>
      <motion.button onClick={() => setWaOpen(o=>!o)} whileHover={{ scale:1.1 }} whileTap={{ scale:0.95 }}
        className="w-[58px] h-[58px] rounded-full flex items-center justify-center text-white shadow-2xl"
        style={{ background:'#25D366', animation:'ml-wa-pulse 2s infinite' }}>
        <WaIcon size={27}/>
      </motion.button>
      <style>{`
        @keyframes ml-wa-pulse{0%,100%{box-shadow:0 0 0 0 rgba(37,211,102,.5)}70%{box-shadow:0 0 0 14px rgba(37,211,102,0)}}
        @keyframes ml-phone-ring{0%,100%{box-shadow:0 0 0 0 rgba(59,130,246,.45)}70%{box-shadow:0 0 0 12px rgba(59,130,246,0)}}
      `}</style>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────────── */
const MainLanding = () => {
  const navigate = useNavigate();
  const [businesses, setBusinesses]       = useState([]);
  const [searchTerm, setSearchTerm]       = useState('');
  const [loading, setLoading]             = useState(true);
  const [darkMode, setDarkMode]           = useState(false);
  const [language, setLanguage]           = useState('en');
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [bgIdx, setBgIdx]                 = useState(0);
  const [formData, setFormData]           = useState({ businessName:'', ownerName:'', email:'', phone:'', businessType:'', description:'' });
  const [clickCount, setClickCount]       = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [tapSeq, setTapSeq]               = useState([]);
  const [lastTapTime, setLastTapTime]     = useState(0);

  useEffect(() => {
    const fn = e => { if (e.ctrlKey && e.shiftKey && e.key.toLowerCase()==='a') { e.preventDefault(); window.open('/login','_blank'); } };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, []);

  const LANGS = { en:{ name:'English', flag:'🇬🇧' }, fr:{ name:'Français', flag:'🇫🇷' } };
  const T = {
    en: { hero:'Empower Your Business', heroSub:'Modern e-commerce with WhatsApp integration. Manage inventory, process orders, and scale effortlessly.', search:'Search businesses…', explore:'Featured Businesses', getStarted:'Join the Platform', whyUs:'Why Choose MyPadiBusiness', cta:'Ready to Scale Your Business?', ctaSub:'Join hundreds of businesses already thriving on our platform.' },
    fr: { hero:'Renforcez Votre Entreprise', heroSub:'Plateforme e-commerce avec intégration WhatsApp.', search:'Rechercher…', explore:'Entreprises en Vedette', getStarted:'Rejoindre', whyUs:'Pourquoi MyPadiBusiness', cta:'Prêt à Développer?', ctaSub:"Rejoignez des centaines d'entreprises." },
  };
  const t = T[language];

  const BG = [
    'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&w=1920',
    'https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=1920',
    'https://images.pexels.com/photos/1884581/pexels-photo-1884581.jpeg?auto=compress&cs=tinysrgb&w=1920',
    'https://images.pexels.com/photos/1334598/pexels-photo-1334598.jpeg?auto=compress&cs=tinysrgb&w=1920',
    'https://images.pexels.com/photos/1070850/pexels-photo-1070850.jpeg?auto=compress&cs=tinysrgb&w=1920',
    'https://images.pexels.com/photos/1927624/pexels-photo-1927624.jpeg?auto=compress&cs=tinysrgb&w=1920',
  ];

  useEffect(() => { fetchBusinesses(); if (localStorage.getItem('theme')==='dark') setDarkMode(true); }, []);
  useEffect(() => { document.documentElement.classList.toggle('dark', darkMode); localStorage.setItem('theme', darkMode?'dark':'light'); }, [darkMode]);
  useEffect(() => { const id = setInterval(() => setBgIdx(p=>(p+1)%BG.length), 4000); return () => clearInterval(id); }, []);

  const handleLogoClick = () => {
    const now = Date.now(), next = now - lastClickTime < 500 ? clickCount+1 : 1;
    setClickCount(next); setLastClickTime(now);
    if (next >= 5) { window.open('/login','_blank'); setClickCount(0); }
  };
  const handleSecretTap = () => {
    const now = Date.now();
    if (now - lastTapTime > 2000) setTapSeq([]);
    const seq = [...tapSeq, now]; setTapSeq(seq); setLastTapTime(now);
    if (seq.length >= 3 && seq[2]-seq[0] < 1500) { window.open('/login','_blank'); setTapSeq([]); }
    if (seq.length > 5) setTapSeq(seq.slice(-3));
  };

  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/onboarding/businesses');
      const raw = Array.isArray(res.data) ? res.data : (res.data?.businesses || []);
      setBusinesses(raw.map(b => ({ ...b, name: b.businessName || b.name })));
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleRegister = async e => {
    e.preventDefault();
    try {
      await api.post('/api/onboarding/submit', { businessName:formData.businessName, ownerName:formData.ownerName, ownerEmail:formData.email, ownerPhone:formData.phone, businessType:formData.businessType, description:formData.description });
      toast.success("Application submitted! We'll contact you within 24 hours.");
      setRegisterModalOpen(false);
      setFormData({ businessName:'', ownerName:'', email:'', phone:'', businessType:'', description:'' });
    } catch (err) { toast.error(err.response?.data?.error || 'Submission failed'); }
  };

  const FEATURES = [
    { icon:Zap,        title:'Lightning Fast',      desc:'Real-time orders & instant notifications',   grad:'from-amber-400 to-orange-500' },
    { icon:Shield,     title:'Secure Platform',      desc:'Enterprise-grade security for your data',    grad:'from-blue-400 to-indigo-500' },
    { icon:TrendingUp, title:'Growth Analytics',     desc:'Track performance with detailed insights',   grad:'from-emerald-400 to-teal-500' },
    { icon:Award,      title:'WhatsApp Integration', desc:'Accept orders directly via WhatsApp',        grad:'from-purple-400 to-pink-500' },
  ];

  const filtered = businesses
    .filter(b => [(b.name||''),(b.description||''),(b.businessType||'')].join(' ').toLowerCase().includes(searchTerm.toLowerCase()))
    .slice(0, 9);

  return (
    <div className={`min-h-screen transition-colors duration-500 ${darkMode?'bg-black text-white':'bg-white text-gray-900'}`}>

      {/* HEADER */}
      <header className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl border-b transition-colors ${darkMode?'bg-black/80 border-white/10':'bg-white/80 border-gray-200/50'}`}>
        <nav className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <motion.div onClick={handleLogoClick} className="flex items-center gap-3 cursor-pointer select-none" whileTap={{ scale:0.95 }}>
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center shadow-xl"><Building2 className="w-6 h-6 text-white"/></div>
              <div>
                <h1 className={`text-xl font-black tracking-tight ${darkMode?'text-white':'text-gray-900'}`}>MyPadiBusiness</h1>
                <p className="text-[10px] uppercase tracking-wider text-gray-500">Business Platform</p>
              </div>
            </motion.div>
            <div className="flex items-center gap-3">
              <div className="relative group">
                <button className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${darkMode?'bg-white/5 hover:bg-white/10 text-gray-300':'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
                  <Globe className="w-4 h-4"/><span className="text-lg">{LANGS[language].flag}</span>
                </button>
                <div className={`absolute right-0 mt-2 w-44 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all ${darkMode?'bg-gray-900 border border-white/10':'bg-white border border-gray-200'}`}>
                  {Object.entries(LANGS).map(([code,l]) => (
                    <button key={code} onClick={() => setLanguage(code)}
                      className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors first:rounded-t-xl last:rounded-b-xl ${language===code?(darkMode?'bg-white/10 text-white':'bg-orange-50 text-orange-600'):(darkMode?'hover:bg-white/5 text-gray-300':'hover:bg-gray-50 text-gray-700')}`}>
                      <span className="text-xl">{l.flag}</span><span className="text-sm font-medium">{l.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={() => setDarkMode(!darkMode)} className={`p-2.5 rounded-xl transition-all ${darkMode?'bg-amber-500 hover:bg-amber-400 text-gray-900':'bg-gray-900 hover:bg-gray-800 text-amber-400'}`}>
                <motion.div animate={{ rotate: darkMode?180:0 }} transition={{ duration:0.3 }}>
                  {darkMode ? <Sun className="w-5 h-5"/> : <Moon className="w-5 h-5"/>}
                </motion.div>
              </button>
              <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }} onClick={() => setRegisterModalOpen(true)}
                className="hidden sm:flex px-6 py-2.5 bg-gradient-to-r from-orange-500 to-pink-600 text-white font-bold rounded-xl shadow-lg">
                {t.getStarted}
              </motion.button>
            </div>
          </div>
        </nav>
      </header>

      {/* HERO */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <AnimatePresence mode="wait">
            <motion.div key={bgIdx} initial={{ opacity:0, scale:1.08 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.96 }} transition={{ duration:1.2 }} className="absolute inset-0">
              <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage:`url('${BG[bgIdx]}')` }}/>
              <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/65"/>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
          <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.8 }}>
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/30 mb-8">
              <Sparkles className="w-4 h-4 text-white"/><span className="text-sm font-bold text-white">Enterprise-Grade Business Platform</span>
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black mb-6 leading-tight text-white drop-shadow-lg">
              {t.hero}<br/>
              <span className="bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">Digital Excellence</span>
            </h1>
            <p className="text-xl lg:text-2xl mb-12 max-w-3xl mx-auto leading-relaxed text-white/90">{t.heroSub}</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }} onClick={() => setRegisterModalOpen(true)}
                className="px-8 py-4 bg-gradient-to-r from-orange-500 to-pink-600 text-white font-bold text-lg rounded-xl shadow-2xl">{t.getStarted} →</motion.button>
              <motion.a href="#businesses" whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                className="px-8 py-4 font-bold text-lg rounded-xl border-2 border-white/30 hover:bg-white/10 text-white backdrop-blur-sm transition-all">View Featured</motion.a>
            </div>
          </motion.div>
        </div>
        <motion.div animate={{ y:[0,10,0] }} transition={{ duration:2, repeat:Infinity }} className="absolute bottom-10 left-1/2 -translate-x-1/2">
          <ChevronDown className="w-8 h-8 text-white/70"/>
        </motion.div>
      </section>

      {/* FEATURES */}
      <section className={`py-24 px-6 ${darkMode?'bg-gray-900/50':'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity:0 }} whileInView={{ opacity:1 }} viewport={{ once:true }} className="text-center mb-16">
            <h2 className={`text-4xl lg:text-5xl font-black mb-4 ${darkMode?'text-white':'text-gray-900'}`}>{t.whyUs}</h2>
            <p className={`text-xl ${darkMode?'text-gray-400':'text-gray-600'}`}>Built for modern businesses</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {FEATURES.map((f,i) => (
              <motion.div key={i} initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay:i*0.1 }} whileHover={{ y:-8 }}
                className={`p-8 rounded-2xl transition-all ${darkMode?'bg-white/5 border border-white/10 hover:border-white/20':'bg-white border border-gray-200 hover:border-gray-300'}`}>
                <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${f.grad} mb-5`}><f.icon className="w-7 h-7 text-white"/></div>
                <h3 className={`text-xl font-bold mb-3 ${darkMode?'text-white':'text-gray-900'}`}>{f.title}</h3>
                <p className={darkMode?'text-gray-400':'text-gray-600'}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED BUSINESSES */}
      <section id="businesses" className={`py-28 px-6 ${darkMode?'bg-[#07070a]':'bg-slate-50'}`}>
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} className="text-center mb-5">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-5"
              style={{ background: darkMode?'rgba(255,255,255,.06)':'rgba(234,88,12,.08)', color: darkMode?'rgba(255,255,255,.45)':'#ea580c' }}>
              <Flame className="w-3.5 h-3.5"/> Thriving stores
            </span>
            <h2 className={`text-4xl lg:text-5xl font-black mb-3 ${darkMode?'text-white':'text-gray-900'}`} style={{ fontFamily:'"Georgia",serif' }}>
              {t.explore}
            </h2>
            <p className={`text-lg max-w-xl mx-auto ${darkMode?'text-gray-500':'text-gray-500'}`}>
              Real businesses, real customers — see who's thriving on our platform today.
            </p>
          </motion.div>

          {!loading && businesses.length > 0 && (
            <motion.div initial={{ opacity:0 }} whileInView={{ opacity:1 }} viewport={{ once:true }} className="flex justify-center mb-10">
              <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-full"
                style={{ background: darkMode?'rgba(255,255,255,.05)':'white', border:`1px solid ${darkMode?'rgba(255,255,255,.08)':'#e5e7eb'}`, boxShadow:'0 2px 12px rgba(0,0,0,.06)' }}>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"/>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"/>
                </span>
                <span className="text-sm font-semibold" style={{ color: darkMode?'rgba(255,255,255,.55)':'#374151' }}>
                  {businesses.length} active store{businesses.length!==1?'s':''} on the platform
                </span>
              </div>
            </motion.div>
          )}

          <motion.div initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} className="max-w-md mx-auto mb-14">
            <div className={`relative rounded-2xl ${darkMode?'bg-white/5 border border-white/10':'bg-white border border-gray-200'} shadow-lg`}>
              <Search className={`absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 ${darkMode?'text-gray-500':'text-gray-400'}`}/>
              <input type="text" placeholder={t.search} value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                className={`w-full pl-14 pr-6 py-4 rounded-2xl text-base focus:outline-none bg-transparent ${darkMode?'text-white placeholder-gray-500':'text-gray-900 placeholder-gray-400'}`}/>
            </div>
          </motion.div>

          {loading ? (
            <div className="text-center py-20">
              <motion.div animate={{ rotate:360 }} transition={{ duration:1, repeat:Infinity, ease:'linear' }}
                className="w-14 h-14 border-4 border-t-orange-500 border-gray-200 rounded-full mx-auto"/>
              <p className={`mt-4 text-sm ${darkMode?'text-gray-600':'text-gray-400'}`}>Loading stores…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className={`text-center py-20 ${darkMode?'text-gray-500':'text-gray-400'}`}>
              <Store className="w-16 h-16 mx-auto mb-4 opacity-40"/>
              <p className="text-lg font-medium">{searchTerm ? 'No businesses match your search' : 'No businesses yet — be the first!'}</p>
              {searchTerm && <button onClick={() => setSearchTerm('')} className="mt-3 text-sm text-orange-500 hover:underline">Clear search</button>}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7" style={{ perspective:'1400px' }}>
              {filtered.map((b,i) => <BusinessCard key={b.id||b.slug} business={b} index={i} darkMode={darkMode}/>)}
            </div>
          )}

          {!loading && businesses.length > 0 && (
            <motion.div initial={{ opacity:0 }} whileInView={{ opacity:1 }} viewport={{ once:true }} className="text-center mt-16">
              <p className={`text-base mb-5 ${darkMode?'text-gray-500':'text-gray-500'}`}>Want your business listed here?</p>
              <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.97 }} onClick={() => setRegisterModalOpen(true)}
                className="px-10 py-4 bg-gradient-to-r from-orange-500 to-pink-600 text-white font-bold text-base rounded-2xl shadow-xl">
                List Your Business Free →
              </motion.button>
            </motion.div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-32 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-pink-600 to-purple-600"/>
        <div className="relative z-10 max-w-4xl mx-auto text-center text-white">
          <motion.h2 initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} className="text-4xl lg:text-6xl font-black mb-6">{t.cta}</motion.h2>
          <motion.p initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay:0.1 }} className="text-xl lg:text-2xl mb-10 opacity-90">{t.ctaSub}</motion.p>
          <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }} onClick={() => setRegisterModalOpen(true)}
            className="px-10 py-5 bg-white text-orange-600 font-black text-lg rounded-2xl shadow-2xl">Get Started Today →</motion.button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className={`py-16 px-6 ${darkMode?'bg-gray-950 border-t border-white/10':'bg-gray-900'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center"><Building2 className="w-6 h-6 text-white"/></div>
                <span className="text-xl font-black text-white">MyPadiBusiness</span>
              </div>
              <p className="text-gray-400 max-w-xs">Empowering businesses with modern e-commerce solutions.</p>
            </div>
            <div>
              <h3 className="font-bold text-white mb-4">Platform</h3>
              <ul className="space-y-2">{['Features','Pricing','Support'].map(i=><li key={i}><a href="#" className="text-gray-400 hover:text-orange-500 transition-colors">{i}</a></li>)}</ul>
            </div>
            <div>
              <h3 className="font-bold text-white mb-4">Legal</h3>
              <ul className="space-y-2">{['Privacy','Terms','Security'].map(i=><li key={i}><a href="#" className="text-gray-400 hover:text-orange-500 transition-colors">{i}</a></li>)}</ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center" onClick={handleSecretTap}>
            <p className="text-gray-500 text-sm select-none">© {new Date().getFullYear()} MyPadiBusiness. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* REGISTRATION MODAL */}
      <AnimatePresence>
        {registerModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              className="fixed inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setRegisterModalOpen(false)}/>
            <div className="flex min-h-full items-center justify-center p-4">
              <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.95 }}
                className={`relative w-full max-w-2xl rounded-3xl shadow-2xl ${darkMode?'bg-gray-900 border border-white/10':'bg-white'}`}
                onClick={e => e.stopPropagation()}>
                <div className="p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className={`text-3xl font-black ${darkMode?'text-white':'text-gray-900'}`}>Join MyPadiBusiness</h2>
                      <p className={darkMode?'text-gray-400':'text-gray-600'}>Start growing your business today</p>
                    </div>
                    <button onClick={() => setRegisterModalOpen(false)} className={`p-2 rounded-xl ${darkMode?'hover:bg-white/10':'hover:bg-gray-100'}`}><X className="w-6 h-6"/></button>
                  </div>
                  <form onSubmit={handleRegister} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[{label:'Business Name',key:'businessName',type:'text',ph:'Your Business Name'},{label:'Owner Name',key:'ownerName',type:'text',ph:'Your Full Name'},{label:'Email',key:'email',type:'email',ph:'your@email.com'},{label:'Phone',key:'phone',type:'tel',ph:'+234 800 000 0000'}].map(({label,key,type,ph}) => (
                        <div key={key}>
                          <label className={`block text-sm font-semibold mb-2 ${darkMode?'text-gray-300':'text-gray-700'}`}>{label} *</label>
                          <input type={type} required value={formData[key]} onChange={e => setFormData({...formData,[key]:e.target.value})}
                            className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-colors ${darkMode?'bg-white/5 border-white/10 focus:border-orange-500 text-white':'bg-white border-gray-200 focus:border-orange-500'}`}
                            placeholder={ph}/>
                        </div>
                      ))}
                    </div>
                    <div>
                      <label className={`block text-sm font-semibold mb-2 ${darkMode?'text-gray-300':'text-gray-700'}`}>Business Type *</label>
                      <select required value={formData.businessType} onChange={e => setFormData({...formData,businessType:e.target.value})}
                        className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-colors ${darkMode?'bg-gray-800 border-white/10 focus:border-orange-500 text-white':'bg-white border-gray-200 focus:border-orange-500'}`}>
                        <option value="">Select type...</option>
                        {['Restaurant','Retail','Fashion','Services','Other'].map(o=><option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={`block text-sm font-semibold mb-2 ${darkMode?'text-gray-300':'text-gray-700'}`}>Description</label>
                      <textarea value={formData.description} onChange={e => setFormData({...formData,description:e.target.value})} rows="3"
                        className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-colors ${darkMode?'bg-white/5 border-white/10 focus:border-orange-500 text-white':'bg-white border-gray-200 focus:border-orange-500'}`}
                        placeholder="Tell us about your business..."/>
                    </div>
                    <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }} type="submit"
                      className="w-full py-4 bg-gradient-to-r from-orange-500 to-pink-600 text-white font-bold text-lg rounded-xl shadow-lg">
                      Submit Application →
                    </motion.button>
                    <p className={`text-center text-sm ${darkMode?'text-gray-500':'text-gray-600'}`}>We'll review your application within 24 hours</p>
                  </form>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      <FloatingContacts darkMode={darkMode}/>
    </div>
  );
};

export default MainLanding;