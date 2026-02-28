// frontend/src/components/public/HeroSection.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Phone, MapPin, Clock } from 'lucide-react';
import { HERO_IMGS } from '../../utils/constants';
import { WaIcon } from './WaIcon';

export function HeroSection({ business, primary, secondary, t, onShop }) {
  const [imgIdx, setImgIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setImgIdx(i => (i + 1) % HERO_IMGS.length), 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative overflow-hidden" style={{ minHeight: '62vh' }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={imgIdx}
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 1.4 }}
          className="absolute inset-0"
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${HERO_IMGS[imgIdx]})` }}
          />
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,.5)' }} />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to bottom,transparent 35%,rgba(0,0,0,.72) 100%)' }}
          />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-6 py-16 md:py-24 flex flex-col md:flex-row md:items-end gap-8">
        {business.logo && (
          <motion.img
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 20 }}
            src={business.logo}
            alt={business.name}
            className="w-24 h-24 md:w-28 md:h-28 rounded-3xl object-cover shadow-2xl flex-shrink-0"
            style={{ border: '4px solid rgba(255,255,255,.25)' }}
          />
        )}

        <div className="flex-1">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 text-sm font-semibold text-white"
            style={{
              background: 'rgba(255,255,255,.15)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,.25)',
            }}
          >
            <Sparkles className="w-4 h-4 text-amber-300" /> {t.heroReturn}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="sf-display sf-h1 font-bold text-white leading-tight mb-2 drop-shadow-lg"
            style={{ fontSize: 'clamp(2.2rem,5vw,3.8rem)' }}
          >
            {business.name}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="sf-display text-white/75 italic mb-4"
            style={{ fontSize: '1.15rem' }}
          >
            "{t.heroTagline}"
          </motion.p>

          {business.description && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22 }}
              className="text-white/65 text-base max-w-lg leading-relaxed mb-5"
            >
              {business.description}
            </motion.p>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.28 }}
            className="flex flex-wrap gap-4 mb-6 text-sm text-white/65"
          >
            {business.phone && (
              <a
                href={`tel:${business.phone}`}
                className="flex items-center gap-1.5 hover:text-white transition-colors"
              >
                <Phone className="w-4 h-4 text-emerald-400" /> {business.phone}
              </a>
            )}
            {business.address && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-rose-400" /> {business.address}
              </span>
            )}
            {business.businessHours && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400" /> {business.businessHours}
              </span>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.34 }}
            className="flex gap-3 flex-wrap"
          >
            <button
              onClick={onShop}
              className="px-7 py-3.5 rounded-2xl font-bold text-white transition-all hover:scale-105 shadow-lg"
              style={{ background: `linear-gradient(135deg,${primary},${secondary})` }}
            >
              {t.heroShop} →
            </button>
            {business.whatsappNumber && (
              <a
                href={`https://wa.me/${business.whatsappNumber.replace(/[^\d+]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-7 py-3.5 rounded-2xl font-bold text-white flex items-center gap-2 hover:scale-105 transition-all"
                style={{
                  background: 'rgba(255,255,255,.15)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,.3)',
                }}
              >
                <WaIcon size={18} /> Chat
              </a>
            )}
          </motion.div>
        </div>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
        {HERO_IMGS.map((_, i) => (
          <button
            key={i}
            onClick={() => setImgIdx(i)}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === imgIdx ? 20 : 6,
              height: 6,
              background: i === imgIdx ? primary : 'rgba(255,255,255,.35)',
            }}
          />
        ))}
      </div>
    </section>
  );
}