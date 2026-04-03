'use client';

import { useState } from 'react';

export default function LanguageSelector() {
  const [lang, setLang] = useState('ES');

  return (
    <div className="pointer-events-auto bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl flex items-center p-1 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
      <button
        onClick={() => setLang('ES')}
        className={`px-3 py-1.5 text-[10px] font-bold rounded-xl transition-all tracking-widest uppercase ${lang === 'ES' ? 'text-[#D4AF37] bg-white/10 border border-[#D4AF37]/30' : 'text-white/50 hover:text-white border border-transparent'}`}
      >
        ES
      </button>
      <button
        onClick={() => setLang('EN')}
        className={`px-3 py-1.5 text-[10px] font-bold rounded-xl transition-all tracking-widest uppercase ${lang === 'EN' ? 'text-[#D4AF37] bg-white/10 border border-[#D4AF37]/30' : 'text-white/50 hover:text-white border border-transparent'}`}
      >
        EN
      </button>
    </div>
  );
}
