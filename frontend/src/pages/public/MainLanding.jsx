// frontend/src/pages/public/MainLanding.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Store, ArrowRight, Moon, Sun, Globe, 
  Star, Package, Zap, Shield, Sparkles, ChevronDown, 
  X, Building2, CheckCircle, TrendingUp, Award, Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { buildSubdomainUrl } from '../../services/api';

// ── WhatsApp SVG icon ───────────────────────────────────────────────────────
function WaIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="currentColor">
      <path d="M16 .5C7.44.5.5 7.44.5 16c0 2.83.74 5.5 2.04 7.84L.5 31.5l7.86-2.06A15.45 15.45 0 0016 31.5c8.56 0 15.5-6.94 15.5-15.5S24.56.5 16 .5zm0 28.5a12.9 12.9 0 01-6.6-1.8l-.47-.28-4.66 1.22 1.25-4.55-.31-.5A12.95 12.95 0 013.04 16C3.04 9.37 8.37 4.04 16 4.04S28.96 9.37 28.96 16 23.63 28.96 16 28.96zm7.1-9.76c-.39-.2-2.3-1.14-2.66-1.27-.36-.13-.62-.2-.88.2-.26.39-1 1.27-1.23 1.53-.22.26-.45.29-.84.1a10.64 10.64 0 01-3.14-1.94 11.77 11.77 0 01-2.17-2.7c-.23-.39-.03-.6.17-.8.18-.17.39-.45.59-.68.2-.22.26-.38.39-.64.13-.26.07-.49-.03-.68-.1-.2-.88-2.12-1.2-2.9-.32-.76-.64-.66-.88-.67l-.74-.01c-.26 0-.67.1-1.02.48-.36.38-1.36 1.33-1.36 3.24s1.39 3.76 1.59 4.02c.19.26 2.74 4.18 6.63 5.86.93.4 1.65.64 2.22.82.93.3 1.78.26 2.45.16.75-.11 2.3-.94 2.62-1.84.33-.9.33-1.68.23-1.84-.1-.16-.36-.26-.75-.46z"/>
    </svg>
  );
}

// ── Floating Contact Buttons ────────────────────────────────────────────────
const PLATFORM_PHONE = '+2348110252143';
const PLATFORM_WA    = '2348110252143'; // no + for wa.me URL

