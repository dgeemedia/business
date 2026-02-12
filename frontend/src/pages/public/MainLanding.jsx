// frontend/src/pages/public/MainLanding.jsx
import React, { useState, useEffect } from 'react';
import { 
  Search, Store, TrendingUp, Users, ArrowRight, Moon, Sun, Globe, 
  CheckCircle, Star, Package, Clock, Zap, Shield, Sparkles,
  ChevronDown, X, Building2, Mail, Phone, MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../services/api';

const MainLanding = () => {
  const [businesses, setBusinesses] = useState([]);
  const [stats, setStats] = useState({ businesses: 0, orders: 0, customers: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('en');
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    businessType: '',
    description: '',
  });

  const languages = {
    en: { name: 'English', flag: '🇬🇧' },
    fr: { name: 'Français', flag: '🇫🇷' },
    es: { name: 'Español', flag: '🇪🇸' },
    ar: { name: 'العربية', flag: '🇸🇦' },
    yo: { name: 'Yorùbá', flag: '🇳🇬' },
    ig: { name: 'Igbo', flag: '🇳🇬' },
    ha: { name: 'Hausa', flag: '🇳🇬' },
  };

  const translations = {
    en: {
      hero: 'Transform Your Business',
      heroSub: 'Join thousands using MyPadiBusiness to manage operations, accept WhatsApp orders, and grow their empire',
      search: 'Search businesses...',
      explore: 'Explore Businesses',
      getStarted: 'Start Your Journey',
      activeBusiness: 'Active Businesses',
      ordersProcessed: 'Orders Processed',
      happyCustomers: 'Happy Customers',
      features: 'Why Choose Us',
      allCategories: 'All Categories',
    },
    fr: {
      hero: 'Transformez Votre Entreprise',
      heroSub: 'Rejoignez des milliers utilisant MyPadiBusiness pour gérer, accepter des commandes WhatsApp',
      search: 'Rechercher des entreprises...',
      explore: 'Explorer les Entreprises',
      getStarted: 'Commencez Maintenant',
      activeBusiness: 'Entreprises Actives',
      ordersProcessed: 'Commandes Traitées',
      happyCustomers: 'Clients Satisfaits',
      features: 'Pourquoi Nous Choisir',
      allCategories: 'Toutes Catégories',
    },
    es: {
      hero: 'Transforma Tu Negocio',
      heroSub: 'Únete a miles usando MyPadiBusiness para gestionar, aceptar pedidos WhatsApp',
      search: 'Buscar negocios...',
      explore: 'Explorar Negocios',
      getStarted: 'Comienza Ahora',
      activeBusiness: 'Negocios Activos',
      ordersProcessed: 'Pedidos Procesados',
      happyCustomers: 'Clientes Felices',
      features: 'Por Qué Elegirnos',
      allCategories: 'Todas Categorías',
    },
  };

  const t = translations[language] || translations.en;

  useEffect(() => {
    fetchData();
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') setDarkMode(true);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [businessesRes, statsRes] = await Promise.all([
        api.get('/api/business/public/all'),
        api.get('/api/stats/public').catch(() => ({ data: { stats: null } }))
      ]);
      
      setBusinesses(businessesRes.data.businesses || []);
      if (statsRes.data.stats) {
        setStats(statsRes.data.stats);
      } else {
        setStats({
          businesses: businessesRes.data.businesses?.length || 0,
          orders: businessesRes.data.businesses?.reduce((sum, b) => sum + (b.orderCount || 0), 0) || 0,
          customers: businessesRes.data.businesses?.reduce((sum, b) => sum + (b.customerCount || 0), 0) || 0,
        });
      }
    } catch (error) {
      console.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/business/register', formData);
      toast.success('Application submitted! We\'ll review and contact you soon.');
      setRegisterModalOpen(false);
      setFormData({
        businessName: '',
        ownerName: '',
        email: '',
        phone: '',
        businessType: '',
        description: '',
      });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to submit application');
    }
  };

  const filteredBusinesses = businesses.filter(b => {
    const matchesSearch = b.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         b.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || b.businessType === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...new Set(businesses.map(b => b.businessType).filter(Boolean))];

  const getBusinessUrl = (subdomain) => {
    if (import.meta.env.DEV) {
      return `/?subdomain=${subdomain}`;
    }
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    if (parts.length >= 2) {
      const domain = parts.slice(-2).join('.');
      return `${window.location.protocol}//${subdomain}.${domain}`;
    }
    return `/${subdomain}`;
  };

  const features = [
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Built for speed with modern tech stack',
      gradient: 'from-yellow-400 to-orange-500'
    },
    {
      icon: Shield,
      title: 'Secure & Reliable',
      description: 'Bank-level security for your data',
      gradient: 'from-blue-400 to-cyan-500'
    },
    {
      icon: Clock,
      title: '24/7 Support',
      description: 'Always here when you need us',
      gradient: 'from-purple-400 to-pink-500'
    },
    {
      icon: Sparkles,
      title: 'Easy to Use',
      description: 'Intuitive interface, zero learning curve',
      gradient: 'from-green-400 to-teal-500'
    }
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode ? 'dark bg-gradient-to-br from-gray-900 via-gray-800 to-black' : 'bg-gradient-to-br from-orange-50 via-white to-rose-50'
    }`}>
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-30">
        <motion.div
          animate={{ rotate: 360, scale: [1, 1.2, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className={`absolute -top-40 -right-40 w-96 h-96 ${darkMode ? 'bg-purple-500' : 'bg-orange-300'} rounded-full blur-3xl`}
        />
        <motion.div
          animate={{ rotate: -360, scale: [1, 1.3, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className={`absolute -bottom-40 -left-40 w-96 h-96 ${darkMode ? 'bg-blue-500' : 'bg-pink-300'} rounded-full blur-3xl`}
        />
      </div>

      {/* Header */}
      <header className={`sticky top-0 z-50 backdrop-blur-xl border-b ${
        darkMode ? 'bg-gray-900/80 border-gray-700' : 'bg-white/80 border-gray-200'
      }`}>
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="flex items-center gap-3"
            >
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center shadow-lg`}>
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className={`text-2xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  MyPadiBusiness
                </h1>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Empower • Grow • Succeed
                </p>
              </div>
            </motion.div>

            <div className="flex items-center gap-4">
              {/* Language Selector */}
              <div className="relative group">
                <button className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                  darkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}>
                  <Globe className="w-4 h-4" />
                  <span className="text-sm font-medium">{languages[language].flag}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                
                <div className={`absolute right-0 mt-2 w-48 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all ${
                  darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                }`}>
                  {Object.entries(languages).map(([code, lang]) => (
                    <button
                      key={code}
                      onClick={() => setLanguage(code)}
                      className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors first:rounded-t-xl last:rounded-b-xl ${
                        language === code
                          ? darkMode ? 'bg-gray-700 text-white' : 'bg-orange-50 text-orange-600'
                          : darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <span className="text-xl">{lang.flag}</span>
                      <span className="text-sm font-medium">{lang.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dark Mode Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-3 rounded-xl transition-all ${
                  darkMode ? 'bg-yellow-500 hover:bg-yellow-400 text-gray-900' : 'bg-gray-800 hover:bg-gray-900 text-yellow-400'
                }`}
              >
                <motion.div
                  initial={false}
                  animate={{ rotate: darkMode ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </motion.div>
              </button>

              {/* Register Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setRegisterModalOpen(true)}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold rounded-xl shadow-lg hover:shadow-orange-500/50 transition-all"
              >
                {t.getStarted}
              </motion.button>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section - Continuing in next part due to length */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500/10 to-pink-500/10 border border-orange-500/20 mb-8"
            >
              <Sparkles className="w-4 h-4 text-orange-500" />
              <span className={`text-sm font-semibold ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                Trusted by {stats.businesses}+ Businesses
              </span>
            </motion.div>

            <h1 className={`text-5xl md:text-7xl lg:text-8xl font-black mb-6 leading-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {t.hero}
              <br />
              <span className="bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 bg-clip-text text-transparent">
                Into Reality
              </span>
            </h1>

            <p className={`text-xl md:text-2xl mb-12 max-w-3xl mx-auto ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {t.heroSub}
            </p>

            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="max-w-2xl mx-auto mb-12"
            >
              <div className={`relative rounded-2xl shadow-2xl ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
                <Search className={`absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                <input
                  type="text"
                  placeholder={t.search}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-16 pr-6 py-5 rounded-2xl text-lg focus:outline-none ${
                    darkMode ? 'bg-gray-800 text-white placeholder-gray-500' : 'bg-white text-gray-900 placeholder-gray-400'
                  }`}
                />
              </div>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {[
                { icon: Store, label: t.activeBusiness, value: stats.businesses, gradient: 'from-orange-500 to-red-500' },
                { icon: Package, label: t.ordersProcessed, value: stats.orders, gradient: 'from-blue-500 to-cyan-500' },
                { icon: Users, label: t.happyCustomers, value: stats.customers, gradient: 'from-purple-500 to-pink-500' },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className={`relative p-8 rounded-2xl backdrop-blur-xl ${
                    darkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white/50 border border-white'
                  }`}
                >
                  <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${stat.gradient} mb-4`}>
                    <stat.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className={`text-4xl font-black mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {stat.value.toLocaleString()}+
                  </h3>
                  <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className={`py-20 px-4 ${darkMode ? 'bg-gray-900/50' : 'bg-white/50'}`}>
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className={`text-4xl md:text-5xl font-black mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {t.features}
            </h2>
            <p className={`text-xl ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Everything you need to succeed
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -10 }}
                className={`p-8 rounded-2xl backdrop-blur-xl transition-all ${
                  darkMode ? 'bg-gray-800/50 border border-gray-700 hover:border-gray-600' : 'bg-white/50 border border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${feature.gradient} mb-4`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {feature.title}
                </h3>
                <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map(category => (
              <motion.button
                key={category}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-3 rounded-xl whitespace-nowrap font-semibold transition-all ${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg'
                    : darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {category === 'all' ? t.allCategories : category}
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Businesses Grid */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className={`text-4xl font-black mb-12 text-center ${darkMode ? 'text-white' : 'text-gray-900'}`}
          >
            {t.explore}
          </motion.h2>

          {loading ? (
            <div className="text-center py-20">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className={`w-16 h-16 border-4 ${
                  darkMode ? 'border-gray-700 border-t-orange-500' : 'border-gray-200 border-t-orange-500'
                } rounded-full mx-auto`}
              />
            </div>
          ) : filteredBusinesses.length === 0 ? (
            <div className={`text-center py-20 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              <Store className="w-20 h-20 mx-auto mb-4 opacity-50" />
              <p className="text-xl">No businesses found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredBusinesses.map((business, index) => (
                <motion.a
                  key={business.id}
                  href={getBusinessUrl(business.subdomain)}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -10, scale: 1.02 }}
                  className={`group relative p-6 rounded-2xl backdrop-blur-xl transition-all ${
                    darkMode ? 'bg-gray-800/50 border border-gray-700 hover:border-orange-500' : 'bg-white/50 border border-gray-200 hover:border-orange-500'
                  }`}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                      <Store className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className={`text-xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {business.name}
                      </h3>
                      {business.businessType && (
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          darkMode ? 'bg-gray-700 text-gray-300' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {business.businessType}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className={`mb-4 line-clamp-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {business.description || 'Quality products and services'}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm">
                      {business.productCount > 0 && (
                        <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                          <Package className="w-4 h-4 inline mr-1" />
                          {business.productCount}
                        </span>
                      )}
                      {business.averageRating > 0 && (
                        <span className="text-yellow-500">
                          <Star className="w-4 h-4 inline mr-1 fill-current" />
                          {business.averageRating.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-orange-500 font-semibold group-hover:gap-3 transition-all">
                      Visit
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  </div>
                </motion.a>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 opacity-90" />
        <motion.div
          animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute inset-0 bg-gradient-to-r from-orange-600 via-pink-600 to-purple-600 opacity-50"
          style={{ backgroundSize: '200% 200%' }}
        />
        
        <div className="relative max-w-4xl mx-auto text-center text-white">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-black mb-6"
          >
            Ready to Transform?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl md:text-2xl mb-10 opacity-90"
          >
            Join MyPadiBusiness today and start your success story
          </motion.p>
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setRegisterModalOpen(true)}
            className="px-10 py-5 bg-white text-orange-600 font-black text-lg rounded-2xl shadow-2xl hover:shadow-white/50 transition-all"
          >
            Get Started Free →
          </motion.button>
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-16 px-4 ${darkMode ? 'bg-gray-900 border-t border-gray-800' : 'bg-gray-900 text-white'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
                <span className="text-2xl font-black text-white">MyPadiBusiness</span>
              </div>
              <p className="text-gray-400 mb-6 max-w-sm">
                Empowering businesses across Africa with modern e-commerce solutions and WhatsApp integration.
              </p>
              <div className="flex gap-4">
                {['T', 'F', 'I', 'L'].map(social => (
                  <a
                    key={social}
                    href="#"
                    className="w-10 h-10 rounded-xl bg-gray-800 hover:bg-orange-500 flex items-center justify-center transition-colors"
                  >
                    <span className="text-white font-bold">{social}</span>
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-bold text-white mb-4">Company</h3>
              <ul className="space-y-3">
                {['About', 'Features', 'Pricing', 'Contact'].map(item => (
                  <li key={item}>
                    <a href="#" className="text-gray-400 hover:text-orange-500 transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-white mb-4">Support</h3>
              <ul className="space-y-3">
                {['Help Center', 'Documentation', 'API', 'Status'].map(item => (
                  <li key={item}>
                    <a href="#" className="text-gray-400 hover:text-orange-500 transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between">
            <p className="text-gray-400 text-sm">
              © 2024 MyPadiBusiness. All rights reserved.
            </p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-orange-500 text-sm transition-colors">Privacy</a>
              <a href="#" className="text-gray-400 hover:text-orange-500 text-sm transition-colors">Terms</a>
              <a href="#" className="text-gray-400 hover:text-orange-500 text-sm transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Registration Modal */}
      <AnimatePresence>
        {registerModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setRegisterModalOpen(false)}
            />

            <div className="flex min-h-full items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`relative w-full max-w-2xl rounded-3xl shadow-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Join MyPadiBusiness
                      </h2>
                      <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                        Start your success story today
                      </p>
                    </div>
                    <button
                      onClick={() => setRegisterModalOpen(false)}
                      className={`p-2 rounded-xl transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <form onSubmit={handleRegister} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Business Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.businessName}
                          onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                          className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-colors ${
                            darkMode ? 'bg-gray-700 border-gray-600 focus:border-orange-500 text-white' : 'bg-white border-gray-200 focus:border-orange-500'
                          }`}
                          placeholder="e.g., Mama's Kitchen"
                        />
                      </div>

                      <div>
                        <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Owner Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.ownerName}
                          onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                          className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-colors ${
                            darkMode ? 'bg-gray-700 border-gray-600 focus:border-orange-500 text-white' : 'bg-white border-gray-200 focus:border-orange-500'
                          }`}
                          placeholder="Your full name"
                        />
                      </div>

                      <div>
                        <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Email *
                        </label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-colors ${
                            darkMode ? 'bg-gray-700 border-gray-600 focus:border-orange-500 text-white' : 'bg-white border-gray-200 focus:border-orange-500'
                          }`}
                          placeholder="your@email.com"
                        />
                      </div>

                      <div>
                        <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Phone *
                        </label>
                        <input
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-colors ${
                            darkMode ? 'bg-gray-700 border-gray-600 focus:border-orange-500 text-white' : 'bg-white border-gray-200 focus:border-orange-500'
                          }`}
                          placeholder="+234 800 000 0000"
                        />
                      </div>
                    </div>

                    <div>
                      <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Business Type *
                      </label>
                      <select
                        required
                        value={formData.businessType}
                        onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                        className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-colors ${
                          darkMode ? 'bg-gray-700 border-gray-600 focus:border-orange-500 text-white' : 'bg-white border-gray-200 focus:border-orange-500'
                        }`}
                      >
                        <option value="">Select type...</option>
                        <option value="Restaurant">Restaurant</option>
                        <option value="Retail">Retail Store</option>
                        <option value="Services">Services</option>
                        <option value="Fashion">Fashion</option>
                        <option value="Electronics">Electronics</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows="3"
                        className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-colors ${
                          darkMode ? 'bg-gray-700 border-gray-600 focus:border-orange-500 text-white' : 'bg-white border-gray-200 focus:border-orange-500'
                        }`}
                        placeholder="Tell us about your business..."
                      />
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      className="w-full py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-orange-500/50 transition-all"
                    >
                      Submit Application →
                    </motion.button>

                    <p className={`text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      We'll review your application and contact you within 24 hours
                    </p>
                  </form>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MainLanding;