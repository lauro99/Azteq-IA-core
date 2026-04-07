'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/components/LanguageContext';
import LanguageSelector from '@/components/LanguageSelector';

export default function PlanesPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [userPlan, setUserPlan] = useState<string>('free');
  const [loading, setLoading] = useState(true);
  const [isAnnual, setIsAnnual] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<'pro' | 'enterprise'>('pro');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState(false);
  const [supportValidated, setSupportValidated] = useState(false);
  
  // States for the new contact form
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactData, setContactData] = useState({ name: '', phone: '', company: '', message: '' });
  const [isSendingContact, setIsSendingContact] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);

  const handleCheckout = async (plan: 'pro' | 'enterprise') => {
    if (!supportValidated) {
      setCheckoutPlan(plan);
      setShowSupportModal(true);
      return;
    }
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

  const submitContactForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingContact(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const email = session?.user?.email || 'Usuario Desconocido';
      
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contactData.name,
          phone: contactData.phone,
          company: contactData.company,
          message: contactData.message,
          email,
          plan: checkoutPlan === 'pro' ? 'Pro (Élite)' : 'Enterprise (Omni-Códice)'
        }),
      });
      if (res.ok) setContactSuccess(true);
    } catch (err) {
      console.error(err);
    }
    setIsSendingContact(false);
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
        .select('*')
        .eq('id', session.user.id)
        .single();
        
      if (profile?.plan) {
        setUserPlan(profile.plan);
      }
      if (profile?.support_validated) {
        setSupportValidated(true);
      }
      setLoading(false);
    };
    checkUser();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-900/20 via-black to-[#020202] pointer-events-none z-0"></div>
        <div className="relative flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-2 border-emerald-900 border-t-[#00f0ff] border-b-[#10b981] rounded-none animate-spin [clip-path:polygon(50%_0%,100%_50%,50%_100%,0%_50%)] shadow-[0_0_20px_rgba(16,185,129,0.5)]"></div>
          <span className="text-[#00f0ff] font-mono text-[10px] uppercase tracking-[0.3em] animate-pulse">Sincronizando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex flex-col bg-[#050505] text-emerald-50 font-sans overflow-hidden selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Fondo Cyber-Azteca */}
      <div className="absolute inset-0 bg-no-repeat bg-center bg-[url('/azteq-IA.png')] bg-[length:100%_100%] bg-fixed opacity-[0.15] z-0 mix-blend-screen scale-105 filter contrast-125 saturate-150 hue-rotate-[#10b981]"></div>
      
      {/* Overlay de Hexágonos / Circuitería */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-900/20 via-black to-[#020202] pointer-events-none z-0"></div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#10b98110_1px,transparent_1px),linear-gradient(to_bottom,#10b98110_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 z-0 pointer-events-none"></div>

      {/* HEADER */}
      <header className="relative z-20 p-6 flex justify-between items-center border-b border-emerald-900/50 bg-[#050B0A]/80 backdrop-blur-md">
        <button 
          onClick={() => router.back()}
          className="text-emerald-500/70 hover:text-[#00f0ff] flex items-center gap-2 text-xs font-mono font-bold tracking-widest uppercase transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          <span>{t.backBtn || 'Retorno'}</span>
        </button>
        <div className="flex items-center gap-4">
          <span className="hidden md:inline-flex font-black font-mono text-[10px] tracking-[0.3em] uppercase text-emerald-500/50 border border-emerald-900/50 px-3 py-1 bg-emerald-950/20">
            {t.subscriptions || 'Protocolo de Suscripción'}
          </span>
          <LanguageSelector />
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="relative z-10 flex-1 w-full max-w-6xl mx-auto p-6 md:p-12 flex flex-col items-center justify-center">
        <div className="text-center mb-12 px-4 relative">
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-64 h-1 bg-emerald-500/50 blur-[8px]"></div>
          <div className="inline-flex items-center gap-4 mb-4">
            <span className="h-0.5 w-8 bg-emerald-500/80 shadow-[0_0_10px_#10b981]"></span>
            <h1 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-[#00f0ff] to-emerald-400 tracking-[0.1em] drop-shadow-[0_0_15px_rgba(16,185,129,0.3)] uppercase">
              {t.planesTitle || 'Actualiza tu Plan'}
            </h1>
            <span className="h-0.5 w-8 bg-[#00f0ff]/80 shadow-[0_0_10px_#00f0ff]"></span>
          </div>
          <p className="text-emerald-100/70 font-mono text-xs md:text-sm max-w-2xl mx-auto uppercase tracking-widest">{t.planesDesc || 'Inicia la secuencia de sincronización. Las actualizaciones del núcleo se aplican inmediatamente a tu interfaz.'}</p>
          
          {/* Billing Toggle */}
          <div className="mt-8 flex items-center justify-center gap-3">
            <span className={`text-sm font-mono tracking-widest uppercase transition-colors ${!isAnnual ? 'text-[#00f0ff] drop-shadow-[0_0_5px_#00f0ff]' : 'text-emerald-500/50'}`}>{t.monthly || 'Ciclo Menor'}</span>
            <button 
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative w-16 h-8 rounded-none flex items-center border transition-all p-1 [clip-path:polygon(5px_0,100%_0,calc(100%-5px)_100%,0_100%)] ${isAnnual ? 'bg-[#10b981]/20 border-[#10b981]/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-[#00f0ff]/10 border-[#00f0ff]/30'}`}
              aria-label="Alternar facturación anual"
            >
              <div className={`w-6 h-6 rounded-none [clip-path:polygon(3px_0,100%_0,calc(100%-3px)_100%,0_100%)] shadow-md transform transition-transform duration-300 ${isAnnual ? 'translate-x-7 bg-[#10b981]' : 'translate-x-0 bg-[#00f0ff]'}`}></div>
            </button>
            <span className={`text-sm font-mono tracking-widest uppercase transition-colors flex items-center gap-2 ${isAnnual ? 'text-[#10b981] drop-shadow-[0_0_5px_#10b981]' : 'text-emerald-500/50'}`}>
              {t.annual || 'Ciclo Mayor'}
              <span className="bg-[#10b981]/20 text-[#10b981] text-[10px] px-2 py-0.5 rounded-none uppercase tracking-widest font-bold border border-[#10b981]/50 animate-pulse [clip-path:polygon(3px_0,100%_0,calc(100%-3px)_100%,0_100%)]">{t.save10 || 'Eficiencia +10%'}</span>
            </span>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row items-stretch justify-center gap-8 w-full pb-12">
          {/* PLAN FREE - NÚCLEO BÁSICO */}
          <div className={`flex-1 bg-[#050B0A]/80 backdrop-blur-xl border ${userPlan === 'free' ? 'border-[#00f0ff] shadow-[0_0_20px_rgba(0,240,255,0.2)]' : 'border-emerald-500/20'} p-8 relative flex flex-col items-center text-center transition-all group overflow-hidden [clip-path:polygon(0%_0%,_100%_0%,_100%_calc(100%_-_20px),_calc(100%_-_20px)_100%,_0%_100%)]`}>
            {/* Decorative Cyber Aztec corners */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#00f0ff]/50 opacity-50"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#00f0ff]/50 opacity-50"></div>

            {userPlan === 'free' && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-[#00f0ff]/20 border border-[#00f0ff] text-[#00f0ff] text-[10px] font-bold px-6 py-1 uppercase tracking-widest shadow-[0_0_15px_rgba(0,240,255,0.5)] [clip-path:polygon(10px_0,calc(100%-10px)_0,100%_100%,0_100%)]">
                {t.currentPlan || 'Unidad Actual'}
              </div>
            )}
            
            {/* SVG Icon - Cyber Node */}
            <div className="w-16 h-16 bg-[#00f0ff]/5 border border-[#00f0ff]/30 text-[#00f0ff] rounded-none flex items-center justify-center mb-6 mt-4 relative rotate-45 group-hover:shadow-[0_0_20px_#00f0ff30] transition-shadow">
              <svg className="w-8 h-8 -rotate-45" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 7l10 5 10-5-10-5zm0 10v10m-10-5l10 5 10-5" />
                <circle cx="12" cy="12" r="2" fill="currentColor" />
              </svg>
            </div>

            <h3 className="text-xl font-mono font-bold text-emerald-50 mb-2 uppercase tracking-widest">{t.basicPlan || 'Núcleo Básico'}</h3>
            <div className="text-4xl font-extrabold text-[#00f0ff] mb-1 flex items-end justify-center gap-1 font-mono drop-shadow-[0_0_10px_rgba(0,240,255,0.3)]">
              $0 <span className="text-sm text-emerald-200/50 font-normal mb-1 tracking-widest">USD /CIL</span>
            </div>
            <p className="text-xs text-transparent mb-6 uppercase">.</p>
            
            <ul className="text-left text-emerald-100/70 space-y-4 mb-4 w-full text-sm font-mono tracking-tight">
              <li className="flex items-start gap-3"><span className="text-[#00f0ff] font-bold mt-0.5">⟩</span> {t.planBasicAccess || 'Enlace con IA Experta'}</li>
              <li className="flex items-start gap-3"><span className="text-[#00f0ff] font-bold mt-0.5">⟩</span> {t.planBasicLimit || 'Límite: 20 peticiones/ciclo'}</li>
            </ul>
            <div className="mt-8 w-full"></div>
            <button 
              disabled={userPlan === 'free'} 
              className={`mt-auto w-full py-3.5 font-mono font-bold uppercase tracking-widest text-xs transition-all relative overflow-hidden ${userPlan === 'free' ? 'bg-emerald-900/20 text-emerald-500/50 cursor-not-allowed border border-emerald-900/30' : 'bg-[#00f0ff]/10 hover:bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/50 hover:shadow-[0_0_15px_rgba(0,240,255,0.4)]'}`}
              style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
            >
              {userPlan === 'free' ? (t.active || 'Sincronizado') : (t.startFree || 'Extraer')}
            </button>
          </div>

          {/* PLAN PRO - NÚCLEO ÉLITE */}
          <div className={`flex-1 bg-[#1A1A10]/90 backdrop-blur-xl border-[2px] ${userPlan === 'pro' ? 'border-[#10b981] scale-105 shadow-[0_0_30px_rgba(16,185,129,0.3)]' : 'border-[#10b981]/50 shadow-[0_0_20px_rgba(16,185,129,0.1)]'} p-8 relative flex flex-col items-center text-center transform transition-all group z-10 [clip-path:polygon(0%_20px,_20px_0%,_100%_0%,_100%_calc(100%_-_20px),_calc(100%_-_20px)_100%,_0%_100%)]`}>
            
            {/* Grid overlay inside Pro */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#10b98120_1px,transparent_1px),linear-gradient(to_bottom,#10b98120_1px,transparent_1px)] bg-[size:1rem_1rem] opacity-30 pointer-events-none p-1"></div>

            {userPlan === 'pro' ? (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-[#10b981] text-black text-[10px] font-bold px-6 py-1 uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.8)] [clip-path:polygon(10px_0,calc(100%-10px)_0,100%_100%,0_100%)] z-10">
                {t.currentPlan || 'Unidad Actual'}
              </div>
            ) : (
              <div className="absolute top-0 right-0 bg-[#10b981] text-black text-[10px] font-bold px-4 py-1.5 uppercase tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.8)] [clip-path:polygon(15px_0,100%_0,100%_100%,0_100%)] z-10">
                {t.recommended || 'Óptimo'}
              </div>
            )}
            
            {/* SVG Icon - Aztec Lightning/Energy */}
            <div className="w-20 h-20 bg-[#10b981]/10 border-2 border-[#10b981] text-[#10b981] flex items-center justify-center mb-6 mt-4 relative group-hover:scale-110 transition-transform duration-500 [clip-path:polygon(25%_0%,75%_0%,100%_50%,75%_100%,25%_100%,0%_50%)] shadow-[0_0_25px_rgba(16,185,129,0.4)]">
              <svg className="w-10 h-10 animate-pulse text-[#10b981]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>

            <h3 className="text-2xl font-mono font-black text-[#10b981] mb-2 uppercase tracking-[0.2em]">{t.proPlan || 'Matriz Élite'}</h3>
            <div className="text-5xl font-extrabold text-[#10b981] mb-1 flex items-end justify-center gap-1 font-mono drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]">
              ${isAnnual ? 400 * 0.9 : 400} 
              <span className="text-sm text-emerald-200/50 font-normal mb-1 tracking-widest">USD /CIL</span>
            </div>
            {isAnnual ? (
              <p className="text-[10px] text-[#10b981] mb-6 font-mono font-bold tracking-widest uppercase opacity-80">(${400 * 12 * 0.9} {t.billedAnnually || 'USD /Rotación Solar'})</p>
            ) : (
              <p className="text-xs text-transparent mb-6 uppercase">.</p>
            )}
            
            <ul className="text-left text-emerald-50 space-y-5 mb-4 w-full text-sm font-mono tracking-tight">
              <li className="flex items-start gap-3"><span className="text-[#10b981] font-bold mt-0.5">⟩</span> <span>{t.planProAccess ? `${t.planProAccess[0]} ` : 'Enlace '}<b className="text-[#10b981]">{t.planProAccess ? t.planProAccess[1] : 'ilimitado'}</b>{t.planProAccess ? ` ${t.planProAccess[2]}` : ' a la IA Experta'}</span></li>
              <li className="flex items-start gap-3"><span className="text-[#10b981] font-bold mt-0.5">⟩</span> <span>{t.planProPlcs ? `${t.planProPlcs[0]} ` : 'Sincronizar '}<b className="text-[#10b981]">{t.planProPlcs ? t.planProPlcs[1] : '2 Nodos PLC'}</b>{t.planProPlcs ? ` ${t.planProPlcs[2]}` : ''}</span></li>
              <li className="flex items-start gap-3"><span className="text-[#10b981] font-bold mt-0.5">⟩</span> {t.planProSupport || 'Canal de soporte prioritario'}</li>
            </ul>
            
            <div className="mt-8 w-full"></div>
            <button 
              disabled={userPlan === 'pro'}
              onClick={(e) => { e.preventDefault(); handleCheckout('pro'); }} 
              className={`mt-auto w-full py-4 font-mono font-bold uppercase tracking-[0.1em] text-sm transition-all group-hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] ${userPlan === 'pro' ? 'bg-[#10b981] text-black' : 'bg-[#10b981]/20 hover:bg-[#10b981] border border-[#10b981] text-[#10b981] hover:text-black'}`}
              style={{ clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)' }}
            >
              {userPlan === 'pro' ? (t.active || 'Sincronizado') : (!supportValidated ? 'Validar Montaje ↑' : (t.upgradePro || 'Aprobar Pago ↑'))}
            </button>
          </div>

          {/* PLAN ENTERPRISE - OMNI-CÓDICE */}
          <div className={`flex-1 bg-[#050510]/80 backdrop-blur-xl border ${userPlan === 'enterprise' ? 'border-[#d4af37] shadow-[0_0_20px_rgba(212,175,55,0.2)]' : 'border-[#d4af37]/30'} p-8 relative flex flex-col items-center text-center transition-all group overflow-hidden [clip-path:polygon(0%_0%,_100%_0%,_100%_calc(100%_-_20px),_calc(100%_-_20px)_100%,_0%_100%)]`}>
            
            {/* Cyber Aztec corners Gold */}
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#d4af37]/50 opacity-50"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#d4af37]/50 opacity-50"></div>

            {userPlan === 'enterprise' && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-[#d4af37] text-black text-[10px] font-bold px-6 py-1 uppercase tracking-widest shadow-[0_0_15px_rgba(212,175,55,0.5)] [clip-path:polygon(10px_0,calc(100%-10px)_0,100%_100%,0_100%)]">
                {t.currentPlan || 'Unidad Actual'}
              </div>
            )}
            
            {/* SVG Icon - Aztec Calendar / Cyber Shield */}
            <div className="w-16 h-16 bg-[#d4af37]/5 border border-[#d4af37]/30 text-[#d4af37] rounded-full flex items-center justify-center mb-6 mt-4 relative group-hover:rotate-90 transition-transform duration-[2s]">
              {/* Outer geared ring */}
              <svg className="absolute w-full h-full" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4">
                <circle cx="50" cy="50" r="45" />
              </svg>
              <svg className="w-8 h-8 text-[#d4af37]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>

            <h3 className="text-xl font-mono font-bold text-[#d4af37] mb-2 uppercase tracking-widest">{t.freeAccessPlan || 'Omni-Códice'}</h3>
            <div className="text-4xl font-extrabold text-[#d4af37] mb-1 flex items-end justify-center gap-1 font-mono drop-shadow-[0_0_10px_rgba(212,175,55,0.3)]">
              ${isAnnual ? 1000 * 0.9 : 1000} 
              <span className="text-sm text-[#d4af37]/50 font-normal mb-1 tracking-widest">USD /CIL</span>
            </div>
            {isAnnual ? (
              <p className="text-[10px] text-[#d4af37] mb-6 font-mono font-bold tracking-widest uppercase opacity-80">(${1000 * 12 * 0.9} {t.billedAnnually || 'USD /Rotación Solar'})</p>
            ) : (
              <p className="text-xs text-transparent mb-6 uppercase">.</p>
            )}
            
            <ul className="text-left text-emerald-100/70 space-y-4 mb-4 w-full text-sm font-mono tracking-tight">
              <li className="flex items-start gap-3"><span className="text-[#d4af37] font-bold mt-0.5">⟩</span> <span>{t.planEntAccess ? `${t.planEntAccess[0]} ` : 'Enlace '}<b className="text-[#d4af37]">{t.planEntAccess ? t.planEntAccess[1] : 'total (Omni)'}</b>{t.planEntAccess ? ` ${t.planEntAccess[2]}` : ' a la red'}</span></li>
              <li className="flex items-start gap-3"><span className="text-[#d4af37] font-bold mt-0.5">⟩</span> <span>{t.planEntPlcs ? `${t.planEntPlcs[0]} ` : 'Sincronizar '}<b className="text-[#d4af37]">{t.planEntPlcs ? t.planEntPlcs[1] : 'Nodos infinitos'}</b>{t.planEntPlcs ? ` ${t.planEntPlcs[2]}` : ''}</span></li>
            </ul>
            
            <div className="mt-8 w-full"></div>
            <button 
              disabled={userPlan === 'enterprise'}
              onClick={(e) => { e.preventDefault(); handleCheckout('enterprise'); }} 
              className={`mt-auto w-full py-3.5 font-mono font-bold uppercase tracking-widest text-xs transition-all relative ${userPlan === 'enterprise' ? 'bg-[#d4af37]/20 text-[#d4af37] border-transparent cursor-not-allowed' : 'bg-transparent border border-[#d4af37]/50 hover:bg-[#d4af37]/10 text-[#d4af37] hover:shadow-[0_0_15px_rgba(212,175,55,0.3)]'}`}
              style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
            >
              {userPlan === 'enterprise' ? (t.active || 'Sincronizado') : (!supportValidated ? 'Validar Montaje ↑' : (t.fullAccess || 'Aprobar Pago ↑'))}
            </button>
          </div>
          {/* Checkout Modal Cyber-Azteca */}
          {showCheckout && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
              <div className="bg-[#050B0A] border border-[#10b981]/50 p-8 rounded-none w-full max-w-md shadow-[0_0_50px_rgba(16,185,129,0.3)] relative animate-fade-in-up [clip-path:polygon(0%_0%,_100%_0%,_100%_calc(100%_-_30px),_calc(100%_-_30px)_100%,_0%_100%)]">
                {/* Decoration */}
                <div className="absolute top-0 right-0 w-16 h-1 bg-[#10b981]"></div>
                <div className="absolute top-0 right-0 w-1 h-16 bg-[#10b981]"></div>
                <div className="absolute bottom-0 left-0 w-16 h-1 bg-[#10b981]"></div>
                <div className="absolute bottom-0 left-0 w-1 h-16 bg-[#10b981]"></div>

                <button 
                  onClick={() => !isProcessing && setShowCheckout(false)}
                  className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-none bg-[#10b981]/10 hover:bg-[#10b981]/30 text-[#10b981] transition-colors border border-[#10b981]/30 [clip-path:polygon(3px_0,100%_0,calc(100%-3px)_100%,0_100%)]"
                >
                  ✕
                </button>
                <div className="text-center mb-8 mt-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-[#10b981]/10 text-[#10b981] mb-4 shadow-[0_0_20px_rgba(16,185,129,0.2)] border border-[#10b981]/50 rotate-45">
                    <svg className="w-8 h-8 -rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-black font-mono text-[#10b981] uppercase tracking-[0.1em] mb-2">{t.checkoutTitle || 'Enlace de pago'}</h2>
                  <p className="text-sm font-mono text-emerald-200/60 uppercase tracking-widest">
                    {t.checkoutDesc || 'Secuencia final para activar el núcleo'} <b className="text-[#10b981]">{checkoutPlan === 'pro' ? (t.proPlan || 'Élite') : (t.enterprisePlan || 'Omni-Códice')}</b>.
                  </p>
                </div>

                <div className="bg-[#020403] rounded-none p-4 mb-8 border border-emerald-900/50 [clip-path:polygon(10px_0,100%_0,100%_100%,0_100%,0_10px)] relative">
                  <div className="absolute -inset-px bg-gradient-to-r from-transparent via-[#10b981]/10 to-transparent opacity-50 z-0"></div>
                  
                  <div className="flex justify-between items-center mb-2 relative z-10">
                    <span className="text-emerald-100/60 font-mono text-sm uppercase tracking-wider">Módulo {checkoutPlan === 'pro' ? (t.proPlan || 'Élite') : (t.enterprisePlan || 'Omni-Códice')}</span>
                    <span className="text-[#00f0ff] font-mono font-bold drop-shadow-[0_0_5px_#00f0ff]">
                      ${checkoutPlan === 'pro' ? (isAnnual ? 400 * 0.9 : 400) : (isAnnual ? 1000 * 0.9 : 1000)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs relative z-10">
                    <span className="text-emerald-100/40 font-mono tracking-widest uppercase">{t.planesDesc ? (isAnnual ? t.annual : t.monthly) : "Ciclo Activo"}</span>
                    <span className="text-[#10b981]/70 font-mono tracking-widest uppercase">{isAnnual ? `${t.annual || 'Mayor'} (Eficiencia +10%)` : (t.monthly || 'Menor')}</span>
                  </div>
                  <div className="h-px w-full bg-emerald-900/50 my-4 relative z-10"></div>
                  <div className="flex justify-between items-center relative z-10">
                    <span className="text-emerald-50/80 font-mono font-bold tracking-widest uppercase text-sm">{t.totalToday || 'Inversión Total'}</span>
                    <span className="text-xl font-mono font-black text-[#10b981] drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">
                      ${checkoutPlan === 'pro' ? (isAnnual ? 400 * 12 * 0.9 : 400) : (isAnnual ? 1000 * 12 * 0.9 : 1000)} USD
                    </span>
                  </div>
                </div>

                {paymentError && (
                  <div className="bg-red-950/40 border border-red-500/50 rounded-none p-4 mb-6 flex items-start gap-3 animate-[shake_0.5s_ease-in-out]">
                    <div className="mt-0.5 bg-red-500/20 text-red-500 rounded-none p-1.5 shadow-[0_0_15px_rgba(239,68,68,0.5)] border border-red-500/50 shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <h4 className="text-red-500 font-mono font-bold text-sm uppercase tracking-widest mb-1">{t.paymentFailed || 'Enlace Interrumpido'}</h4>
                      <p className="text-red-400/80 font-mono text-[10px] uppercase tracking-wider leading-relaxed">
                        {t.paymentErrorDesc || 'Fallo en la conexión de la pasarela. Fondos rechazados por la red central. Reintente o contacte a soporte técnico.'}
                      </p>
                    </div>
                  </div>
                )}

                <button 
                  onClick={processPayment}
                  disabled={isProcessing}
                  className="w-full bg-[#10b981] hover:bg-[#0ea5e9] text-black py-4 rounded-none font-mono font-bold uppercase tracking-[0.1em] transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(14,165,233,0.6)] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed [clip-path:polygon(15px_0,100%_0,100%_calc(100%-15px),calc(100%-15px)_100%,0_100%,0_15px)]"
                >
                  {isProcessing ? (
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-4H8l4-7v6h3l-4 7z"/>
                    </svg>
                  )}
                  {isProcessing ? (t.connectingTerminal || 'Sincronizando...') : (paymentError ? (t.retryPayment || 'Reintentar Enlace') : (t.paySecure || 'Aprobar Transacción'))}
                </button>
                <div className="mt-4 text-center">
                  <span className="text-[9px] font-mono text-emerald-500/30 uppercase tracking-widest flex items-center justify-center gap-2">
                    <svg className="w-3 h-3 text-[#10b981]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                    CRIPTOGRAFÍA CENTRAL POR STRIPE
                  </span>
                </div>
              </div>
            </div>
          )}

            {/* Support Validation Modal */}
            {showSupportModal && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
                <div className="bg-[#050B0A] border border-[#d4af37]/50 p-8 rounded-none w-full max-w-md shadow-[0_0_50px_rgba(212,175,55,0.3)] relative animate-fade-in-up [clip-path:polygon(0%_0%,_100%_0%,_100%_calc(100%_-_30px),_calc(100%_-_30px)_100%,_0%_100%)]">
                  {/* Decoration Gold */}
                  <div className="absolute top-0 right-0 w-16 h-1 bg-[#d4af37]"></div>
                  <div className="absolute top-0 right-0 w-1 h-16 bg-[#d4af37]"></div>
                  <div className="absolute bottom-0 left-0 w-16 h-1 bg-[#d4af37]"></div>
                  <div className="absolute bottom-0 left-0 w-1 h-16 bg-[#d4af37]"></div>

                  <button 
                    onClick={() => { setShowSupportModal(false); setShowContactForm(false); setContactSuccess(false); setContactData({ name: '', phone: '', company: '', message: '' }); }}
                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-none bg-[#d4af37]/10 hover:bg-[#d4af37]/30 text-[#d4af37] transition-colors border border-[#d4af37]/30 [clip-path:polygon(3px_0,100%_0,calc(100%-3px)_100%,0_100%)] z-10"
                  >
                    ✕
                  </button>

                  {contactSuccess ? (
                    <div className="text-center mb-4 mt-4">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/10 text-emerald-400 mb-4 shadow-[0_0_20px_rgba(16,185,129,0.2)] border border-emerald-500/50 rounded-full animate-bounce">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                      </div>
                      <h2 className="text-xl font-black font-mono text-emerald-400 uppercase tracking-[0.1em] mb-2">Petición Recibida</h2>
                      <p className="text-sm font-mono text-emerald-200/60 uppercase tracking-widest mt-4">
                        El equipo de Soporte Técnico ha sido notificado. Nos contactaremos pronto para iniciar el proceso de validación en tu planta.
                      </p>
                      <button 
                        onClick={() => { setShowSupportModal(false); setShowContactForm(false); setContactSuccess(false); }}
                        className="mt-8 w-full bg-[#d4af37] hover:bg-[#b08d2b] text-black py-4 rounded-none font-mono font-bold uppercase tracking-[0.1em] transition-all shadow-[0_0_20px_rgba(212,175,55,0.4)] flex items-center justify-center gap-3 [clip-path:polygon(15px_0,100%_0,100%_calc(100%-15px),calc(100%-15px)_100%,0_100%,0_15px)]"
                      >
                        Cerrar Enlace
                      </button>
                    </div>
                  ) : showContactForm ? (
                    <div className="text-center mb-2 mt-4 space-y-4">
                      <div className="flex items-center gap-3 mb-6 justify-center">
                        <button onClick={() => setShowContactForm(false)} className="text-[#d4af37]/70 hover:text-[#d4af37]">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <h2 className="text-xl font-black font-mono text-[#d4af37] uppercase tracking-[0.1em]">Formulario_Azteq</h2>
                      </div>
                      <form onSubmit={submitContactForm} className="space-y-4 text-left">
                        <div>
                          <label className="text-[#d4af37] text-[10px] font-mono uppercase tracking-widest block mb-1">Nombre Operador</label>
                          <input required type="text" value={contactData.name} onChange={(e) => setContactData({...contactData, name: e.target.value})} className="w-full bg-[#020403] border border-[#d4af37]/50 text-emerald-50 px-4 py-2 text-sm font-mono focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/50" placeholder="Ej. Juan Pérez" />
                        </div>
                        <div>
                          <label className="text-[#d4af37] text-[10px] font-mono uppercase tracking-widest block mb-1">Teléfono Enlace</label>
                          <input required type="tel" value={contactData.phone} onChange={(e) => setContactData({...contactData, phone: e.target.value})} className="w-full bg-[#020403] border border-[#d4af37]/50 text-emerald-50 px-4 py-2 text-sm font-mono focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/50" placeholder="+52 123 456 7890" />
                        </div>
                        <div>
                          <label className="text-[#d4af37] text-[10px] font-mono uppercase tracking-widest block mb-1">Planta / Empresa</label>
                          <input required type="text" value={contactData.company} onChange={(e) => setContactData({...contactData, company: e.target.value})} className="w-full bg-[#020403] border border-[#d4af37]/50 text-emerald-50 px-4 py-2 text-sm font-mono focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/50" placeholder="Nombre Empresa S.A. de C.V." />
                        </div>
                        <div>
                          <label className="text-[#d4af37] text-[10px] font-mono uppercase tracking-widest block mb-1">Mensaje para Soporte</label>
                          <textarea rows={3} value={contactData.message} onChange={(e) => setContactData({...contactData, message: e.target.value})} className="w-full bg-[#020403] border border-[#d4af37]/50 text-emerald-50 px-4 py-2 text-sm font-mono focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/50 resize-none" placeholder="Ingresa dudas, detalles de tus máquinas plc o necesidades..."></textarea>
                        </div>
                        <button 
                          type="submit"
                          disabled={isSendingContact}
                          className="w-full mt-4 bg-[#d4af37] hover:bg-[#b08d2b] text-black py-4 rounded-none font-mono font-bold uppercase tracking-[0.1em] transition-all shadow-[0_0_20px_rgba(212,175,55,0.4)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 [clip-path:polygon(15px_0,100%_0,100%_calc(100%-15px),calc(100%-15px)_100%,0_100%,0_15px)]"
                        >
                          {isSendingContact ? 'Transmitiendo...' : 'Contactar Soporte Técnico'}
                        </button>
                      </form>
                    </div>
                  ) : (
                    <>
                      <div className="text-center mb-8 mt-4">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-[#d4af37]/10 text-[#d4af37] mb-4 shadow-[0_0_20px_rgba(212,175,55,0.2)] border border-[#d4af37]/50 rotate-45">
                          <svg className="w-8 h-8 -rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                        <h2 className="text-xl font-black font-mono text-[#d4af37] uppercase tracking-[0.1em] mb-2">Validación Requerida</h2>
                        <p className="text-sm font-mono text-emerald-200/60 uppercase tracking-widest mt-4">
                          Para activar el nivel <b className="text-[#d4af37]">{checkoutPlan === 'pro' ? 'Pro' : 'Enterprise'}</b>, 
                          nuestro equipo de soporte primero debe certificar empíricamente el montaje completo de la infraestructura en tu planta.
                        </p>
                      </div>

                      <div className="bg-[#020403] rounded-none p-4 mb-8 border border-emerald-900/50 [clip-path:polygon(10px_0,100%_0,100%_100%,0_100%,0_10px)] relative">
                        <p className="text-xs text-emerald-100/70 font-mono text-center uppercase leading-loose">
                          1. Requieres instalación en vivo.<br/>
                          2. Soporte técnico valida tu equipo.<br/>
                          3. Se desbloquea el pago.
                        </p>
                      </div>

                      <div className="flex gap-4">
                        <button 
                          onClick={() => { setShowSupportModal(false); setShowContactForm(false); }}
                          className="w-1/3 bg-transparent border border-[#d4af37]/50 hover:bg-[#d4af37]/10 text-[#d4af37] py-4 rounded-none font-mono font-bold uppercase tracking-[0.1em] transition-all"
                        >
                          Atrás
                        </button>
                        <button 
                          onClick={() => setShowContactForm(true)}
                          className="flex-1 bg-[#d4af37] hover:bg-[#b08d2b] text-black py-4 rounded-none font-mono font-bold uppercase tracking-[0.1em] transition-all shadow-[0_0_20px_rgba(212,175,55,0.4)] flex items-center justify-center gap-3 [clip-path:polygon(15px_0,100%_0,100%_calc(100%-15px),calc(100%-15px)_100%,0_100%,0_15px)]"
                        >
                          Contactar Soporte
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }
