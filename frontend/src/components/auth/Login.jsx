// frontend/src/components/auth/Login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Building2, Moon, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import useAuthStore from '../../stores/authStore';
// ✅ REMOVED: getSubdomain — no longer used anywhere in auth flow.
// Login routing is now purely role-based, not domain-based.

const Login = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { login } = useAuthStore();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading,  setLoading]  = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  // ── Business showcase images ──────────────────────────────────────────────
  const businessShowcase = [
    { type: 'restaurant',   image: 'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&w=1920' },
    { type: 'hotel',        image: 'https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=1920' },
    { type: 'fashion',      image: 'https://images.pexels.com/photos/1884581/pexels-photo-1884581.jpeg?auto=compress&cs=tinysrgb&w=1920' },
    { type: 'electronics',  image: 'https://images.pexels.com/photos/1334598/pexels-photo-1334598.jpeg?auto=compress&cs=tinysrgb&w=1920' },
    { type: 'pharmacy',     image: 'https://images.pexels.com/photos/3683041/pexels-photo-3683041.jpeg?auto=compress&cs=tinysrgb&w=1920' },
    { type: 'cars',         image: 'https://images.pexels.com/photos/164634/pexels-photo-164634.jpeg?auto=compress&cs=tinysrgb&w=1920' },
    { type: 'farm',         image: 'https://images.pexels.com/photos/1002703/pexels-photo-1002703.jpeg?auto=compress&cs=tinysrgb&w=1920' },
    { type: 'beauty',       image: 'https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=1920' },
    { type: 'bookstore',    image: 'https://images.pexels.com/photos/1106468/pexels-photo-1106468.jpeg?auto=compress&cs=tinysrgb&w=1920' },
    { type: 'supermarket',  image: 'https://images.pexels.com/photos/264636/pexels-photo-264636.jpeg?auto=compress&cs=tinysrgb&w=1920' },
    { type: 'phones',       image: 'https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg?auto=compress&cs=tinysrgb&w=1920' },
    { type: 'laptops',      image: 'https://images.pexels.com/photos/303383/pexels-photo-303383.jpeg?auto=compress&cs=tinysrgb&w=1920' },
    { type: 'food',         image: 'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg?auto=compress&cs=tinysrgb&w=1920' },
    { type: 'auto-parts',   image: 'https://images.pexels.com/photos/3806288/pexels-photo-3806288.jpeg?auto=compress&cs=tinysrgb&w=1920' },
    { type: 'gym',          image: 'https://images.pexels.com/photos/1954524/pexels-photo-1954524.jpeg?auto=compress&cs=tinysrgb&w=1920' },
    { type: 'bakery',       image: 'https://images.pexels.com/photos/1070850/pexels-photo-1070850.jpeg?auto=compress&cs=tinysrgb&w=1920' },
    { type: 'jewelry',      image: 'https://images.pexels.com/photos/1927624/pexels-photo-1927624.jpeg?auto=compress&cs=tinysrgb&w=1920' },
    { type: 'furniture',    image: 'https://images.pexels.com/photos/1350789/pexels-photo-1350789.jpeg?auto=compress&cs=tinysrgb&w=1920' },
    { type: 'laundry',      image: 'https://images.pexels.com/photos/6197122/pexels-photo-6197122.jpeg?auto=compress&cs=tinysrgb&w=1920' },
    { type: 'printing',     image: 'https://images.pexels.com/photos/1089930/pexels-photo-1089930.jpeg?auto=compress&cs=tinysrgb&w=1920' },
  ];

  // ── Theme ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (localStorage.getItem('theme') === 'dark') setDarkMode(true);
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // ── Background rotation ───────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(
      () => setCurrentVideoIndex(p => (p + 1) % businessShowcase.length),
      4000
    );
    return () => clearInterval(id);
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleChange = e =>
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await login(formData);
      const role = response.user?.role;

      toast.success('Welcome back!');

      // ✅ PURE ROLE-BASED ROUTING — works identically whether the user
      // arrived from the landing page (/), a storefront (/store/slug),
      // or typed /login directly.
      //
      // Flow:
      //   super-admin  → /super-admin/dashboard
      //   admin/staff  → /dashboard
      //
      // If the user was redirected to /login from a protected page,
      // React Router stores the attempted path in location.state.from.
      // We respect that "intended destination" so they land back where
      // they were trying to go, unless it would be the wrong section for
      // their role.

      if (role === 'super-admin') {
        // Super-admin: always go to super-admin panel.
        // If they tried to access a super-admin route directly, honour it.
        const from = location.state?.from?.pathname;
        const isSuperAdminRoute = from?.startsWith('/super-admin');
        navigate(isSuperAdminRoute ? from : '/super-admin/dashboard', { replace: true });
      } else {
        // Business admin / staff: always go to business dashboard.
        // If they tried to access a dashboard route directly, honour it.
        const from = location.state?.from?.pathname;
        const isDashboardRoute = from?.startsWith('/dashboard');
        navigate(isDashboardRoute ? from : '/dashboard', { replace: true });
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // ── UI ────────────────────────────────────────────────────────────────────
  return (
    <div className={`min-h-screen relative flex items-center justify-center p-4 overflow-hidden transition-colors duration-500 ${
      darkMode ? 'bg-black' : 'bg-white'
    }`}>

      {/* Animated Background */}
      <div className="absolute inset-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentVideoIndex}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 1.2 }}
            className="absolute inset-0"
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url('${businessShowcase[currentVideoIndex].image}')` }}
            />
            <div className={`absolute inset-0 ${
              darkMode
                ? 'bg-gradient-to-b from-black/80 via-black/75 to-black/85'
                : 'bg-gradient-to-b from-black/60 via-black/50 to-black/70'
            }`} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Theme Toggle */}
      <motion.button
        onClick={() => setDarkMode(d => !d)}
        className={`fixed top-6 right-6 z-50 p-3 rounded-xl transition-all shadow-lg ${
          darkMode ? 'bg-amber-500 hover:bg-amber-400 text-gray-900' : 'bg-gray-900 hover:bg-gray-800 text-amber-400'
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div animate={{ rotate: darkMode ? 180 : 0 }} transition={{ duration: 0.3 }}>
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </motion.div>
      </motion.button>

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-pink-600 rounded-2xl mb-4 shadow-2xl"
          >
            <Building2 className="w-8 h-8 text-white" />
          </motion.div>
          {/* ✅ Single neutral title — works for all users on all pages */}
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
            Sign In
          </h1>
          <p className="text-white/80 drop-shadow-md">
            Access your dashboard
          </p>
        </div>

        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          className={`rounded-2xl shadow-2xl p-8 backdrop-blur-xl border ${
            darkMode
              ? 'bg-gray-900/90 border-white/10'
              : 'bg-white/95 border-white/20'
          }`}
        >
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div>
              <label className={`block text-sm font-semibold mb-2 ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Email Address
              </label>
              <div className="relative">
                <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${
                  darkMode ? 'text-gray-500' : 'text-gray-400'
                }`} />
                <input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 focus:outline-none transition-colors ${
                    darkMode
                      ? 'bg-white/5 border-white/10 focus:border-orange-500 text-white placeholder-gray-500'
                      : 'bg-white border-gray-200 focus:border-orange-500 text-gray-900 placeholder-gray-400'
                  }`}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className={`block text-sm font-semibold mb-2 ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Password
              </label>
              <div className="relative">
                <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${
                  darkMode ? 'text-gray-500' : 'text-gray-400'
                }`} />
                <input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 focus:outline-none transition-colors ${
                    darkMode
                      ? 'bg-white/5 border-white/10 focus:border-orange-500 text-white placeholder-gray-500'
                      : 'bg-white border-gray-200 focus:border-orange-500 text-gray-900 placeholder-gray-400'
                  }`}
                />
              </div>
            </div>

            {/* Remember me + Forgot */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className={`rounded border-2 ${
                    darkMode ? 'border-white/20 bg-white/5' : 'border-gray-300 bg-white'
                  }`}
                />
                <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Remember me</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-orange-400 hover:text-orange-300 font-medium transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-orange-500 to-pink-600 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                />
              ) : (
                <>Sign In <ArrowRight className="w-5 h-5" /></>
              )}
            </motion.button>
          </form>

          {/* Support link */}
          <div className="mt-6 text-center">
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Need help?{' '}
              <a
                href="mailto:support@mypadibusiness.com"
                className="text-orange-400 hover:text-orange-300 font-semibold transition-colors"
              >
                Contact Support
              </a>
            </p>
          </div>
        </motion.div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-white/60">
          <p>© 2026 MyPadiBusiness. All rights reserved.</p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;