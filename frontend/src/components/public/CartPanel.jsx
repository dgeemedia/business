// frontend/src/components/public/CartPanel.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, Package, ChevronRight } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';

export function CartPanel({ cart, business, dark, primary, onClose, onUpdateQty, onRemove, onCheckout, t }) {
  const currency = business?.currency || 'NGN';
  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const tax = business?.taxRate ? (subtotal * business.taxRate) / 100 : 0;
  const delivery = business?.deliveryFee || 0;
  const total = subtotal + tax + delivery;

  return (
    <>
      <div className="sf-overlay" onClick={onClose} />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="fixed right-0 top-0 bottom-0 z-[110] flex flex-col shadow-2xl"
        style={{ width: 'min(420px,100vw)', background: dark ? '#1c1c1e' : 'white' }}
      >
        <div
          className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: `1px solid ${dark ? 'rgba(255,255,255,.07)' : '#f1f0ee'}` }}
        >
          <div>
            <h2 className="sf-display font-bold text-xl" style={{ color: dark ? '#f0ede8' : '#1a1a1a' }}>
              {t.yourCart}
            </h2>
            <p className="text-sm mt-0.5" style={{ color: dark ? 'rgba(255,255,255,.35)' : '#a8a099' }}>
              {cart.reduce((s, i) => s + i.quantity, 0)} {cart.reduce((s, i) => s + i.quantity, 0) !== 1 ? t.items : t.item}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl"
            style={{ background: dark ? 'rgba(255,255,255,.06)' : '#f5f3f0' }}
          >
            <X className="w-5 h-5" style={{ color: dark ? '#888' : '#666' }} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          <AnimatePresence>
            {cart.map(item => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20, height: 0 }}
                className="flex gap-3 p-3 rounded-2xl"
                style={{ background: dark ? 'rgba(255,255,255,.05)' : '#f9f7f4' }}
              >
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded-xl flex-shrink-0"
                  />
                ) : (
                  <div
                    className="w-16 h-16 rounded-xl flex-shrink-0 flex items-center justify-center"
                    style={{ background: dark ? 'rgba(255,255,255,.08)' : '#e8e4dc' }}
                  >
                    <Package className="w-6 h-6" style={{ color: dark ? '#555' : '#ccc' }} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate" style={{ color: dark ? '#f0ede8' : '#1a1a1a' }}>
                    {item.name}
                  </p>
                  <p className="text-sm font-bold mt-0.5" style={{ color: primary }}>
                    {formatCurrency(item.price, currency)}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    {[-1, null, 1].map((d, i) =>
                      d === null ? (
                        <span key="q" className="text-sm font-semibold w-5 text-center">
                          {item.quantity}
                        </span>
                      ) : (
                        <button
                          key={d}
                          onClick={() => onUpdateQty(item.id, d)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{
                            background: dark ? 'rgba(255,255,255,.08)' : 'white',
                            border: `1px solid ${dark ? 'rgba(255,255,255,.1)' : '#e5e0d8'}`,
                          }}
                        >
                          {d < 0 ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                        </button>
                      )
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end justify-between">
                  <button onClick={() => onRemove(item.id)} className="p-1 text-red-400 hover:text-red-500">
                    <X className="w-4 h-4" />
                  </button>
                  <p className="text-sm font-bold" style={{ color: dark ? '#f0ede8' : '#1a1a1a' }}>
                    {formatCurrency(item.price * item.quantity, currency)}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div
          className="px-6 py-5 space-y-3"
          style={{ borderTop: `1px solid ${dark ? 'rgba(255,255,255,.07)' : '#f1f0ee'}` }}
        >
          <div className="space-y-2 text-sm">
            <div
              className="flex justify-between"
              style={{ color: dark ? 'rgba(255,255,255,.5)' : '#78716c' }}
            >
              <span>{t.subtotal}</span>
              <span className="font-medium">{formatCurrency(subtotal, currency)}</span>
            </div>
            {tax > 0 && (
              <div
                className="flex justify-between"
                style={{ color: dark ? 'rgba(255,255,255,.5)' : '#78716c' }}
              >
                <span>
                  {t.tax} ({business.taxRate}%)
                </span>
                <span className="font-medium">{formatCurrency(tax, currency)}</span>
              </div>
            )}
            {delivery > 0 && (
              <div
                className="flex justify-between"
                style={{ color: dark ? 'rgba(255,255,255,.5)' : '#78716c' }}
              >
                <span>{t.delivery}</span>
                <span className="font-medium">{formatCurrency(delivery, currency)}</span>
              </div>
            )}
            <div
              className="flex justify-between text-lg font-bold pt-2"
              style={{
                borderTop: `1px solid ${dark ? 'rgba(255,255,255,.07)' : '#f1f0ee'}`,
                color: dark ? '#f0ede8' : '#1a1a1a',
              }}
            >
              <span className="sf-display">{t.total}</span>
              <span>{formatCurrency(total, currency)}</span>
            </div>
          </div>
          <button className="sf-btn-primary w-full justify-center text-base py-4" onClick={onCheckout}>
            {t.checkout} <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    </>
  );
}