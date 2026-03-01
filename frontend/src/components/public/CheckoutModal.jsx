// frontend/src/components/public/CheckoutModal.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { formatCurrency } from '../../utils/helpers';
import { WaIcon } from './WaIcon';

export function CheckoutModal({ cart, business, dark, primary, secondary, onClose, onSuccess, t }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const currency = business?.currency || 'NGN';
  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const tax = business?.taxRate ? (subtotal * business.taxRate) / 100 : 0;
  const delivery = business?.deliveryFee || 0;
  const total = subtotal + tax + delivery;

  const fld = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const buildWhatsAppMsg = () => {
    let m = `🛍️ *New Order — ${form.name}*\n\n📱 Phone: ${form.phone}\n`;
    if (form.email) m += `📧 Email: ${form.email}\n`;
    m += `📍 Delivery: ${form.address}\n\n━━━━━━━━━━━━━\n*Order Items:*\n━━━━━━━━━━━━━\n`;
    cart.forEach((item, i) => {
      m += `\n${i + 1}. *${item.name}*\n   ${item.quantity} × ${formatCurrency(item.price, currency)} = ${formatCurrency(
        item.price * item.quantity,
        currency
      )}\n`;
    });
    m += `\n━━━━━━━━━━━━━\n${t.subtotal}: ${formatCurrency(subtotal, currency)}\n`;
    if (tax > 0) m += `${t.tax} (${business.taxRate}%): ${formatCurrency(tax, currency)}\n`;
    if (delivery > 0) m += `${t.delivery}: ${formatCurrency(delivery, currency)}\n`;
    m += `*TOTAL: ${formatCurrency(total, currency)}*\n`;
    if (form.message) m += `\n📝 Note: ${form.message}\n`;
    m += `\nThank you for shopping at *${business?.name || 'the store'}* 🙏`;
    return m;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!business?.whatsappNumber) {
      toast.error('WhatsApp not configured');
      return;
    }
    setSubmitting(true);

    try {
      await api.post('/api/orders/checkout', {
        customerName: form.name,
        phone: form.phone,
        email: form.email || '',
        address: form.address,
        message: form.message || '',
        businessId: business.id,
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity,
        })),
      });
    } catch (err) {
      const msg = err?.response?.data?.error || 'Failed to place order. Please try again.';
      toast.error(msg);
      setSubmitting(false);
      return;
    }

    window.open(
      `https://wa.me/${business.whatsappNumber.replace(/[^\d+]/g, '')}?text=${encodeURIComponent(buildWhatsAppMsg())}`,
      '_blank'
    );

    setTimeout(() => {
      setSubmitting(false);
      onSuccess();
    }, 500);
  };

  const inp = { background: dark ? 'rgba(255,255,255,.06)' : '#fefefe', color: dark ? '#f0ede8' : '#1a1a1a' };
  const lbl = { color: dark ? 'rgba(255,255,255,.65)' : '#374151' };

  return (
    <>
      <div className="sf-overlay" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="fixed inset-x-4 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 top-6 bottom-6 md:top-8 md:bottom-8 rounded-3xl shadow-2xl z-[110] flex flex-col overflow-hidden"
        style={{ maxWidth: '520px', width: '100%', background: dark ? '#1c1c1e' : 'white' }}
      >
        <div
          className="px-7 py-6 flex items-center justify-between flex-shrink-0"
          style={{ background: `linear-gradient(135deg,${primary},${secondary})` }}
        >
          <div>
            <h2 className="sf-display text-2xl font-bold text-white">{t.placeOrder}</h2>
            <p className="text-white/80 text-sm mt-0.5">{t.placeOrderSub}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div
            className="px-7 py-4"
            style={{
              background: dark ? 'rgba(255,255,255,.03)' : '#f9f8f6',
              borderBottom: `1px solid ${dark ? 'rgba(255,255,255,.06)' : '#f0ede8'}`,
            }}
          >
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: dark ? 'rgba(255,255,255,.4)' : '#78716c' }}>
                {cart.length} {cart.length !== 1 ? t.items : t.item} · {cart.reduce((s, i) => s + i.quantity, 0)} {t.units}
              </span>
              <span className="sf-display font-bold text-lg" style={{ color: dark ? '#f0ede8' : '#1a1a1a' }}>
                {formatCurrency(total, currency)}
              </span>
            </div>
          </div>

          <form id="sf-checkout" onSubmit={handleSubmit} className="px-7 py-6 space-y-4">
            {[
              { k: 'name', l: t.fullName, type: 'text', ph: t.namePH, req: true },
              { k: 'phone', l: t.phone, type: 'tel', ph: t.phonePH, req: true },
              { k: 'email', l: t.email, type: 'email', ph: t.emailPH, req: false },
            ].map(({ k, l, type, ph, req }) => (
              <div key={k}>
                <label className="text-sm font-semibold block mb-1.5" style={lbl}>
                  {l}{' '}
                  {req ? (
                    <span className="text-red-400">*</span>
                  ) : (
                    <span className="font-normal text-xs" style={{ color: dark ? '#555' : '#a8a099' }}>
                      ({t.optional})
                    </span>
                  )}
                </label>
                <input
                  className="sf-input"
                  style={inp}
                  type={type}
                  placeholder={ph}
                  value={form[k]}
                  onChange={fld(k)}
                  required={req}
                />
              </div>
            ))}

            <div>
              <label className="text-sm font-semibold block mb-1.5" style={lbl}>
                {t.deliveryAddr} <span className="text-red-400">*</span>
              </label>
              <textarea
                className="sf-input"
                style={{ ...inp, resize: 'none' }}
                rows={2}
                placeholder={t.addrPH}
                value={form.address}
                onChange={fld('address')}
                required
              />
            </div>

            <div>
              <label className="text-sm font-semibold block mb-1.5" style={lbl}>
                {t.note}{' '}
                <span className="font-normal text-xs" style={{ color: dark ? '#555' : '#a8a099' }}>
                  ({t.optional})
                </span>
              </label>
              <textarea
                className="sf-input"
                style={{ ...inp, resize: 'none' }}
                rows={2}
                placeholder={t.notePH}
                value={form.message}
                onChange={fld('message')}
              />
            </div>
          </form>
        </div>

        <div
          className="px-7 pb-7 pt-4 flex-shrink-0"
          style={{ borderTop: `1px solid ${dark ? 'rgba(255,255,255,.06)' : '#f1f0ee'}` }}
        >
          <button form="sf-checkout" type="submit" className="sf-wa-btn" disabled={submitting}>
            {submitting ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
              >
                <Send className="w-5 h-5" />
              </motion.div>
            ) : (
              <>
                <WaIcon size={20} /> {t.sendWhatsApp}
              </>
            )}
          </button>
          <p className="text-center text-xs mt-3" style={{ color: dark ? 'rgba(255,255,255,.25)' : '#a8a099' }}>
            {t.redirectNotice}
          </p>
        </div>
      </motion.div>
    </>
  );
}