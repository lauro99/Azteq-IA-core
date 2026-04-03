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

  // Verificar que el usuario tenga sesión antes de dejarlo ver esta pantalla
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/');
      } else {
        setLoading(false);
      }
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
          <span>← Volver</span>
        </button>
        <div className="flex items-center gap-4">
          <LanguageSelector />
          <div className="h-6 w-px bg-white/20"></div>
          <span className="text-[#D4AF37] font-bold text-sm tracking-widest uppercase shadow-sm">IA Planta</span>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="relative z-10 flex-1 flex flex-col items-center pt-16 md:pt-24 px-6">
        
        <div className="text-center mb-12 max-w-2xl">
          <div className="inline-flex items-center justify-center p-4 rounded-full bg-[#D4AF37]/10 mb-6 border border-[#D4AF37]/30 shadow-[0_0_30px_rgba(212,175,55,0.15)]">
            <svg className="w-10 h-10 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4l-3 4h6l-3-4z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 8l-3 5h16l-3-5H7z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2 13l-2 7h24l-2-7H2z" />
            </svg>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white tracking-widest uppercase mb-4 drop-shadow-md">
            Selecciona el PLC
          </h1>
          <p className="text-white/60 text-sm md:text-base max-w-lg mx-auto font-light leading-relaxed">
            Elige la marca del controlador lógico programable al que la IA Planta deberá conectarse y analizar.
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
                  <p className="text-white/40 text-xs font-light uppercase tracking-widest">Conexión Industrial</p>
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