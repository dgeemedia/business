// frontend/src/components/public/StoreStyles.jsx
import React from 'react';

export function StoreStyles({ primary, secondary, dark }) {
  const bg = dark ? '#0F0F0F' : '#F9F7F4';
  const card = dark ? '#1C1C1E' : '#FFFFFF';
  const text = dark ? '#F0EDE8' : '#1A1A1A';
  const muted = dark ? '#888' : '#6B6B6B';
  const border = dark ? 'rgba(255,255,255,0.09)' : '#E5E0D8';
  return (
    <style dangerouslySetInnerHTML={{ __html: `
      .sf-root{font-family:'Plus Jakarta Sans',sans-serif;background:${bg};color:${text};transition:background .3s,color .3s}
      .sf-display{font-family:'Fraunces',serif}
      :root{--sf-p:${primary};--sf-s:${secondary};--sf-bg:${bg};--sf-card:${card};--sf-text:${text};--sf-muted:${muted};--sf-border:${border}}
      .sf-btn-primary{background:var(--sf-p);color:#fff;border:none;border-radius:12px;padding:12px 24px;font-weight:600;font-family:'Plus Jakarta Sans',sans-serif;cursor:pointer;transition:all .2s;display:inline-flex;align-items:center;gap:8px}
      .sf-btn-primary:hover{filter:brightness(.92);transform:translateY(-1px)}
      .sf-btn-primary:disabled{opacity:.5;cursor:not-allowed;transform:none}
      .sf-btn-ghost{background:transparent;color:var(--sf-muted);border:1.5px solid var(--sf-border);border-radius:10px;padding:8px 16px;font-weight:500;font-family:'Plus Jakarta Sans',sans-serif;cursor:pointer;transition:all .2s;display:inline-flex;align-items:center;gap:6px}
      .sf-btn-ghost:hover{border-color:var(--sf-p);color:var(--sf-p)}
      .sf-input{width:100%;padding:12px 16px;border:1.5px solid var(--sf-border);border-radius:12px;font-family:'Plus Jakarta Sans',sans-serif;font-size:15px;background:${dark?'rgba(255,255,255,.06)':card};color:${text};transition:border-color .2s;outline:none;box-sizing:border-box}
      .sf-input:focus{border-color:var(--sf-p)}
      .sf-input::placeholder{color:${dark?'#555':'#B0A89C'}}
      .sf-card{background:${card};border-radius:20px;overflow:hidden;box-shadow:${dark?'0 1px 0 rgba(255,255,255,.06),0 4px 20px rgba(0,0,0,.4)':'0 1px 3px rgba(0,0,0,.06),0 4px 16px rgba(0,0,0,.04)'};transition:box-shadow .25s,transform .25s}
      .sf-card:hover{box-shadow:${dark?'0 4px 8px rgba(0,0,0,.5),0 16px 40px rgba(0,0,0,.5)':'0 4px 8px rgba(0,0,0,.08),0 16px 40px rgba(0,0,0,.08)'};transform:translateY(-3px)}
      .sf-cat-pill{padding:8px 20px;border-radius:100px;font-size:14px;font-weight:500;white-space:nowrap;cursor:pointer;border:1.5px solid transparent;transition:all .2s;background:${dark?'rgba(255,255,255,.08)':'#EEEAE4'};color:${dark?'#ccc':'#5A5046'}}
      .sf-cat-pill.active{background:var(--sf-p);color:white}
      .sf-cat-pill:not(.active):hover{border-color:var(--sf-p);color:var(--sf-p)}
      .sf-badge{display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:100px;font-size:12px;font-weight:600}
      .sf-scroll-hide::-webkit-scrollbar{display:none}.sf-scroll-hide{-ms-overflow-style:none;scrollbar-width:none}
      .sf-wa-btn{background:#25D366;color:white;border:none;border-radius:14px;padding:14px 28px;font-weight:700;font-size:16px;font-family:'Plus Jakarta Sans',sans-serif;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:10px;width:100%}
      .sf-wa-btn:hover{background:#20BD5A;transform:translateY(-1px)}
      .sf-wa-btn:disabled{opacity:.6;cursor:not-allowed;transform:none}
      .sf-overlay{position:fixed;inset:0;background:rgba(10,10,10,.6);backdrop-filter:blur(4px);z-index:100}
      @keyframes sf-bounce-in{0%{transform:scale(.5);opacity:0}60%{transform:scale(1.15)}100%{transform:scale(1);opacity:1}}
      .sf-bounce{animation:sf-bounce-in .35s ease forwards}
      @keyframes sf-wa-pulse{0%,100%{box-shadow:0 0 0 0 rgba(37,211,102,.5)}70%{box-shadow:0 0 0 14px rgba(37,211,102,0)}}
      .sf-wa-pulse{animation:sf-wa-pulse 2s infinite}
      @keyframes sf-phone-ring{0%,100%{box-shadow:0 0 0 0 rgba(59,130,246,.45)}70%{box-shadow:0 0 0 12px rgba(59,130,246,0)}}
      .sf-phone-ring{animation:sf-phone-ring 2.5s infinite}
      @media(max-width:640px){.sf-products-grid{grid-template-columns:repeat(2,1fr)!important;gap:12px!important}.sf-h1{font-size:clamp(1.9rem,7vw,3rem)!important}}
    ` }} />
  );
}