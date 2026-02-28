// frontend/src/hooks/useFonts.js
import { useEffect } from 'react';

export function useFonts() {
  useEffect(() => {
    if (document.getElementById('sf-fonts')) return;
    const el = document.createElement('link');
    el.id = 'sf-fonts';
    el.rel = 'stylesheet';
    el.href = 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,600;0,9..144,700;1,9..144,400&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap';
    document.head.appendChild(el);
  }, []);
}