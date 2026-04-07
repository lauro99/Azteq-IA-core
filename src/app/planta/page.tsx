'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/components/LanguageContext';
import LanguageSelector from '@/components/LanguageSelector';

const plcBrands = [
  { id: 'siemens', name: 'Siemens', color: 'from-teal-600 to-teal-400', icon: 'S' },
  { id: 'allenbradley', name: 'Allen-Bradley', color: 'from-blue-600 to-blue-400', icon: 'AB' },
  { id: 'delta', name: 'Delta', color: 'from-blue-500 to-cyan-400', icon: 'D' },
  { id: 'keyence', name: 'Keyence', color: 'from-gray-700 to-slate-500', icon: 'K' },
  { id: 'mitsubishi', name: 'Mitsubishi', color: 'from-red-600 to-red-400', icon: 'M' },
  { id: 'fanuc', name: 'Fanuc', color: 'from-yellow-500 to-yellow-300', icon: 'F' }
];

export default function PlantaBrandSelection() {
  const router = useRouter();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);

  // Verificar que el usuario tenga sesión y plan pro/enterprise antes de dejarlo ver esta pantalla
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/');
        return;
      }
      
      // Verificar el plan
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('plan')
        .eq('id', session.user.id)
        .single();
        
      if (profile?.plan === 'free') {
        router.push('/planes');
        return;
      }
      
      setLoading(false);
    };
    checkSession();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full bg-[#D4AF37] animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col relative bg-[#111]">
      {/* Fondo azteca con filtro oscuro */}
      <div className="absolute inset-0 bg-no-repeat bg-center bg-[url('/azteq-IA_phone.png')] md:bg-[url('/azteq-IA.png')] bg-[length:100%_100%] bg-fixed opacity-40 z-0"></div>
      <div className="absolute inset-0 bg-black/60 pointer-events-none z-0"></div>

      {/* Header */}
      <header className="relative z-20 p-4 sm:p-6 flex justify-between items-center border-b border-white/10 bg-black/40 backdrop-blur-md">
        <button 
          onClick={() => router.push('/')}
          className="text-white/70 hover:text-white flex items-center gap-2 text-sm font-semibold transition-colors"
        >
          <span>{t.piBack}</span>
        </button>
        <div className="flex items-center gap-4">
          <LanguageSelector />
          <div className="h-6 w-px bg-white/20"></div>
          <button
            onClick={() => router.push('/planes')}
            className="hidden sm:flex group flex-row items-center justify-center gap-1.5 bg-gradient-to-r from-[#0f172a] to-[#1e1b4b] hover:from-[#1e1b4b] hover:to-[#312e81] border border-indigo-500/30 hover:border-indigo-400/50 text-indigo-200 hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all shadow-[0_4px_10px_rgba(79,70,229,0.15)] hover:shadow-[0_4px_15px_rgba(79,70,229,0.3)]"
          >
            <svg className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>{(t as any).changePlan || 'Cambiar Plan'}</span>
          </button>
          <button
            onClick={() => router.push('/planta/ayuda')}
            className="flex items-center gap-1 px-3 py-1 rounded-full border border-[#D4AF37]/60 bg-[#D4AF37]/10 text-[#D4AF37] font-bold text-xs uppercase tracking-widest hover:bg-[#D4AF37]/30 hover:text-black transition-all shadow-sm"
            title="Ver ayuda y documentación de conexión"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 14h.01M16 10h.01M12 18h.01M12 6h.01" /></svg>
            {t.piHelp}
          </button>
          <span className="text-[#D4AF37] font-bold text-sm tracking-widest uppercase shadow-sm">{t.piIaPlanta}</span>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="relative z-10 flex-1 flex flex-col items-center pt-16 md:pt-24 px-6">
        
        <div className="text-center mb-12 max-w-2xl flex flex-col items-center">
          <div className="inline-flex items-center justify-center p-4 rounded-full bg-[#D4AF37]/10 mb-6 border border-[#D4AF37]/30 shadow-[0_0_30px_rgba(212,175,55,0.15)] relative group cursor-pointer hover:border-[#D4AF37]/80 hover:bg-[#D4AF37]/20 transition-all duration-500" onClick={() => router.push('/planta/dashboard')}>
            <svg className="w-10 h-10 text-[#D4AF37] group-hover:scale-110 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4l-3 4h6l-3-4z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 8l-3 5h16l-3-5H7z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2 13l-2 7h24l-2-7H2z" />
            </svg>
            <div className="absolute inset-0 bg-[#D4AF37] rounded-full blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-500"></div>
          </div>

          <button 
            onClick={() => router.push('/planta/dashboard')}
            className="mb-8 bg-[#D1C3AD]/10 border border-[#D4AF37]/50 text-[#D4AF37] font-bold uppercase tracking-[0.2em] text-xs px-8 py-3 rounded-full hover:bg-[#D4AF37]/20 hover:scale-105 transition-all flex items-center gap-3 backdrop-blur-sm shadow-[0_0_15px_rgba(212,175,55,0.1)] relative overflow-hidden group"
          >
            <span className="relative z-10 flex items-center gap-2">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
               {t.piOpenDashboard}
            </span>
            <div className="absolute inset-0 w-full h-full bg-[#D4AF37]/20 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] z-0"></div>
          </button>

          <h1 className="text-3xl md:text-5xl font-bold text-white tracking-widest uppercase mb-4 drop-shadow-md mt-4">
            {t.piSelectPLC}
          </h1>
          <p className="text-white/60 text-sm md:text-base max-w-lg mx-auto font-light leading-relaxed">
            {t.piSelectPLCDesc}
          </p>
        </div>

        {/* Grid de Marcas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl pb-12">
          {plcBrands.map((brand) => (
            <div 
              key={brand.id}
              onClick={() => {
                router.push(`/planta/${brand.id}`);
              }}
              className="group bg-black/40 backdrop-blur-md border border-white/10 rounded-3xl p-8 cursor-pointer hover:border-[#D4AF37]/60 hover:bg-[#1a1c18]/90 transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:shadow-[0_0_30px_rgba(212,175,55,0.2)] flex items-center justify-between overflow-hidden relative"
            >
              {/* Brillo de fondo al hover */}
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${brand.color} opacity-0 group-hover:opacity-10 blur-3xl rounded-full transition-opacity duration-500 -mr-10 -mt-10`}></div>
              
              <div className="flex items-center gap-6 relative z-10">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-black text-white bg-gradient-to-br ${brand.color} shadow-lg shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                  {brand.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white tracking-wider mb-1">{brand.name}</h3>
                  <p className="text-white/40 text-xs font-light uppercase tracking-widest">{t.piIndustrialConnection}</p>
                </div>
              </div>

              <div className="text-white/20 group-hover:text-[#D4AF37] group-hover:translate-x-2 transition-all duration-300 relative z-10">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))}
        </div>

      </main>
    </div>
  );
}