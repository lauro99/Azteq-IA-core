'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Verificar si el usuario ya aceptó las cookies previamente
    const hasAccepted = localStorage.getItem('azteq_cookies_accepted');
    if (!hasAccepted) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('azteq_cookies_accepted', 'true');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full z-[100] animate-in slide-in-from-bottom-10 fade-in duration-500">
      <div className="bg-[#111] border-t border-white/10 p-4 md:p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] backdrop-blur-xl">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-white text-sm font-bold uppercase tracking-widest mb-1 flex items-center justify-center md:justify-start gap-2">
              <span className="text-[#0D9488]">🍪</span> Privacidad y Cookies
            </h3>
            <p className="text-white/60 text-xs leading-relaxed max-w-4xl">
              Utilizamos cookies propias y de terceros para brindarte la mejor experiencia industrial en nuestra plataforma, analizar tráfico y proteger tus sesiones de forma segura. Al continuar navegando, consideramos que aceptas su uso. Conoce más en nuestra{' '}
              <Link href="/politica-cookies" className="text-[#0D9488] hover:underline whitespace-nowrap">Política de Cookies</Link> y <Link href="/politica-privacidad" className="text-[#D4AF37] hover:underline whitespace-nowrap">Política de Privacidad</Link>.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <button
              onClick={handleAccept}
              className="bg-[#D4AF37] hover:bg-[#E5C158] text-black px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-[0_4px_15px_rgba(212,175,55,0.3)] whitespace-nowrap"
            >
              Aceptar y Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