const WA_MESSAGES = [
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

      {/* WhatsApp popup panel */}
      <AnimatePresence>
        {waOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 8 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="rounded-2xl shadow-2xl overflow-hidden mb-1"
            style={{
              width: 300,
              background: darkMode ? '#1c1c1e' : 'white',
              border: `1px solid ${darkMode ? 'rgba(255,255,255,.08)' : '#e5e7eb'}`,
            }}
          >
            {/* WA header */}
            <div className="flex items-center justify-between px-4 py-3" style={{ background: '#075E54' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,.2)' }}>
                  <WaIcon size={18} />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm leading-none">MyPadiBusiness</p>
                  <p className="text-green-200 text-xs mt-0.5">● Typically replies instantly</p>
                </div>
              </div>
              <button onClick={() => setWaOpen(false)} className="text-white/60 hover:text-white transition-colors p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick messages */}
            <div className="p-3 space-y-1.5">
              <p className="text-xs font-semibold px-1 mb-2.5" style={{ color: darkMode ? 'rgba(255,255,255,.4)' : '#9ca3af' }}>
                How can we help you today?
              </p>
              {WA_MESSAGES.map((msg, i) => {
                const emojis = msg.match(emojiRe) || [];
                const emoji = emojis[emojis.length - 1] || '💬';
                const text = msg.replace(emojiRe, '').trim();
                return (
                  <motion.a
                    key={i}
                    href={`https://wa.me/${PLATFORM_WA}?text=${encodeURIComponent(msg)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setWaOpen(false)}
                    className="flex items-center gap-2.5 w-full text-left px-3 py-2.5 rounded-xl transition-colors"
                    style={{ background: darkMode ? 'rgba(255,255,255,.06)' : '#f9fafb' }}
                  >
                    <span className="text-lg flex-shrink-0">{emoji}</span>
                    <span className="text-xs leading-snug" style={{ color: darkMode ? 'rgba(255,255,255,.7)' : '#374151' }}>
                      {text}
                    </span>
                  </motion.a>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phone call button */}
      <motion.a
        href={`tel:${PLATFORM_PHONE}`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        title="Call us"
        className="w-[52px] h-[52px] rounded-full flex items-center justify-center text-white shadow-xl"
        style={{
          background: '#3B82F6',
          animation: 'ml-phone-ring 2.5s infinite',
        }}
      >
        <Phone className="w-5 h-5" />
      </motion.a>

      {/* WhatsApp button */}
      <motion.button
        onClick={() => setWaOpen(o => !o)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        title="Chat on WhatsApp"
        className="w-[58px] h-[58px] rounded-full flex items-center justify-center text-white shadow-2xl"
        style={{
          background: '#25D366',
          animation: 'ml-wa-pulse 2s infinite',
        }}
      >
        <WaIcon size={27} />
      </motion.button>

      {/* Pulse keyframes */}
      <style>{`
        @keyframes ml-wa-pulse {
          0%,100%{box-shadow:0 0 0 0 rgba(37,211,102,.5)}
          70%{box-shadow:0 0 0 14px rgba(37,211,102,0)}
        }
        @keyframes ml-phone-ring {
          0%,100%{box-shadow:0 0 0 0 rgba(59,130,246,.45)}
          70%{box-shadow:0 0 0 12px rgba(59,130,246,0)}
        }
      `}</style>
    </div>
  );
}

const MainLanding = () => {
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('en');
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const videoRef = useRef(null);
  
  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    businessType: '',
    description: '',
  });

  // Hidden super admin login tracker - Desktop (5 clicks)
  const [clickCount, setClickCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);

  // Mobile-friendly triple tap for admin login
  const [tapSequence, setTapSequence] = useState([]);
  const [lastTapTime, setLastTapTime] = useState(0);

  // Keyboard shortcut for super admin login (Desktop)
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        window.open('/login', '_blank');
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [navigate]);

  const languages = {
    en: { name: 'English', flag: '🇬🇧' },
    fr: { name: 'Français', flag: '🇫🇷' }
  };

  const translations = {
    en: {
      hero: 'Empower Your Business',
      heroSub: 'Modern e-commerce platform with WhatsApp integration. Manage inventory, process orders, and scale your business effortlessly.',
      search: 'Search businesses...',
      explore: 'Featured Businesses',
      getStarted: 'Join the Platform',
      whyUs: 'Why Choose MyPadiBusiness',
      features: 'Platform Features',
      cta: 'Ready to Scale Your Business?',
      ctaSub: 'Join hundreds of successful businesses already using our platform',
    },
    fr: {
      hero: 'Renforcez Votre Entreprise',
      heroSub: 'Plateforme e-commerce moderne avec intégration WhatsApp. Gérez les stocks, traitez les commandes et développez facilement.',
      search: 'Rechercher...',
      explore: 'Entreprises en Vedette',
      getStarted: 'Rejoindre la Plateforme',
      whyUs: 'Pourquoi Choisir MyPadiBusiness',
      features: 'Fonctionnalités',
      cta: 'Prêt à Développer Votre Entreprise?',
      ctaSub: "Rejoignez des centaines d'entreprises prospères",
    },
  };

  const t = translations[language];

  const businessShowcase = [
    { type: 'restaurant', image: 'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&w=1920' },
    { type: 'hotel', image: 'https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=1920' },
    { type: 'fashion', image: 'https://images.pexels.com/photos/1884581/pexels-photo-1884581.jpeg?auto=compress&cs=tinysrgb&w=1920' },
    { type: 'electronics', image: 'https://images.pexels.com/photos/1334598/pexels-photo-1334598.jpeg?auto=compress&cs=tinysrgb&w=1920' },
    { type: 'pharmacy', image: 'https://images.pexels.com/photos/3683041/pexels-photo-3683041.jpeg?auto=compress&cs=tinysrgb&w=1920' },
    { type: 'cars', image: 'https://images.pexels.com/photos/164634/pexels-photo-164634.jpeg?auto=compress&cs=tinysrgb&w=1920' },
    { type: 'farm', image: 'https://images.pexels.com/photos/1002703/pexels-photo-1002703.jpeg?auto=compress&cs=tinysrgb&w=1920' },
    { type: 'beauty', image: 'https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=1920' },
    { type: 'bookstore', image: 'https://images.pexels.com/photos/1106468/pexels-photo-1106468.jpeg?auto=compress&cs=tinysrgb&w=1920' },
    { type: 'supermarket', image: 'https://images.pexels.com/photos/264636/pexels-photo-264636.jpeg?auto=compress&cs=tinysrgb&w=1920' },
    { type: 'phone-store', image: 'https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg?auto=compress&cs=tinysrgb&w=1920' },
    { type: 'laptop-store', image: 'https://images.pexels.com/photos/303383/pexels-photo-303383.jpeg?auto=compress&cs=tinysrgb&w=1920' },
    { type: 'garri-rice', image: 'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg?auto=compress&cs=tinysrgb&w=1920' },
    { type: 'auto-parts', image: 'https://images.pexels.com/photos/3806288/pexels-photo-3806288.jpeg?auto=compress&cs=tinysrgb&w=1920' },
    { type: 'gym', image: 'https://images.pexels.com/photos/1954524/pexels-photo-1954524.jpeg?auto=compress&cs=tinysrgb&w=1920' },
    { type: 'bakery', image: 'https://images.pexels.com/photos/1070850/pexels-photo-1070850.jpeg?auto=compress&cs=tinysrgb&w=1920' },
    { type: 'jewelry', image: 'https://images.pexels.com/photos/1927624/pexels-photo-1927624.jpeg?auto=compress&cs=tinysrgb&w=1920' },
    { type: 'furniture', image: 'https://images.pexels.com/photos/1350789/pexels-photo-1350789.jpeg?auto=compress&cs=tinysrgb&w=1920' },
    { type: 'laundry', image: 'https://images.pexels.com/photos/6197122/pexels-photo-6197122.jpeg?auto=compress&cs=tinysrgb&w=1920' },
    { type: 'printing', image: 'https://images.pexels.com/photos/1089930/pexels-photo-1089930.jpeg?auto=compress&cs=tinysrgb&w=1920' },
  ];

  useEffect(() => {
    fetchBusinesses();
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') setDarkMode(true);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentVideoIndex((prev) => (prev + 1) % businessShowcase.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleLogoClick = () => {
    const now = Date.now();
    if (now - lastClickTime < 500) {
      setClickCount(prev => prev + 1);
      if (clickCount + 1 >= 5) {
        window.open('/login', '_blank');
        setClickCount(0);
      }
    } else {
      setClickCount(1);
    }
    setLastClickTime(now);
  };

  const handleSecretTap = () => {
    const now = Date.now();
    if (now - lastTapTime > 2000) setTapSequence([]);
    const newSequence = [...tapSequence, now];
    setTapSequence(newSequence);
    setLastTapTime(now);
    if (newSequence.length >= 3) {
      const timeDiff = newSequence[2] - newSequence[0];
      if (timeDiff < 1500) {
        window.open('/login', '_blank');
        setTapSequence([]);
        return;
      }
    }
    if (newSequence.length > 5) setTapSequence(newSequence.slice(-3));
  };

  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/onboarding/businesses');
      setBusinesses(response.data || []);
    } catch (error) {
      console.error('Failed to load businesses');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/onboarding/submit', {
        businessName: formData.businessName,
        ownerName: formData.ownerName,
        ownerEmail: formData.email,
        ownerPhone: formData.phone,
        businessType: formData.businessType,
        description: formData.description,
      });
      toast.success("Application submitted successfully! We'll contact you within 24 hours.");
      setRegisterModalOpen(false);
      setFormData({ businessName: '', ownerName: '', email: '', phone: '', businessType: '', description: '' });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Submission failed');
    }
  };

  const features = [
    { icon: Zap,      title: 'Lightning Fast',       description: 'Real-time order processing and instant notifications',  color: 'from-amber-400 to-orange-500' },
    { icon: Shield,   title: 'Secure Platform',       description: 'Enterprise-grade security for your business data',       color: 'from-blue-400 to-indigo-500' },
    { icon: TrendingUp, title: 'Growth Analytics',   description: 'Track performance with detailed insights',               color: 'from-emerald-400 to-teal-500' },
    { icon: Award,    title: 'WhatsApp Integration',  description: 'Accept orders directly from WhatsApp',                  color: 'from-purple-400 to-pink-500' },
  ];

  const filteredBusinesses = businesses
    .filter(b =>
      b.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .slice(0, 6);

  return (
    <div className={`min-h-screen transition-colors duration-500 ${darkMode ? 'bg-black text-white' : 'bg-white text-gray-900'}`}>
      
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl border-b transition-colors ${
        darkMode ? 'bg-black/80 border-white/10' : 'bg-white/80 border-gray-200/50'
      }`}>
        <nav className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            {/* Logo */}
            <motion.div onClick={handleLogoClick} className="flex items-center gap-3 cursor-pointer select-none" whileTap={{ scale: 0.95 }}>
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center shadow-xl">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className={`text-xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>MyPadiBusiness</h1>
                <p className={`text-[10px] uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Business Platform</p>
              </div>
            </motion.div>

            <div className="flex items-center gap-3">
              
              {/* Language Selector */}
              <div className="relative group">
                <button className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
                  darkMode ? 'bg-white/5 hover:bg-white/10 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}>
                  <Globe className="w-4 h-4" />
                  <span className="text-lg">{languages[language].flag}</span>
                </button>
                <div className={`absolute right-0 mt-2 w-44 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all ${
                  darkMode ? 'bg-gray-900 border border-white/10' : 'bg-white border border-gray-200'
                }`}>
                  {Object.entries(languages).map(([code, lang]) => (
                    <button key={code} onClick={() => setLanguage(code)}
                      className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors first:rounded-t-xl last:rounded-b-xl ${
                        language === code
                          ? darkMode ? 'bg-white/10 text-white' : 'bg-orange-50 text-orange-600'
                          : darkMode ? 'hover:bg-white/5 text-gray-300' : 'hover:bg-gray-50 text-gray-700'
                      }`}>
                      <span className="text-xl">{lang.flag}</span>
                      <span className="text-sm font-medium">{lang.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme Toggle */}
              <button onClick={() => setDarkMode(!darkMode)}
                className={`p-2.5 rounded-xl transition-all ${darkMode ? 'bg-amber-500 hover:bg-amber-400 text-gray-900' : 'bg-gray-900 hover:bg-gray-800 text-amber-400'}`}>
                <motion.div animate={{ rotate: darkMode ? 180 : 0 }} transition={{ duration: 0.3 }}>
                  {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </motion.div>
              </button>

              {/* CTA Button */}
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => setRegisterModalOpen(true)}
                className="hidden sm:flex px-6 py-2.5 bg-gradient-to-r from-orange-500 to-pink-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all">
                {t.getStarted}
              </motion.button>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <AnimatePresence mode="wait">
            <motion.div key={currentVideoIndex}
              initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 1.2 }} className="absolute inset-0">
              <div className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url('${businessShowcase[currentVideoIndex].image}')` }}/>
              <div className={`absolute inset-0 ${darkMode ? 'bg-gradient-to-b from-black/70 via-black/60 to-black/80' : 'bg-gradient-to-b from-black/40 via-black/30 to-black/50'}`} />
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/30 mb-8">
              <Sparkles className="w-4 h-4 text-white" />
              <span className="text-sm font-bold text-white">Enterprise-Grade Business Platform</span>
            </motion.div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black mb-6 leading-tight text-white drop-shadow-lg">
              {t.hero}<br />
              <span className="bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">Digital Excellence</span>
            </h1>

            <p className="text-xl lg:text-2xl mb-12 max-w-3xl mx-auto leading-relaxed text-white/90 drop-shadow-md">{t.heroSub}</p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => setRegisterModalOpen(true)}
                className="px-8 py-4 bg-gradient-to-r from-orange-500 to-pink-600 text-white font-bold text-lg rounded-xl shadow-2xl hover:shadow-orange-500/50 transition-all">
                {t.getStarted} →
              </motion.button>
              <motion.a href="#businesses" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="px-8 py-4 font-bold text-lg rounded-xl border-2 border-white/30 hover:bg-white/10 text-white backdrop-blur-sm transition-all">
                View Featured
              </motion.a>
            </div>
          </motion.div>
        </div>

        <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2">
          <ChevronDown className="w-8 h-8 text-white/70" />
        </motion.div>
      </section>

      {/* Features Section */}
      <section className={`py-24 px-6 ${darkMode ? 'bg-gray-900/50' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className={`text-4xl lg:text-5xl font-black mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t.whyUs}</h2>
            <p className={`text-xl ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Built for modern businesses</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }} whileHover={{ y: -8 }}
                className={`p-8 rounded-2xl transition-all ${darkMode ? 'bg-white/5 border border-white/10 hover:border-white/20' : 'bg-white border border-gray-200 hover:border-gray-300'}`}>
                <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${feature.color} mb-5`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className={`text-xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{feature.title}</h3>
                <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Businesses */}
      <section id="businesses" className={`py-24 px-6 ${darkMode ? 'bg-black' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto">
          <motion.h2 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className={`text-4xl lg:text-5xl font-black mb-12 text-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {t.explore}
          </motion.h2>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-2xl mx-auto mb-16">
            <div className={`relative rounded-2xl shadow-xl ${darkMode ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'}`}>
              <Search className={`absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              <input type="text" placeholder={t.search} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-14 pr-6 py-4 rounded-2xl text-lg focus:outline-none ${darkMode ? 'bg-transparent text-white placeholder-gray-500' : 'bg-transparent text-gray-900 placeholder-gray-400'}`}/>
            </div>
          </motion.div>

          {loading ? (
            <div className="text-center py-20">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className={`w-16 h-16 border-4 rounded-full mx-auto ${darkMode ? 'border-white/10 border-t-orange-500' : 'border-gray-200 border-t-orange-500'}`}/>
            </div>
          ) : filteredBusinesses.length === 0 ? (
            <div className={`text-center py-20 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              <Store className="w-20 h-20 mx-auto mb-4 opacity-50" />
              <p className="text-xl">No businesses found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredBusinesses.map((business, i) => (
                <motion.a key={business.id} href={buildSubdomainUrl(business.slug)} target="_blank" rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }} whileHover={{ y: -8, scale: 1.02 }}
                  className={`group p-6 rounded-2xl transition-all ${darkMode ? 'bg-white/5 border border-white/10 hover:border-orange-500/50' : 'bg-white border border-gray-200 hover:border-orange-500'}`}>
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                      <Store className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className={`text-lg font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{business.name}</h3>
                      {business.businessType && (
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${darkMode ? 'bg-white/10 text-gray-300' : 'bg-orange-100 text-orange-700'}`}>
                          {business.businessType}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className={`mb-4 line-clamp-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{business.description || 'Quality products and services'}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-sm">
                      {business.rating > 0 && (
                        <span className="flex items-center gap-1 text-amber-500">
                          <Star className="w-4 h-4 fill-current" /><span className="font-semibold">{business.rating}</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-orange-500 font-semibold group-hover:gap-3 transition-all">
                      Visit Store<ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </motion.a>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-pink-600 to-purple-600" />
        <motion.div animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }} transition={{ duration: 15, repeat: Infinity }}
          className="absolute inset-0 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 opacity-50"
          style={{ backgroundSize: '200% 200%' }}/>
        <div className="relative z-10 max-w-4xl mx-auto text-center text-white">
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-4xl lg:text-6xl font-black mb-6">{t.cta}</motion.h2>
          <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ delay: 0.1 }} className="text-xl lg:text-2xl mb-10 opacity-90">{t.ctaSub}</motion.p>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setRegisterModalOpen(true)}
            className="px-10 py-5 bg-white text-orange-600 font-black text-lg rounded-2xl shadow-2xl hover:shadow-white/30 transition-all">
            Get Started Today →
          </motion.button>
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-16 px-6 ${darkMode ? 'bg-gray-950 border-t border-white/10' : 'bg-gray-900'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-black text-white">MyPadiBusiness</span>
              </div>
              <p className="text-gray-400 max-w-xs">Empowering businesses with modern e-commerce solutions.</p>
            </div>
            <div>
              <h3 className="font-bold text-white mb-4">Platform</h3>
              <ul className="space-y-2">
                {['Features', 'Pricing', 'Support'].map(item => (
                  <li key={item}><a href="#" className="text-gray-400 hover:text-orange-500 transition-colors">{item}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-white mb-4">Legal</h3>
              <ul className="space-y-2">
                {['Privacy', 'Terms', 'Security'].map(item => (
                  <li key={item}><a href="#" className="text-gray-400 hover:text-orange-500 transition-colors">{item}</a></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center" onClick={handleSecretTap}>
            <p className="text-gray-500 text-sm select-none">© {new Date().getFullYear()} MyPadiBusiness. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Registration Modal */}
      <AnimatePresence>
        {registerModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setRegisterModalOpen(false)}/>
            <div className="flex min-h-full items-center justify-center p-4">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className={`relative w-full max-w-2xl rounded-3xl shadow-2xl ${darkMode ? 'bg-gray-900 border border-white/10' : 'bg-white'}`}
                onClick={(e) => e.stopPropagation()}>
                <div className="p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>Join MyPadiBusiness</h2>
                      <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Start growing your business today</p>
                    </div>
                    <button onClick={() => setRegisterModalOpen(false)}
                      className={`p-2 rounded-xl transition-colors ${darkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}>
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  <form onSubmit={handleRegister} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[
                        { label: 'Business Name', key: 'businessName', type: 'text', ph: 'Your Business Name' },
                        { label: 'Owner Name',    key: 'ownerName',    type: 'text', ph: 'Your Full Name' },
                        { label: 'Email',         key: 'email',        type: 'email',ph: 'your@email.com' },
                        { label: 'Phone',         key: 'phone',        type: 'tel',  ph: '+234 800 000 0000' },
                      ].map(({ label, key, type, ph }) => (
                        <div key={key}>
                          <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{label} *</label>
                          <input type={type} required value={formData[key]}
                            onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                            className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-colors ${darkMode ? 'bg-white/5 border-white/10 focus:border-orange-500 text-white' : 'bg-white border-gray-200 focus:border-orange-500'}`}
                            placeholder={ph}/>
                        </div>
                      ))}
                    </div>
                    <div>
                      <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Business Type *</label>
                      <select required value={formData.businessType}
                        onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                        className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-colors ${darkMode ? 'bg-white/5 border-white/10 focus:border-orange-500 text-white' : 'bg-white border-gray-200 focus:border-orange-500'}`}>
                        <option value="">Select type...</option>
                        <option value="Restaurant">Restaurant</option>
                        <option value="Retail">Retail</option>
                        <option value="Fashion">Fashion</option>
                        <option value="Services">Services</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Description</label>
                      <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows="3"
                        className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-colors ${darkMode ? 'bg-white/5 border-white/10 focus:border-orange-500 text-white' : 'bg-white border-gray-200 focus:border-orange-500'}`}
                        placeholder="Tell us about your business..."/>
                    </div>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit"
                      className="w-full py-4 bg-gradient-to-r from-orange-500 to-pink-600 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all">
                      Submit Application →
                    </motion.button>
                    <p className={`text-center text-sm ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>We'll review your application within 24 hours</p>
                  </form>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Floating WhatsApp + Phone ─────────────────────────────────────────── */}
      <FloatingContacts darkMode={darkMode} />

    </div>
  );
};

export default MainLanding;