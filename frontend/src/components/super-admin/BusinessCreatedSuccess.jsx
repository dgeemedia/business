// frontend/src/components/super-admin/BusinessCreatedSuccess.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle, Copy, Check, Printer, X,
  User, Lock, Gift, Building2
} from 'lucide-react';

const ROOT_DOMAIN = import.meta.env.VITE_ROOT_DOMAIN || 'yourdomain.com';

function fmt(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

// ─── Copy button ─────────────────────────────────────────────────────────────
function CopyBtn({ value }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button onClick={handle} style={styles.copyBtn}>
      {copied
        ? <><Check size={12} style={{ marginRight: 3 }} />Copied</>
        : <><Copy size={12} style={{ marginRight: 3 }} />Copy</>}
    </button>
  );
}

// ─── Field row ────────────────────────────────────────────────────────────────
function Field({ label, value, mono, highlight }) {
  return (
    <div style={styles.field}>
      <span style={styles.fieldLabel}>{label}</span>
      <div style={styles.fieldRow}>
        <span style={{
          ...styles.fieldValue,
          ...(mono ? styles.mono : {}),
          ...(highlight ? styles.highlight : {}),
        }}>
          {value || '—'}
        </span>
        {value && <CopyBtn value={value} />}
      </div>
    </div>
  );
}

// ─── Section heading ──────────────────────────────────────────────────────────
function SectionHead({ icon: Icon, children }) {
  return (
    <div style={styles.sectionHead}>
      <Icon size={13} color="#94a3b8" />
      <span>{children}</span>
    </div>
  );
}

