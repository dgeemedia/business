// frontend/src/components/public/FloatingContacts.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, X } from 'lucide-react';
import { WaIcon } from './WaIcon';

export function FloatingContacts({ business, dark, t }) {
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
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 8 }}
            className="rounded-2xl shadow-2xl overflow-hidden mb-1"
            style={{
              width: 292,
              background: dark ? '#1c1c1e' : 'white',
              border: `1px solid ${dark ? 'rgba(255,255,255,.08)' : '#e8e4dc'}`,
            }}
          >
            <div className="flex items-center justify-between px-4 py-3" style={{ background: '#075E54' }}>
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,.2)' }}
                >
                  <WaIcon size={17} />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm leading-none">{business?.name}</p>
                  <p className="text-green-200 text-xs mt-0.5">● Online</p>
                </div>
              </div>
              <button onClick={() => setWaOpen(false)} className="text-white/60 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 space-y-1.5">
              <p className="text-xs font-semibold px-1 mb-2" style={{ color: dark ? 'rgba(255,255,255,.35)' : '#a8a099' }}>
                {t.chatHelp}
              </p>
              {preformed.map((msg, i) => {
                const emojis = msg.match(emojiRe) || [];
                const emoji = emojis[emojis.length - 1] || '💬';
                const text = msg.replace(emojiRe, '').trim();
                return (
                  <motion.a
                    key={i}
                    href={`https://wa.me/${waNum}?text=${encodeURIComponent(msg)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setWaOpen(false)}
                    className="flex items-center gap-2 w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors"
                    style={{ background: dark ? 'rgba(255,255,255,.06)' : '#f5f3f0' }}
                  >
                    <span className="text-lg flex-shrink-0">{emoji}</span>
                    <span className="text-xs leading-snug" style={{ color: dark ? 'rgba(255,255,255,.7)' : '#4b5563' }}>
                      {text}
                    </span>
                  </motion.a>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {phone && (
        <motion.a
          href={`tel:${phone}`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          title={t.callUs}
          className="w-[52px] h-[52px] rounded-full flex items-center justify-center text-white shadow-xl sf-phone-ring"
          style={{ background: '#3B82F6' }}
        >
          <Phone className="w-5 h-5" />
        </motion.a>
      )}

      {waNum && (
        <motion.button
          onClick={() => setWaOpen(o => !o)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          title={t.chatUs}
          className="w-[58px] h-[58px] rounded-full flex items-center justify-center text-white shadow-2xl sf-wa-pulse"
          style={{ background: '#25D366' }}
        >
          <WaIcon size={27} />
        </motion.button>
      )}
    </div>
  );
}