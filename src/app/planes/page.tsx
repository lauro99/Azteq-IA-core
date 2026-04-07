'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useLanguage } from '@/components/LanguageContext';

export default function PlanesPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [userPlan, setUserPlan] = useState<string>('free');
  const [loading, setLoading] = useState(true);
  const [isAnnual, setIsAnnual] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<'pro' | 'enterprise'>('pro');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState(false);

  const handleCheckout = async (plan: 'pro' | 'enterprise') => {
    setPaymentError(false);
    setCheckoutPlan(plan);
    setShowCheckout(true);
  };

  const processPayment = async () => {
    setPaymentError(false);
    setIsProcessing(true);
    // Simula una pequeña carga y error (Demo)
    setTimeout(() => {
      setIsProcessing(false);
      setPaymentError(true);
    }, 2000);
  };

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
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight drop-shadow-[0_0_15px_rgba(0,0,0,0.8)]">{t.planesTitle || 'Actualiza tu Plan'}</h1>
          <p className="text-white/70 text-sm md:text-base max-w-2xl mx-auto">{t.planesDesc || 'Selecciona la suscripción que mejor se adapte a tus necesidades. Las actualizaciones se aplican de manera inmediata a tu cuenta.'}</p>
          
          {/* Billing Toggle */}
          <div className="mt-8 flex items-center justify-center gap-3">
            <span className={`text-sm font-semibold transition-colors ${!isAnnual ? 'text-white' : 'text-white/50'}`}>{t.monthly || 'Facturación Mensual'}</span>
            <button 
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative w-14 h-7 rounded-full flex items-center border transition-all p-1 ${isAnnual ? 'bg-[#D4AF37]/20 border-[#D4AF37]/50' : 'bg-white/10 border-white/20'}`}
              aria-label="Alternar facturación anual"
            >
              <div className={`w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${isAnnual ? 'translate-x-7 bg-[#D4AF37]' : 'translate-x-0 bg-white/80'}`}></div>
            </button>
            <span className={`text-sm font-semibold transition-colors flex items-center gap-2 ${isAnnual ? 'text-[#D4AF37]' : 'text-white/50'}`}>
              {t.annual || 'Facturación Anual'}
              <span className="bg-[#D4AF37]/20 text-[#D4AF37] text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold border border-[#D4AF37]/50 animate-pulse">{t.save10 || 'Ahorra 10%'}</span>
            </span>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row items-stretch justify-center gap-6 w-full pb-12">
          {/* PLAN FREE */}
          <div className={`flex-1 bg-black/60 backdrop-blur-xl border ${userPlan === 'free' ? 'border-[#0D9488]' : 'border-white/10'} p-8 rounded-3xl flex flex-col items-center text-center shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-all group relative`}>
            {userPlan === 'free' && (
              <div className="absolute -top-3 bg-[#0D9488] text-white text-[10px] font-bold px-4 py-1 rounded-full uppercase tracking-wider shadow-[0_0_10px_rgba(13,148,136,0.5)]">
                {t.currentPlan || 'Tu Plan Actual'}
              </div>
            )}
            <div className="w-14 h-14 bg-white/5 border border-white/10 text-white rounded-2xl flex items-center justify-center mb-6">
              <span className="text-2xl">🆓</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">{t.basicPlan || 'Básico'}</h3>
            <div className="text-4xl font-extrabold text-[#0D9488] mb-1 flex items-end justify-center gap-1">
              $0 <span className="text-sm text-white/50 font-normal mb-1">{t.perMonth || 'USD /mes'}</span>
            </div>
            <p className="text-xs text-transparent mb-6 uppercase">.</p>
            <ul className="text-left text-white/70 space-y-4 mb-4 w-full text-sm font-light">
              <li className="flex items-start gap-3"><span className="text-[#0D9488] font-bold mt-0.5">✓</span> {t.planBasicAccess || 'Acceso a la IA Experta'}</li>
              <li className="flex items-start gap-3"><span className="text-[#0D9488] font-bold mt-0.5">✓</span> {t.planBasicLimit || 'Límite de 20 preguntas al día'}</li>
            </ul>
            <div className="mt-8 w-full"></div>
            <button 
              disabled={userPlan === 'free'} 
              className={`mt-auto w-full py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs transition-all ${userPlan === 'free' ? 'bg-white/5 text-white/50 cursor-not-allowed' : 'bg-white/10 hover:bg-[#0D9488] text-white'}`}
            >
              {userPlan === 'free' ? (t.active || 'Activo') : (t.startFree || 'Seleccionar')}
            </button>
          </div>

          {/* PLAN PRO */}
          <div className={`flex-1 bg-black/70 backdrop-blur-xl border-[2px] ${userPlan === 'pro' ? 'border-[#D4AF37] scale-105' : 'border-[#D4AF37]/50'} p-8 rounded-3xl flex flex-col items-center text-center shadow-[0_0_40px_rgba(212,175,55,0.15)] relative transform transition-all group`}>
            {userPlan === 'pro' ? (
              <div className="absolute -top-3 bg-[#D4AF37] text-black text-[10px] font-bold px-4 py-1 rounded-full uppercase tracking-wider shadow-[0_0_10px_rgba(212,175,55,0.5)]">
                {t.currentPlan || 'Tu Plan Actual'}
              </div>
            ) : (
              <div className="absolute top-0 right-0 bg-[#D4AF37] text-black text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider shadow-[0_0_10px_rgba(212,175,55,0.5)]">
                {t.recommended || 'Recomendado'}
              </div>
            )}
            
            <div className="w-16 h-16 bg-[#D4AF37]/10 border border-[#D4AF37]/50 text-[#D4AF37] rounded-2xl flex items-center justify-center mb-6">
              <span className="text-3xl">⚡</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">{t.proPlan || 'Profesional'}</h3>
            <div className="text-4xl font-extrabold text-[#D4AF37] mb-1 flex items-end justify-center gap-1 drop-shadow-[0_0_15px_rgba(212,175,55,0.4)]">
              ${isAnnual ? 400 * 0.9 : 400} 
              <span className="text-sm text-white/50 font-normal mb-1">{t.perMonth || 'USD /mes'}</span>
            </div>
            {isAnnual ? (
              <p className="text-xs text-[#D4AF37] mb-6 font-semibold tracking-wide uppercase">(${400 * 12 * 0.9} {t.billedAnnually || 'USD facturados al año'})</p>
            ) : (
              <p className="text-xs text-transparent mb-6 uppercase">.</p> // Espaciador para mantener altura
            )}
            <ul className="text-left text-white/70 space-y-4 mb-4 w-full text-sm font-light">
              <li className="flex items-start gap-3"><span className="text-[#D4AF37] font-bold mt-0.5">✓</span> <span>{t.planProAccess ? `${t.planProAccess[0]} ` : 'Acceso '}<b className="text-white">{t.planProAccess ? t.planProAccess[1] : 'ilimitado'}</b>{t.planProAccess ? ` ${t.planProAccess[2]}` : ' a la IA Experta'}</span></li>
              <li className="flex items-start gap-3"><span className="text-[#D4AF37] font-bold mt-0.5">✓</span> <span>{t.planProPlcs ? `${t.planProPlcs[0]} ` : 'Conectar hasta '}<b className="text-white">{t.planProPlcs ? t.planProPlcs[1] : '2 PLCs'}</b>{t.planProPlcs ? ` ${t.planProPlcs[2]}` : ''}</span></li>
              <li className="flex items-start gap-3"><span className="text-[#D4AF37] font-bold mt-0.5">✓</span> {t.planProSupport || 'Soporte prioritario'}</li>
            </ul>
            <div className="mt-8 w-full"></div>
            <button 
              disabled={userPlan === 'pro'}
              onClick={(e) => { e.preventDefault(); handleCheckout('pro'); }} 
              className={`mt-auto w-full py-4 rounded-xl font-bold uppercase tracking-wider text-xs transition-all ${userPlan === 'pro' ? 'bg-[#D4AF37] text-black shadow-[0_0_20px_rgba(212,175,55,0.5)]' : 'bg-[#D4AF37]/80 hover:bg-[#D4AF37] text-black hover:scale-105 active:scale-95'}`}
            >
              {userPlan === 'pro' ? (t.active || 'Activo') : (t.upgradePro || 'Subir a Pro')}
            </button>
          </div>

          {/* PLAN ENTERPRISE */}
          <div className={`flex-1 bg-black/60 backdrop-blur-xl border ${userPlan === 'enterprise' ? 'border-blue-400' : 'border-white/10'} p-8 rounded-3xl flex flex-col items-center text-center shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-all group relative`}>
            {userPlan === 'enterprise' && (
              <div className="absolute -top-3 bg-blue-500 text-white text-[10px] font-bold px-4 py-1 rounded-full uppercase tracking-wider shadow-[0_0_10px_rgba(59,130,246,0.5)]">
                {t.currentPlan || 'Tu Plan Actual'}
              </div>
            )}
            <div className="w-14 h-14 bg-white/5 border border-white/10 text-blue-400 rounded-2xl flex items-center justify-center mb-6">
              <span className="text-2xl">🏢</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">{t.freeAccessPlan || 'Acceso Libre'}</h3>
            <div className="text-4xl font-extrabold text-blue-400 mb-1 flex items-end justify-center gap-1 drop-shadow-[0_0_10px_rgba(96,165,250,0.3)]">
              ${isAnnual ? 1000 * 0.9 : 1000} 
              <span className="text-sm text-white/50 font-normal mb-1">{t.perMonth || 'USD /mes'}</span>
            </div>
            {isAnnual ? (
              <p className="text-xs text-blue-400 mb-6 font-semibold tracking-wide uppercase">(${1000 * 12 * 0.9} {t.billedAnnually || 'USD facturados al año'})</p>
            ) : (
              <p className="text-xs text-transparent mb-6 uppercase">.</p>
            )}
            <ul className="text-left text-white/70 space-y-4 mb-4 w-full text-sm font-light">
              <li className="flex items-start gap-3"><span className="text-blue-400 font-bold mt-0.5">✓</span> <span>{t.planEntAccess ? `${t.planEntAccess[0]} ` : 'Acceso '}<b className="text-white">{t.planEntAccess ? t.planEntAccess[1] : 'total e ilimitado'}</b>{t.planEntAccess ? ` ${t.planEntAccess[2]}` : ' al sistema'}</span></li>
              <li className="flex items-start gap-3"><span className="text-blue-400 font-bold mt-0.5">✓</span> <span>{t.planEntPlcs ? `${t.planEntPlcs[0]} ` : 'Conectar '}<b className="text-white">{t.planEntPlcs ? t.planEntPlcs[1] : 'PLCs ilimitados'}</b>{t.planEntPlcs ? ` ${t.planEntPlcs[2]}` : ''}</span></li>
            </ul>
            <div className="mt-8 w-full"></div>
            <button 
              disabled={userPlan === 'enterprise'}
              onClick={(e) => { e.preventDefault(); handleCheckout('enterprise'); }} 
              className={`mt-auto w-full py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs transition-all border ${userPlan === 'enterprise' ? 'bg-blue-600 text-white border-transparent' : 'bg-transparent border-blue-500/50 hover:bg-blue-600/20 text-blue-400 hover:text-white hover:border-blue-500'}`}
            >
              {userPlan === 'enterprise' ? (t.active || 'Activo') : (t.fullAccess || 'Acceso Total')}
            </button>
          </div>
          {/* Checkout Modal Flotante */}
          {showCheckout && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="bg-[#1a1a1a] border border-white/10 p-8 rounded-3xl w-full max-w-md shadow-[0_0_50px_rgba(0,0,0,0.8)] relative animate-fade-in-up">
                <button 
                  onClick={() => !isProcessing && setShowCheckout(false)}
                  className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                >
                  ✕
                </button>
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#00D4FF]/10 text-[#00D4FF] mb-4 shadow-[0_0_20px_rgba(0,212,255,0.2)]">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">{t.checkoutTitle || 'Finalizar Compra'}</h2>
                  <p className="text-sm text-white/60">
                    {t.checkoutDesc || 'Estás a un paso de activar tu suscripción'} <b className="text-white capitalize">{checkoutPlan === 'pro' ? (t.proPlan || 'Profesional') : (t.enterprisePlan || 'Enterprise')}</b>.
                  </p>
                </div>

                <div className="bg-black/50 rounded-xl p-4 mb-8 border border-white/5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white/60 text-sm">Plan {checkoutPlan === 'pro' ? (t.proPlan || 'Profesional') : (t.enterprisePlan || 'Enterprise')}</span>
                    <span className="text-white font-bold">
                      ${checkoutPlan === 'pro' ? (isAnnual ? 400 * 0.9 : 400) : (isAnnual ? 1000 * 0.9 : 1000)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/40">{t.planesDesc ? (isAnnual ? t.annual : t.monthly) : "Ciclo de facturación"}</span>
                    <span className="text-white/70">{isAnnual ? `${t.annual || 'Anual'} (-10%)` : (t.monthly || 'Mensual')}</span>
                  </div>
                  <div className="h-px w-full bg-white/10 my-4"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/80 font-bold">{t.totalToday || 'Total a pagar hoy'}</span>
                    <span className="text-xl font-black text-[#00D4FF]">
                      ${checkoutPlan === 'pro' ? (isAnnual ? 400 * 12 * 0.9 : 400) : (isAnnual ? 1000 * 12 * 0.9 : 1000)} USD
                    </span>
                  </div>
                </div>

                {paymentError && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 flex items-start gap-3 animate-[shake_0.5s_ease-in-out]">
                    <div className="mt-0.5 bg-red-500/20 text-red-400 rounded-full p-1.5 shadow-[0_0_15px_rgba(239,68,68,0.3)] shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <h4 className="text-red-400 font-bold text-sm mb-1">{t.paymentFailed || 'Pago Rechazado'}</h4>
                      <p className="text-red-400/80 text-xs leading-relaxed">
                        {t.paymentErrorDesc || 'Lo sentimos, la conexión de pago falló o la tarjeta fue rechazada. Por favor, intenta de nuevo o comunícate con soporte.'}
                      </p>
                    </div>
                  </div>
                )}

                <button 
                  onClick={processPayment}
                  disabled={isProcessing}
                  className="w-full bg-[#635BFF] hover:bg-[#7A73FF] text-white py-4 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(99,91,255,0.4)] hover:shadow-[0_0_30px_rgba(99,91,255,0.6)] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-4H8l4-7v6h3l-4 7z"/>
                    </svg>
                  )}
                  {isProcessing ? (t.connectingTerminal || 'Conectando con terminal de pago...') : (paymentError ? (t.retryPayment || 'Reintentar Pago') : (t.paySecure || 'Pagar de forma Segura'))}
                </button>
                <div className="mt-4 text-center">
                  <span className="text-[10px] text-white/40 uppercase tracking-widest flex items-center justify-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                    Pagos procesados por Stripe
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
