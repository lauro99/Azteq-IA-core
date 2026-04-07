'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function PlanesPage() {
  const router = useRouter();
  const [userPlan, setUserPlan] = useState<string>('free');
  const [loading, setLoading] = useState(true);
  const [isAnnual, setIsAnnual] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/');
        return;
      }
      
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('plan')
        .eq('id', session.user.id)
        .single();
        
      if (profile?.plan) {
        setUserPlan(profile.plan);
      }
      setLoading(false);
    };
    checkUser();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#0D9488] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex flex-col bg-black text-white font-sans overflow-hidden">
      {/* Fondo azteca con filtro oscuro */}
      <div className="absolute inset-0 bg-no-repeat bg-center bg-[url('/azteq-IA.png')] bg-[length:100%_100%] bg-fixed opacity-20 z-0 mix-blend-luminosity"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black/80 to-black pointer-events-none z-0"></div>

      {/* HEADER */}
      <header className="relative z-20 p-6 flex justify-between items-center border-b border-white/10 bg-black/40 backdrop-blur-md">
        <button 
          onClick={() => router.back()}
          className="text-white/70 hover:text-white flex items-center gap-2 text-sm font-semibold transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          <span>Volver</span>
        </button>
        <span className="font-bold text-sm tracking-widest uppercase text-indigo-400">
          Suscripciones
        </span>
      </header>

      {/* MAIN CONTENT */}
      <main className="relative z-10 flex-1 w-full max-w-6xl mx-auto p-6 md:p-12 flex flex-col items-center justify-center">
        <div className="text-center mb-12 px-4">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight drop-shadow-[0_0_15px_rgba(0,0,0,0.8)]">Actualiza tu Plan</h1>
          <p className="text-white/70 text-sm md:text-base max-w-2xl mx-auto">Selecciona la suscripción que mejor se adapte a tus necesidades. Las actualizaciones se aplican de manera inmediata a tu cuenta.</p>
          
          {/* Billing Toggle */}
          <div className="mt-8 flex items-center justify-center gap-3">
            <span className={`text-sm font-semibold transition-colors ${!isAnnual ? 'text-white' : 'text-white/50'}`}>Facturación Mensual</span>
            <button 
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative w-14 h-7 rounded-full flex items-center border transition-all p-1 ${isAnnual ? 'bg-[#D4AF37]/20 border-[#D4AF37]/50' : 'bg-white/10 border-white/20'}`}
              aria-label="Alternar facturación anual"
            >
              <div className={`w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${isAnnual ? 'translate-x-7 bg-[#D4AF37]' : 'translate-x-0 bg-white/80'}`}></div>
            </button>
            <span className={`text-sm font-semibold transition-colors flex items-center gap-2 ${isAnnual ? 'text-[#D4AF37]' : 'text-white/50'}`}>
              Facturación Anual 
              <span className="bg-[#D4AF37]/20 text-[#D4AF37] text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold border border-[#D4AF37]/50 animate-pulse">Ahorra 10%</span>
            </span>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row items-stretch justify-center gap-6 w-full pb-12">
          {/* PLAN FREE */}
          <div className={`flex-1 bg-black/60 backdrop-blur-xl border ${userPlan === 'free' ? 'border-[#0D9488]' : 'border-white/10'} p-8 rounded-3xl flex flex-col items-center text-center shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-all group relative`}>
            {userPlan === 'free' && (
              <div className="absolute -top-3 bg-[#0D9488] text-white text-[10px] font-bold px-4 py-1 rounded-full uppercase tracking-wider shadow-[0_0_10px_rgba(13,148,136,0.5)]">
                Tu Plan Actual
              </div>
            )}
            <div className="w-14 h-14 bg-white/5 border border-white/10 text-white rounded-2xl flex items-center justify-center mb-6">
              <span className="text-2xl">🆓</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Básico</h3>
            <div className="text-4xl font-extrabold text-[#0D9488] mb-1 flex items-end justify-center gap-1">
              $0 <span className="text-sm text-white/50 font-normal mb-1">USD /mes</span>
            </div>
            <p className="text-xs text-transparent mb-6 uppercase">.</p>
            <ul className="text-left text-white/70 space-y-4 mb-4 w-full text-sm font-light">
              <li className="flex items-start gap-3"><span className="text-[#0D9488] font-bold mt-0.5">✓</span> Acceso a la IA Experta</li>
              <li className="flex items-start gap-3"><span className="text-[#0D9488] font-bold mt-0.5">✓</span> Límite de 20 preguntas al día</li>
            </ul>
            <div className="mt-8 w-full"></div>
            <button 
              disabled={userPlan === 'free'} 
              className={`mt-auto w-full py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs transition-all ${userPlan === 'free' ? 'bg-white/5 text-white/50 cursor-not-allowed' : 'bg-white/10 hover:bg-[#0D9488] text-white'}`}
            >
              {userPlan === 'free' ? 'Activo' : 'Seleccionar'}
            </button>
          </div>

          {/* PLAN PRO */}
          <div className={`flex-1 bg-black/70 backdrop-blur-xl border-[2px] ${userPlan === 'pro' ? 'border-[#D4AF37] scale-105' : 'border-[#D4AF37]/50'} p-8 rounded-3xl flex flex-col items-center text-center shadow-[0_0_40px_rgba(212,175,55,0.15)] relative transform transition-all group`}>
            {userPlan === 'pro' ? (
              <div className="absolute -top-3 bg-[#D4AF37] text-black text-[10px] font-bold px-4 py-1 rounded-full uppercase tracking-wider shadow-[0_0_10px_rgba(212,175,55,0.5)]">
                Tu Plan Actual
              </div>
            ) : (
              <div className="absolute top-0 right-0 bg-[#D4AF37] text-black text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider shadow-[0_0_10px_rgba(212,175,55,0.5)]">
                Recomendado
              </div>
            )}
            
            <div className="w-16 h-16 bg-[#D4AF37]/10 border border-[#D4AF37]/50 text-[#D4AF37] rounded-2xl flex items-center justify-center mb-6">
              <span className="text-3xl">⚡</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Profesional</h3>
            <div className="text-4xl font-extrabold text-[#D4AF37] mb-1 flex items-end justify-center gap-1 drop-shadow-[0_0_15px_rgba(212,175,55,0.4)]">
              ${isAnnual ? 400 * 0.9 : 400} 
              <span className="text-sm text-white/50 font-normal mb-1">USD /mes</span>
            </div>
            {isAnnual ? (
              <p className="text-xs text-[#D4AF37] mb-6 font-semibold tracking-wide uppercase">(${400 * 12 * 0.9} USD facturados al año)</p>
            ) : (
              <p className="text-xs text-transparent mb-6 uppercase">.</p> // Espaciador para mantener altura
            )}
            <ul className="text-left text-white/70 space-y-4 mb-4 w-full text-sm font-light">
              <li className="flex items-start gap-3"><span className="text-[#D4AF37] font-bold mt-0.5">✓</span> Acceso <b className="text-white">ilimitado</b> a la IA Experta</li>
              <li className="flex items-start gap-3"><span className="text-[#D4AF37] font-bold mt-0.5">✓</span> Conectar hasta <b className="text-white">2 PLCs</b></li>
              <li className="flex items-start gap-3"><span className="text-[#D4AF37] font-bold mt-0.5">✓</span> Soporte prioritario</li>
            </ul>
            <div className="mt-8 w-full"></div>
            <button 
              disabled={userPlan === 'pro'}
              onClick={() => alert(`Contacta a soporte/ventas para realizar el pago seguro y activar el plan Pro por suscripción ${isAnnual ? 'anual (-10%)' : 'mensual'}.`)} 
              className={`mt-auto w-full py-4 rounded-xl font-bold uppercase tracking-wider text-xs transition-all ${userPlan === 'pro' ? 'bg-[#D4AF37] text-black shadow-[0_0_20px_rgba(212,175,55,0.5)]' : 'bg-[#D4AF37]/80 hover:bg-[#D4AF37] text-black hover:scale-105 active:scale-95'}`}
            >
              {userPlan === 'pro' ? 'Activo' : 'Subir a Pro'}
            </button>
          </div>

          {/* PLAN ENTERPRISE */}
          <div className={`flex-1 bg-black/60 backdrop-blur-xl border ${userPlan === 'enterprise' ? 'border-blue-400' : 'border-white/10'} p-8 rounded-3xl flex flex-col items-center text-center shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-all group relative`}>
            {userPlan === 'enterprise' && (
              <div className="absolute -top-3 bg-blue-500 text-white text-[10px] font-bold px-4 py-1 rounded-full uppercase tracking-wider shadow-[0_0_10px_rgba(59,130,246,0.5)]">
                Tu Plan Actual
              </div>
            )}
            <div className="w-14 h-14 bg-white/5 border border-white/10 text-blue-400 rounded-2xl flex items-center justify-center mb-6">
              <span className="text-2xl">🏢</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Enterprise</h3>
            <div className="text-4xl font-extrabold text-blue-400 mb-1 flex items-end justify-center gap-1 drop-shadow-[0_0_10px_rgba(96,165,250,0.3)]">
              ${isAnnual ? 1000 * 0.9 : 1000} 
              <span className="text-sm text-white/50 font-normal mb-1">USD /mes</span>
            </div>
            {isAnnual ? (
              <p className="text-xs text-blue-400 mb-6 font-semibold tracking-wide uppercase">(${1000 * 12 * 0.9} USD facturados al año)</p>
            ) : (
              <p className="text-xs text-transparent mb-6 uppercase">.</p>
            )}
            <ul className="text-left text-white/70 space-y-4 mb-4 w-full text-sm font-light">
              <li className="flex items-start gap-3"><span className="text-blue-400 font-bold mt-0.5">✓</span> Acceso <b className="text-white">total e ilimitado</b> al sistema</li>
              <li className="flex items-start gap-3"><span className="text-blue-400 font-bold mt-0.5">✓</span> Conectar <b className="text-white">PLCs ilimitados</b></li>
            </ul>
            <div className="mt-8 w-full"></div>
            <button 
              disabled={userPlan === 'enterprise'}
              onClick={() => alert(`Contacta a ventas para adquirir la licencia y hardware Enterprise con pago ${isAnnual ? 'anual (10% de descuento)' : 'mensual'}.`)} 
              className={`mt-auto w-full py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs transition-all border ${userPlan === 'enterprise' ? 'bg-blue-600 text-white border-transparent' : 'bg-transparent border-blue-500/50 hover:bg-blue-600/20 text-blue-400 hover:text-white hover:border-blue-500'}`}
            >
              {userPlan === 'enterprise' ? 'Activo' : 'Contactar Ventas'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