// ─── Opens a fresh browser window that auto-prints ────────────────────────────
// This is the only reliable cross-browser approach — window.print() inside
// the React app cannot hide/show the right DOM nodes on all browsers.
function openPrintWindow({ business, admin, subscription }) {
  const subdomainUrl = `https://${business.slug}.${ROOT_DOMAIN}`;
  const issuedAt     = fmt(new Date());
  const trialEnd     = fmt(subscription?.expiresAt);
  const fullName     = `${admin.firstName || ''} ${admin.lastName || ''}`.trim();

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Credentials — ${escHtml(business.businessName)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500;600&family=JetBrains+Mono:wght@500&display=swap');

    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    body{
      font-family:'DM Sans',sans-serif;background:#fff;color:#0f172a;
      -webkit-print-color-adjust:exact;print-color-adjust:exact;
    }
    .sheet{max-width:680px;margin:0 auto;padding-bottom:40px}

    /* Header */
    .hdr{
      background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%);
      padding:36px 40px 28px;position:relative;overflow:hidden;
    }
    .hdr::before{
      content:'';position:absolute;inset:0;
      background:repeating-linear-gradient(45deg,transparent,transparent 24px,rgba(255,255,255,.025) 24px,rgba(255,255,255,.025) 25px);
    }
    .badge{
      display:inline-flex;align-items:center;gap:6px;
      background:rgba(5,150,105,.2);border:1px solid rgba(5,150,105,.4);
      color:#6ee7b7;font-size:11px;font-weight:600;
      letter-spacing:.08em;text-transform:uppercase;
      padding:4px 12px;border-radius:99px;margin-bottom:14px;
    }
    .title{
      font-family:'Playfair Display',Georgia,serif;
      font-size:28px;font-weight:700;color:#fff;line-height:1.15;margin-bottom:6px;
    }
    .sub{font-size:13px;color:#94a3b8}
    .issued{position:absolute;top:36px;right:40px;font-size:11px;color:#64748b;text-align:right}
    .issued strong{display:block;color:#94a3b8;font-size:10px;text-transform:uppercase;letter-spacing:.06em;margin-bottom:2px}

    /* Body */
    .body{padding:28px 40px 0}

    /* Trial */
    .trial{
      background:#ecfdf5;border:1.5px solid #6ee7b7;border-radius:10px;
      padding:16px 20px;display:flex;gap:14px;align-items:flex-start;margin-bottom:28px;
    }
    .trial-icon{
      width:38px;height:38px;flex-shrink:0;
      background:#059669;border-radius:50%;
      display:flex;align-items:center;justify-content:center;font-size:18px;
    }
    .trial-title{font-size:15px;font-weight:700;color:#065f46;margin-bottom:3px}
    .trial-desc{font-size:13px;color:#047857}
    .trial-dates{margin-top:8px;display:flex;gap:20px}
    .trial-date{font-size:12px;color:#065f46}
    .trial-date strong{display:block;font-size:10px;color:#059669;text-transform:uppercase;letter-spacing:.06em}

    /* Section head */
    .sh{
      font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;
      color:#94a3b8;padding-bottom:8px;border-bottom:1px solid #e2e8f0;
      margin:28px 0 14px;
    }

    /* Grid */
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
    .full{grid-column:1/-1}

    /* Field */
    .f{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px 14px}
    .fl{display:block;font-size:10px;font-weight:600;letter-spacing:.07em;text-transform:uppercase;color:#94a3b8;margin-bottom:4px}
    .fv{font-size:14px;font-weight:500;color:#0f172a;word-break:break-all}
    .mono{font-family:'JetBrains Mono',monospace;font-size:13px}
    .hl{
      display:inline-block;background:#fef9c3;padding:2px 8px;border-radius:4px;
      font-family:'JetBrains Mono',monospace;font-size:15px;font-weight:700;
      color:#92400e;letter-spacing:.06em;
    }

    /* Warning */
    .warn{
      background:#fffbeb;border:1px solid #fde68a;border-radius:8px;
      padding:11px 14px;font-size:12px;color:#92400e;margin-bottom:12px;
    }

    /* Footer */
    .foot{margin-top:32px;padding-top:14px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;text-align:center}

    @page{size:A4;margin:10mm 15mm}
  </style>
</head>
<body>
<div class="sheet">

  <div class="hdr">
    <div class="issued"><strong>Issued</strong>${issuedAt}</div>
    <div class="badge">✓ Business Created</div>
    <h1 class="title">${escHtml(business.businessName)}</h1>
    <p class="sub">Platform credentials — keep this information secure</p>
  </div>

  <div class="body">

    ${subscription?.isTrial ? `
    <div class="trial">
      <div class="trial-icon">🎁</div>
      <div>
        <p class="trial-title">14-Day Free Trial Active</p>
        <p class="trial-desc">Full access to all platform features — no payment required.</p>
        <div class="trial-dates">
          <div class="trial-date"><strong>Started</strong>${issuedAt}</div>
          <div class="trial-date"><strong>Expires</strong>${trialEnd}</div>
        </div>
      </div>
    </div>` : ''}

    <div class="sh">🏢 &nbsp;Business Details</div>
    <div class="grid">
      <div class="f full"><span class="fl">Store URL</span><span class="fv mono">${escHtml(subdomainUrl)}</span></div>
      <div class="f"><span class="fl">Business Name</span><span class="fv">${escHtml(business.businessName)}</span></div>
      <div class="f"><span class="fl">Slug / Subdomain</span><span class="fv mono">${escHtml(business.slug)}</span></div>
      <div class="f"><span class="fl">Phone</span><span class="fv">${escHtml(business.phone || '—')}</span></div>
      <div class="f"><span class="fl">WhatsApp</span><span class="fv">${escHtml(business.whatsappNumber || '—')}</span></div>
      ${business.businessType ? `<div class="f"><span class="fl">Category</span><span class="fv">${escHtml(business.businessType.replace(/_/g, ' '))}</span></div>` : ''}
      ${business.description  ? `<div class="f full"><span class="fl">Description</span><span class="fv">${escHtml(business.description)}</span></div>` : ''}
    </div>

    <div class="sh">👤 &nbsp;Admin / Owner Login Credentials</div>
    <div class="warn">
      ⚠️ &nbsp;The temporary password below is shown <strong>only once</strong>.
      Share it securely and ask the owner to change it on first login.
    </div>
    <div class="grid">
      <div class="f"><span class="fl">Full Name</span><span class="fv">${escHtml(fullName || '—')}</span></div>
      <div class="f"><span class="fl">Admin ID</span><span class="fv mono">#${admin.id}</span></div>
      <div class="f full"><span class="fl">Email (Login)</span><span class="fv mono">${escHtml(admin.email)}</span></div>
      <div class="f full"><span class="fl">Temporary Password</span><span class="fv"><span class="hl">${escHtml(admin.temporaryPassword)}</span></span></div>
    </div>

    <p class="foot">Generated by Platform Admin &middot; ${issuedAt} &middot; Confidential</p>

  </div>
</div>
<script>
  // Auto-open print dialog once fonts/layout are ready
  window.addEventListener('load', function () {
    setTimeout(function () {
      window.print();
      window.addEventListener('afterprint', function () { window.close(); });
    }, 400);
  });
</script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=820,height=960,noopener');
  if (!win) {
    alert('Pop-ups are blocked. Please allow pop-ups for this site and click Print again.');
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}

// Minimal HTML escaping to prevent XSS in the print window
function escHtml(str) {
  if (!str && str !== 0) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── Inline styles (screen only) ─────────────────────────────────────────────
const styles = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 9999,
    background: 'rgba(15,23,42,.72)', backdropFilter: 'blur(6px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 24, overflowY: 'auto',
  },
  sheet: {
    background: '#fff', borderRadius: 16, width: '100%', maxWidth: 680,
    boxShadow: '0 32px 80px rgba(0,0,0,.28)', overflow: 'hidden',
    fontFamily: "'DM Sans',sans-serif", color: '#0f172a', position: 'relative',
  },
  header: {
    background: 'linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%)',
    padding: '36px 40px 28px', position: 'relative', overflow: 'hidden',
  },
  closeBtn: {
    position: 'absolute', top: 16, right: 16,
    background: 'rgba(255,255,255,.08)', border: 'none', cursor: 'pointer',
    width: 32, height: 32, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8',
  },
  badge: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: 'rgba(5,150,105,.2)', border: '1px solid rgba(5,150,105,.4)',
    color: '#6ee7b7', fontSize: 11, fontWeight: 600,
    letterSpacing: '.08em', textTransform: 'uppercase',
    padding: '4px 12px', borderRadius: 99, marginBottom: 14,
  },
  title: {
    fontFamily: "'Playfair Display',Georgia,serif",
    fontSize: 26, fontWeight: 700, color: '#fff', margin: '0 0 6px', lineHeight: 1.15,
  },
  subtitle: { fontSize: 13, color: '#94a3b8', margin: 0 },
  issuedBox: { position: 'absolute', top: 36, right: 40, fontSize: 11, color: '#64748b', textAlign: 'right' },
  issuedLabel: { display: 'block', color: '#94a3b8', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 2 },
  body: { padding: '28px 40px 24px' },
  trialBanner: {
    background: 'linear-gradient(135deg,#ecfdf5,#d1fae5)', border: '1.5px solid #6ee7b7',
    borderRadius: 10, padding: '16px 20px',
    display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 28,
  },
  trialIcon: { width: 38, height: 38, flexShrink: 0, background: '#059669', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  trialTitle: { fontSize: 15, fontWeight: 700, color: '#065f46', margin: '0 0 3px' },
  trialDesc:  { fontSize: 13, color: '#047857', margin: 0 },
  trialDates: { marginTop: 8, display: 'flex', gap: 20 },
  trialDate:  { fontSize: 12, color: '#065f46' },
  trialDateLabel: { display: 'block', fontSize: 10, color: '#6ee7b7', textTransform: 'uppercase', letterSpacing: '.06em' },
  sectionHead: {
    display: 'flex', alignItems: 'center', gap: 8,
    fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#94a3b8',
    paddingBottom: 8, borderBottom: '1px solid #e2e8f0', marginBottom: 14, marginTop: 24,
  },
  grid:      { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  full:      { gridColumn: '1/-1' },
  field:     { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px' },
  fieldLabel:{ display: 'block', fontSize: 10, fontWeight: 600, letterSpacing: '.07em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 4 },
  fieldRow:  { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  fieldValue:{ fontSize: 14, fontWeight: 500, color: '#0f172a', flex: 1, wordBreak: 'break-all' },
  mono:      { fontFamily: "'JetBrains Mono',monospace", fontSize: 13 },
  highlight: { background: '#fef9c3', padding: '2px 8px', borderRadius: 4, fontFamily: "'JetBrains Mono',monospace", fontSize: 14, fontWeight: 700, color: '#92400e', letterSpacing: '.05em' },
  copyBtn:   { display: 'inline-flex', alignItems: 'center', fontSize: 11, fontWeight: 600, color: '#059669', background: '#d1fae5', border: 'none', cursor: 'pointer', padding: '4px 10px', borderRadius: 6, whiteSpace: 'nowrap', flexShrink: 0 },
  warning:   { background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '11px 14px', fontSize: 12, color: '#92400e', marginBottom: 12, display: 'flex', gap: 8, alignItems: 'flex-start' },
  actions:   { display: 'flex', gap: 10, padding: '18px 40px 24px', borderTop: '1px solid #e2e8f0' },
  btnPrimary:{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 600, background: '#0f172a', color: '#fff', border: 'none', cursor: 'pointer', padding: '10px 20px', borderRadius: 8 },
  btnOutline:{ display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 600, background: 'transparent', color: '#475569', border: '1.5px solid #e2e8f0', cursor: 'pointer', padding: '10px 20px', borderRadius: 8 },
};

// ─── Exported component ───────────────────────────────────────────────────────
export default function BusinessCreatedSuccess({ data, onClose }) {
  if (!data) return null;

  const { business, admin, subscription } = data;
  const subdomainUrl = `https://${business.slug}.${ROOT_DOMAIN}`;
  const issuedAt     = fmt(new Date());
  const trialEnd     = fmt(subscription?.expiresAt);
  const fullName     = `${admin.firstName || ''} ${admin.lastName || ''}`.trim();

  return (
    <>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500;600&family=JetBrains+Mono:wght@500&display=swap" />

      <AnimatePresence>
        <motion.div style={styles.overlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div
            style={styles.sheet}
            initial={{ scale: .94, y: 30, opacity: 0 }}
            animate={{ scale: 1,   y: 0,  opacity: 1 }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
          >
            {/* Header */}
            <div style={styles.header}>
              <button style={styles.closeBtn} onClick={onClose} aria-label="Close"><X size={15} /></button>
              <div style={styles.issuedBox}>
                <span style={styles.issuedLabel}>Issued</span>{issuedAt}
              </div>
              <div style={styles.badge}><CheckCircle size={12} /> Business Created</div>
              <h1 style={styles.title}>{business.businessName}</h1>
              <p style={styles.subtitle}>Platform credentials — keep this information secure</p>
            </div>

            {/* Body */}
            <div style={styles.body}>

              {subscription?.isTrial && (
                <div style={styles.trialBanner}>
                  <div style={styles.trialIcon}><Gift size={18} color="#fff" /></div>
                  <div>
                    <p style={styles.trialTitle}>14-Day Free Trial Active</p>
                    <p style={styles.trialDesc}>Full access to all platform features — no payment required.</p>
                    <div style={styles.trialDates}>
                      <div style={styles.trialDate}><span style={styles.trialDateLabel}>Started</span>{issuedAt}</div>
                      <div style={styles.trialDate}><span style={styles.trialDateLabel}>Expires</span>{trialEnd}</div>
                    </div>
                  </div>
                </div>
              )}

              <SectionHead icon={Building2}>Business Details</SectionHead>
              <div style={styles.grid}>
                <div style={styles.full}><Field label="Store URL"         value={subdomainUrl}             mono /></div>
                <Field label="Business Name"    value={business.businessName} />
                <Field label="Slug / Subdomain" value={business.slug}         mono />
                <Field label="Phone"            value={business.phone} />
                <Field label="WhatsApp"         value={business.whatsappNumber} />
                {business.businessType && <Field label="Category" value={business.businessType.replace(/_/g,' ')} />}
                {business.description  && <div style={styles.full}><Field label="Description" value={business.description} /></div>}
              </div>

              <SectionHead icon={User}>Admin / Owner Login Credentials</SectionHead>
              <div style={styles.warning}>
                <Lock size={14} color="#d97706" style={{ flexShrink: 0, marginTop: 1 }} />
                <span>The temporary password is shown <strong>only once</strong>. Share it securely and ask the owner to change it on first login.</span>
              </div>
              <div style={styles.grid}>
                <Field label="Full Name" value={fullName} />
                <Field label="Admin ID"  value={`#${admin.id}`} mono />
                <div style={styles.full}><Field label="Email (Login)"       value={admin.email}             mono /></div>
                <div style={styles.full}><Field label="Temporary Password"  value={admin.temporaryPassword} mono highlight /></div>
              </div>

            </div>

            {/* Actions */}
            <div style={styles.actions}>
              <button style={styles.btnPrimary} onClick={() => openPrintWindow({ business, admin, subscription })}>
                <Printer size={15} /> Print Credentials
              </button>
              <button style={styles.btnOutline} onClick={onClose}>Done</button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}