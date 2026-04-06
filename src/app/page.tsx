'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LanguageSelector from '@/components/LanguageSelector';
import { useLanguage } from '@/components/LanguageContext';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const { t } = useLanguage();
  const router = useRouter();
  const [operatorId, setOperatorId] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [expandedCard, setExpandedCard] = useState<'none' | 'expert' | 'plant'>('none');
  const [showInfo, setShowInfo] = useState(false);

  const isAdmin = user?.email?.split('@')[0].toLowerCase().startsWith('adm');

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    fetchSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => authListener.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    setOperatorId('');
    setAccessCode('');
    setIsLoading(false);
  };

  const handleLogin = async () => {
    setErrorMsg('');
    if (!operatorId || !accessCode) {
      setErrorMsg('Por favor llena ambos campos.');
      return;
    }
    
    setIsLoading(true);
    
    // TRUCO: Si el operatorId no incluye '@', le agregamos nuestro dominio secreto automáticamente
    const emailToUse = operatorId.includes('@') ? operatorId : `${operatorId}@azteq.com`;

    // Intentamos hacer Log In en Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailToUse,
      password: accessCode,
    });

    if (error) {
      setErrorMsg('Credenciales incorrectas. Intenta de nuevo.');
    }
    // Si hay éxito, onAuthStateChange actualizará automáticamente 'user' y nos quedamos en esta pantalla
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen w-full flex flex-col relative overflow-y-auto bg-[#111] bg-no-repeat bg-center bg-[url('/azteq-IA_phone.png')] md:bg-[url('/azteq-IA.png')] bg-[length:100%_100%] bg-fixed">
      <div className="absolute inset-0 bg-black/60 pointer-events-none z-0"></div>
      <div className="absolute top-0 left-0 w-full z-20 p-4 sm:p-6 flex flex-col sm:flex-row sm:justify-between items-end sm:items-start pointer-events-none gap-4">
        <div className="w-full sm:w-auto flex justify-between items-start pointer-events-auto">
          <div className="pointer-events-auto flex items-center gap-3">
            <LanguageSelector />
            <button 
              onClick={() => setShowInfo(true)}
              className="group flex flex-row items-center gap-2 bg-black/40 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 hover:border-white/30 px-3 py-2 rounded-xl transition-all backdrop-blur-md shadow-[0_4px_15px_rgba(0,0,0,0.3)]"
              title="¿Qué hace cada IA?"
            >
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:block">Info</span>
            </button>
          </div>
          <button 
            className="sm:hidden bg-black/40 backdrop-blur-md border border-white/10 p-2 rounded-xl text-white ml-auto"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        </div>
        <div className={`bg-black/40 backdrop-blur-md border border-white/10 p-5 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex-col gap-3 pointer-events-auto w-full sm:w-auto max-w-[400px] ${isMenuOpen ? 'flex' : 'hidden sm:flex'}`}>
          {user ? (
            <>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#0D9488] shadow-[0_0_8px_#0D9488]"></div>
                <span className="text-[#E0F2F1] text-[10px] font-bold uppercase tracking-widest">Sesión Activa</span>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <span className="text-white text-sm font-light">Operador: <b className="text-[#D4AF37]">{user.email?.split('@')[0]}</b></span>
                {isAdmin && (
                  <Link 
                    href="/admin" 
                    className="group flex flex-col sm:flex-row items-center gap-2 bg-[#1a1c18]/80 hover:bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-[0.1em] transition-all w-full sm:w-auto shadow-[0_0_10px_rgba(212,175,55,0.1)] hover:shadow-[0_0_15px_rgba(212,175,55,0.3)]"
                  >
                    <span>Panel Admin</span>
                    <span className="text-sm group-hover:rotate-90 transition-transform duration-500">❂</span>
                  </Link>
                )}
                <button 
                  onClick={handleLogout}
                  disabled={isLoading}
                  className="bg-red-900/50 hover:bg-red-800 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all w-full sm:w-auto border border-red-500/30"
                >
                  {isLoading ? '...' : 'Cerrar Sesión'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#0D9488] shadow-[0_0_8px_#0D9488] animate-pulse"></div>
                <span className="text-[#E0F2F1] text-[10px] font-bold uppercase tracking-widest">Iniciar Sesión</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input 
                  id="operatorIdInput"
                  type="email" 
                  placeholder={"Correo electrónico"} 
                  value={operatorId || ''}
                  onChange={(e) => setOperatorId(e.target.value)}
                  disabled={isLoading}
                  className="bg-white/5 border border-white/10 text-white placeholder-white/30 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-[#D4AF37]/50 focus:bg-white/10 transition-all font-light w-full flex-1" 
                />
                <input 
                  type="password" 
                  placeholder={"Contraseña"} 
                  value={accessCode || ''}
                  onChange={(e) => setAccessCode(e.target.value)}
                  disabled={isLoading}
                  className="bg-white/5 border border-white/10 text-white placeholder-white/30 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-[#D4AF37]/50 focus:bg-white/10 transition-all font-light w-full flex-1" 
                />
                <button 
                  onClick={handleLogin}
                  disabled={isLoading}
                  className="bg-[#D4AF37] hover:bg-[#E5C158] disabled:opacity-50 disabled:cursor-not-allowed text-black px-6 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95 w-full sm:w-auto"
                >
                  {isLoading ? '...' : t.enter}
                </button>
              </div>
              {errorMsg && <p className="text-red-400 text-[10px] uppercase font-bold tracking-widest">{errorMsg}</p>}
            </>
          )}
        </div>
      </div>
      <div className="relative z-10 w-full min-h-screen pt-4 pb-2 px-6 md:px-12 flex flex-col">
        <main 
          className="w-full flex-1 flex flex-col justify-end pointer-events-auto h-full"
          onClick={(e) => {
            if (e.target === e.currentTarget) setExpandedCard('none');
          }}
        >
          {/* SI EL USUARIO NO ESTÁ LOGUEADO, MOSTRAMOS LOS PLANES */}
          {!user ? (
            <div className="w-full flex flex-col items-center justify-center gap-6 z-20 overflow-y-auto">
              <div className="text-center mb-2 mt-12 md:mt-24 px-4 bg-black/40 backdrop-blur-md rounded-2xl py-4 border border-white/5">
                <h2 className="text-2xl md:text-5xl font-bold text-white mb-2 md:mb-4 tracking-tight drop-shadow-[0_0_15px_rgba(0,0,0,0.8)]">Elige tu Plan</h2>
                <p className="text-white/80 text-xs md:text-sm max-w-xl mx-auto">Selecciona la suscripción que mejor se adapte a tus necesidades para acceder al sistema.</p>
              </div>
              
              <div className="flex flex-col md:flex-row items-stretch justify-center gap-6 w-full max-w-6xl mx-auto px-4 pb-12">
                {/* PLAN FREE */}
                <div className="flex-1 bg-black/60 backdrop-blur-xl border border-white/10 p-6 md:p-8 rounded-3xl flex flex-col items-center text-center shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:border-[#0D9488]/50 transition-all hover:-translate-y-2 group">
                  <div className="w-12 h-12 bg-white/5 border border-white/10 text-white rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <span className="text-xl">🆓</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Básico / Free</h3>
                  <div className="text-3xl font-extrabold text-[#0D9488] mb-4 drop-shadow-[0_0_10px_rgba(13,148,136,0.3)]">$0 <span className="text-sm text-white/50 font-normal">/mes</span></div>
                  <ul className="text-left text-white/70 space-y-3 mb-8 w-full text-xs font-light">
                    <li className="flex items-start gap-2">
                      <span className="text-[#0D9488] font-bold mt-0.5">✓</span> Acceso a la IA Experta
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#0D9488] font-bold mt-0.5">✓</span> Límite de 20 preguntas al día
                    </li>
                  </ul>
                  <button 
                    onClick={() => document.getElementById('operatorIdInput')?.focus()}
                    className="mt-auto w-full bg-white/10 hover:bg-[#0D9488] text-white hover:text-black py-3 rounded-xl font-bold uppercase tracking-wider text-xs transition-all border border-white/10 hover:border-transparent hover:shadow-[0_0_20px_rgba(13,148,136,0.4)]"
                  >
                    Comenzar Gratis
                  </button>
                </div>

                {/* PLAN PRO */}
                <div className="flex-1 bg-black/70 backdrop-blur-xl border-[2px] border-[#D4AF37] p-6 md:p-8 rounded-3xl flex flex-col items-center text-center shadow-[0_0_40px_rgba(212,175,55,0.15)] hover:shadow-[0_0_50px_rgba(212,175,55,0.3)] transition-all hover:-translate-y-2 relative transform md:-translate-y-4 group">
                  <div className="absolute top-0 right-0 bg-[#D4AF37] text-black text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider shadow-[0_0_10px_rgba(212,175,55,0.5)]">
                    Recomendado
                  </div>
                  <div className="w-14 h-14 bg-[#D4AF37]/10 border border-[#D4AF37]/50 text-[#D4AF37] rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <span className="text-2xl">⚡</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Profesional</h3>
                  <div className="text-4xl font-extrabold text-[#D4AF37] mb-4 drop-shadow-[0_0_15px_rgba(212,175,55,0.4)]">$400 <span className="text-sm text-white/50 font-normal">/mes</span></div>
                  <ul className="text-left text-white/70 space-y-3 mb-8 w-full text-xs font-light">
                    <li className="flex items-start gap-2">
                      <span className="text-[#D4AF37] font-bold mt-0.5">✓</span> Acceso <b className="text-white">ilimitado</b> a la IA Experta
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#D4AF37] font-bold mt-0.5">✓</span> Conectar hasta <b className="text-white">2 PLCs</b> en IA Planta
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#D4AF37] font-bold mt-0.5">✓</span> Soporte prioritario
                    </li>
                  </ul>
                  <button 
                    onClick={() => document.getElementById('operatorIdInput')?.focus()}
                    className="mt-auto w-full bg-[#D4AF37] hover:bg-[#F2CD5C] text-black py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs transition-all shadow-[0_0_20px_rgba(212,175,55,0.5)] hover:scale-105 active:scale-95"
                  >
                    Suscribirme
                  </button>
                </div>

                {/* PLAN ENTERPRISE */}
                <div className="flex-1 bg-black/60 backdrop-blur-xl border border-white/10 p-6 md:p-8 rounded-3xl flex flex-col items-center text-center shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:border-blue-500/50 transition-all hover:-translate-y-2 group">
                  <div className="w-12 h-12 bg-white/5 border border-white/10 text-blue-400 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <span className="text-xl">🏢</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Acceso Libre</h3>
                  <div className="text-3xl font-extrabold text-blue-400 mb-4 drop-shadow-[0_0_10px_rgba(96,165,250,0.3)]">$1000 <span className="text-sm text-white/50 font-normal">/mes</span></div>
                  <ul className="text-left text-white/70 space-y-3 mb-8 w-full text-xs font-light">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 font-bold mt-0.5">✓</span> Acceso <b className="text-white">total e ilimitado</b> al sistema
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 font-bold mt-0.5">✓</span> Conectar <b className="text-white">PLCs ilimitados</b>
                    </li>
                  </ul>
                  <button 
                    onClick={() => document.getElementById('operatorIdInput')?.focus()}
                    className="mt-auto w-full bg-white/10 hover:bg-blue-600 text-white py-3 rounded-xl font-bold uppercase tracking-wider text-xs transition-all border border-white/10 hover:border-transparent hover:shadow-[0_0_20px_rgba(37,99,235,0.4)]"
                  >
                    Acceso Total
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* YA LOGUEADO, MOSTRAMOS OPCIONES ORIGINALES IA EXPERTA / IA PLANTA EN LAS ORILLAS */
            <>
          {/* VERSION MOVIL: Burbujas flotantes */}
          <div className={`md:hidden flex ${expandedCard !== 'none' ? 'flex-col items-center' : 'flex-row items-end justify-between'} gap-6 pb-2 w-full transition-all duration-500`}>
            
            {/* IA EXPERTA - MÓVIL */}
            <div 
              onClick={(e) => {
                if (expandedCard !== 'expert') {
                  e.preventDefault();
                  setExpandedCard('expert');
                  return;
                }
                if (user) {
                  router.push('/chat');
                } else {
                  document.getElementById('operatorIdInput')?.focus();
                  setErrorMsg('Inicia sesión para acceder a la IA');
                  setExpandedCard('none');
                }
              }}
              className={`group bg-black/40 backdrop-blur-md border ${user ? 'border-[#0D9488]/50 shadow-[0_0_25px_rgba(13,148,136,0.2)]' : 'border-white/10'} hover:shadow-[0_0_25px_rgba(13,148,136,0.4)] hover:border-[#0D9488]/50 transition-all duration-500 cursor-pointer overflow-hidden relative shrink-0 
                ${expandedCard === 'expert' 
                  ? 'flex flex-col items-center text-center w-full max-w-[320px] rounded-3xl p-6 h-auto' 
                  : expandedCard === 'plant' 
                    ? 'hidden' 
                    : 'flex flex-col items-center justify-center w-16 h-16 rounded-full p-0 shadow-[0_0_20px_rgba(13,148,136,0.3)] animate-pulse'}`}
            >
              <button 
                className={`absolute top-4 left-4 w-8 h-8 items-center justify-center rounded-full bg-white/10 text-white/70 hover:text-white transition-colors z-20 ${expandedCard === 'expert' ? 'flex' : 'hidden'}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedCard('none');
                }}
              >
                ✕
              </button>

              <div className={`absolute top-0 right-0 p-3 transition-opacity duration-300 ${expandedCard === 'expert' ? 'opacity-100' : 'opacity-0'}`}>
                <span className={`${user ? 'bg-[#0D9488]/50' : 'bg-[#0D9488]/20'} border border-[#0D9488]/50 text-[#E0F2F1] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider`}>
                  {user ? '✓ ACCESO LIBRE' : `🔒 ${t.accessControl}`}
                </span>
              </div>
              
              <div className={`text-[#0D9488] transition-all duration-500 flex items-center justify-center 
                ${expandedCard === 'expert' ? 'w-12 h-12 bg-white/5 border border-white/10 rounded-2xl mb-4' : 'w-full h-full bg-transparent'}`}>
                <svg className={`drop-shadow-[0_0_8px_rgba(13,148,136,0.6)] ${expandedCard === 'expert' ? 'w-7 h-7' : 'w-8 h-8'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 2L3 12l9 10 9-10L12 2z" />
                  <circle cx="12" cy="12" r="3" strokeWidth="1.5" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6v3m0 6v3m-6-6h3m6 0h3" />
                </svg>
              </div>

              <div className={`flex flex-col items-center flex-1 transition-opacity duration-300 w-full ${expandedCard === 'expert' ? 'opacity-100 delay-100 block' : 'opacity-0 hidden'}`}>
                <h3 className="text-lg font-bold text-white mb-2 tracking-wide">{t.iaExpert}</h3>
                <p className="text-white/60 mb-4 flex-1 text-xs leading-relaxed font-light">{t.iaExpertDesc}</p>
                <div className="text-[#0D9488] font-semibold text-xs flex items-center gap-2 group-hover:translate-x-2 transition-transform mx-auto">
                  {user ? 'Entrar al Chat →' : 'Inicia sesión \u2191'}
                </div>
              </div>
            </div>

            {/* IA PLANTA - MÓVIL */}
            <div 
              onClick={(e) => {
                if (expandedCard !== 'plant') {
                  e.preventDefault();
                  setExpandedCard('plant');
                  return;
                }
                if (user) {
                  router.push('/planta');
                } else {
                  document.getElementById('operatorIdInput')?.focus();
                  setErrorMsg('Inicia sesión para acceder a la IA');
                  setExpandedCard('none');
                }
              }}
              className={`group rounded-3xl bg-black/40 backdrop-blur-md border ${user ? 'border-[#D4AF37]/50 shadow-[0_0_25px_rgba(212,175,55,0.2)]' : 'border-white/10'} hover:shadow-[0_0_25px_rgba(212,175,55,0.4)] hover:border-[#D4AF37]/50 transition-all duration-500 cursor-pointer overflow-hidden relative shrink-0 
                ${expandedCard === 'plant' 
                  ? 'flex flex-col items-center text-center w-full max-w-[320px] rounded-3xl p-6 h-auto opacity-100' 
                  : expandedCard === 'expert' 
                    ? 'hidden' 
                    : 'flex flex-col items-center justify-center w-16 h-16 rounded-full p-0 shadow-[0_0_20px_rgba(212,175,55,0.3)] animate-pulse'}`}
            >
              <button 
                className={`absolute top-4 left-4 w-8 h-8 items-center justify-center rounded-full bg-white/10 text-white/70 hover:text-white transition-colors z-20 ${expandedCard === 'plant' ? 'flex' : 'hidden'}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedCard('none');
                }}
              >
                ✕
              </button>

              <div className={`absolute top-0 right-0 p-3 transition-opacity duration-300 ${expandedCard === 'plant' ? 'opacity-100' : 'opacity-0'}`}>
                <span className={`${user ? 'bg-[#D4AF37]/50 text-[#FFF5D1]' : 'bg-[#D4AF37]/20 text-[#FFF5D1]'} border border-[#D4AF37]/50 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider`}>
                  {user ? '✓ ACCESO LIBRE' : `🔒 ${t.accessControl}`}
                </span>
              </div>

              <div className={`text-[#D4AF37] transition-all duration-500 flex items-center justify-center 
                ${expandedCard === 'plant' ? 'w-12 h-12 bg-white/5 border border-white/10 rounded-2xl mb-4' : 'w-full h-full bg-transparent'} group-hover:scale-110 group-hover:bg-[#D4AF37]/20`}>
                <svg className={`drop-shadow-[0_0_8px_rgba(212,175,55,0.6)] ${expandedCard === 'plant' ? 'w-7 h-7' : 'w-8 h-8'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4l-3 4h6l-3-4z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 8l-3 5h16l-3-5H7z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2 13l-2 7h24l-2-7H2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v5m-4-4v4m8-4v4" />
                  <rect x="10" y="10" width="4" height="3" className="fill-white/10" strokeWidth="1.5" />
                </svg>
              </div>

              <div className={`flex flex-col items-center flex-1 transition-opacity duration-300 w-full ${expandedCard === 'plant' ? 'opacity-100 delay-100 block' : 'opacity-0 hidden'}`}>
                <h3 className="text-lg font-bold text-white mb-2 tracking-wide">{t.iaPlant}</h3>
                <p className="text-white/60 mb-4 flex-1 text-xs leading-relaxed font-light">{t.iaPlantDesc}</p>
                <div className="text-[#D4AF37] font-semibold text-xs flex items-center gap-2 group-hover:translate-x-2 transition-transform mx-auto">
                  {user ? 'Entrar a Control →' : 'Inicia sesión \u2191'}
                </div>
              </div>
            </div>
          </div>

          {/* VERSION ESCRITORIO: Tarjetas Originales */}
          <div className="hidden md:flex flex-row items-end justify-between gap-6 pb-2 w-full">
            <div 
              onClick={() => {
                if (user) {
                  router.push('/chat');
                } else {
                  document.getElementById('operatorIdInput')?.focus();
                  setErrorMsg('Inicia sesión para acceder a la IA');
                }
              }}
              className={`group rounded-3xl bg-black/40 backdrop-blur-md border ${user ? 'border-[#0D9488]/50 shadow-[0_0_25px_rgba(13,148,136,0.2)]' : 'border-white/10'} p-6 shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:shadow-[0_0_25px_rgba(13,148,136,0.4)] hover:border-[#0D9488]/50 transition-all cursor-pointer flex flex-col items-center text-center h-full relative overflow-hidden w-[320px] shrink-0`}
            >
              <div className="absolute top-0 right-0 p-3">
                <span className={`${user ? 'bg-[#0D9488]/50' : 'bg-[#0D9488]/20'} border border-[#0D9488]/50 text-[#E0F2F1] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider`}>
                  {user ? '✓ ACCESO LIBRE' : `🔒 ${t.accessControl}`}
                </span>
              </div>
              <div className="w-12 h-12 bg-white/5 border border-white/10 text-[#0D9488] rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-[#0D9488]/20 transition-all">
                <svg className="w-7 h-7 drop-shadow-[0_0_8px_rgba(13,148,136,0.6)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 2L3 12l9 10 9-10L12 2z" />
                  <circle cx="12" cy="12" r="3" strokeWidth="1.5" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6v3m0 6v3m-6-6h3m6 0h3" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-2 tracking-wide">{t.iaExpert}</h3>
              <p className="text-white/60 mb-4 flex-1 text-xs leading-relaxed font-light">{t.iaExpertDesc}</p>
              <div className="text-[#0D9488] font-semibold text-xs flex items-center gap-2 group-hover:translate-x-2 transition-transform">
                {user ? 'Entrar al Chat →' : 'Inicia sesión arriba \u2191'}
              </div>
            </div>
            
            <div 
              onClick={() => {
                if (user) {
                  router.push('/planta');
                } else {
                  document.getElementById('operatorIdInput')?.focus();
                  setErrorMsg('Inicia sesión para acceder a la IA');
                }
              }}
              className={`group rounded-3xl bg-black/40 backdrop-blur-sm border ${user ? 'border-[#D4AF37]/50 shadow-[0_0_25px_rgba(212,175,55,0.2)]' : 'border-white/10'} p-6 shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:shadow-[0_0_25px_rgba(212,175,55,0.4)] hover:border-[#D4AF37]/50 transition-all cursor-pointer flex flex-col items-center text-center h-full relative overflow-hidden w-[320px] shrink-0`}
            >
              <div className="absolute top-0 right-0 p-3">
                <span className={`${user ? 'bg-[#D4AF37]/50 text-[#FFF5D1]' : 'bg-[#D4AF37]/20 text-[#FFF5D1]'} border border-[#D4AF37]/50 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider`}>
                  {user ? '✓ ACCESO LIBRE' : `🔒 ${t.accessControl}`}
                </span>
              </div>
              <div className="w-12 h-12 bg-white/5 border border-white/10 text-[#D4AF37] rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-[#D4AF37]/20 transition-all">
                <svg className="w-7 h-7 drop-shadow-[0_0_8px_rgba(212,175,55,0.6)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4l-3 4h6l-3-4z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 8l-3 5h16l-3-5H7z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2 13l-2 7h24l-2-7H2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v5m-4-4v4m8-4v4" />
                  <rect x="10" y="10" width="4" height="3" className="fill-white/10" strokeWidth="1.5" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-2 tracking-wide">{t.iaPlant}</h3>
              <p className="text-white/60 mb-4 flex-1 text-xs leading-relaxed font-light">{t.iaPlantDesc}</p>
              <div className="text-[#D4AF37] font-semibold text-xs flex items-center gap-2 group-hover:translate-x-2 transition-transform">
                {user ? 'Entrar a Control →' : 'Inicia sesión arriba \u2191'}
              </div>
            </div>
          </div>
            </>
          )}
        </main>
        <footer className="w-full mt-4 pt-4 border-t border-white/10 text-center text-xs text-white/40 tracking-widest uppercase">
          <p>{t.footer}</p>
        </footer>
      </div>

      {/* Modal Informativo */}
      {showInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-6 overflow-y-auto">
          <div className="relative w-full max-w-[800px] bg-[#1a1c18] border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col md:flex-row overflow-hidden my-auto animate-in fade-in zoom-in duration-300">
            
            <button 
              onClick={() => setShowInfo(false)}
              className="absolute top-4 right-4 z-20 w-8 h-8 bg-black/40 hover:bg-white/10 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-all border border-white/10"
            >
              ✕
            </button>

            {/* IA EXPERTA COLUMNA */}
            <div className="flex-1 p-8 sm:p-10 border-b md:border-b-0 md:border-r border-white/10 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-[#0D9488]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="flex items-center gap-4 mb-6 relative z-10">
                <div className="w-12 h-12 bg-black/40 border border-[#0D9488]/40 shadow-[0_0_15px_rgba(13,148,136,0.3)] rounded-2xl flex items-center justify-center text-[#0D9488]">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 2L3 12l9 10 9-10L12 2z" />
                    <circle cx="12" cy="12" r="3" strokeWidth="1.5" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6v3m0 6v3m-6-6h3m6 0h3" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white tracking-widest uppercase">{t.iaExpert || 'IA Experta'}</h3>
                  <p className="text-[#0D9488] text-xs font-bold tracking-widest uppercase">Asistente Técnico (RAG)</p>
                </div>
              </div>
              
              <ul className="space-y-4 text-sm text-white/70 font-light relative z-10">
                <li className="flex items-start gap-3">
                  <span className="text-[#0D9488] mt-0.5">✓</span>
                  <span><strong>Zero Alucinaciones:</strong> Respuestas 100% confiables basadas exclusivamente en *tus* manuales y diagramas (PDF/TXT). Soluciona tus problemas con total seguridad.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#0D9488] mt-0.5">✓</span>
                  <span><strong>Dispara tu OEE (Downtime Killer):</strong> Olvida las horas buscando en papel. Diagnostica y resuelve fallas complejas en segundos, aumentando tu Disponibilidad Pura hasta un 40%.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#0D9488] mt-0.5">✓</span>
                  <span><strong>Experto Matemático Integrado:</strong> Cálculos de calibración avanzados e ingeniería de control resueltos al instante de forma precisa.</span>
                </li>
              </ul>
            </div>

            {/* IA PLANTA COLUMNA */}
            <div className="flex-1 p-8 sm:p-10 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              <div className="flex items-center gap-4 mb-6 relative z-10">
                <div className="w-12 h-12 bg-black/40 border border-[#D4AF37]/40 shadow-[0_0_15px_rgba(212,175,55,0.3)] rounded-2xl flex items-center justify-center text-[#D4AF37]">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4l-3 4h6l-3-4z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 8l-3 5h16l-3-5H7z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2 13l-2 7h24l-2-7H2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v5m-4-4v4m8-4v4" />
                    <rect x="10" y="10" width="4" height="3" className="fill-white/10" strokeWidth="1.5" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white tracking-widest uppercase">{t.iaPlant || 'IA Planta'}</h3>
                  <p className="text-[#D4AF37] text-xs font-bold tracking-widest uppercase">Monitoreo IoT & Gemelo Digital</p>
                </div>
              </div>

              <ul className="space-y-4 text-sm text-white/70 font-light relative z-10">
                <li className="flex items-start gap-3">
                  <span className="text-[#D4AF37] mt-0.5">✓</span>
                  <span><strong>Conecta con Cualquier PLC:</strong> Compatibilidad nativa sin pagar licencias extras. Enlaza equipos Siemens, Modbus o Allen-Bradley en cuestión de clics.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#D4AF37] mt-0.5">✓</span>
                  <span><strong>Crece a tu Ritmo:</strong> Desde automatizar una sola máquina hasta tener una flotilla multimarca en tu gemelo digital. Se adapta perfecto a tu presupuesto.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#D4AF37] mt-0.5">✓</span>
                  <span><strong>Tu Planta en tu Bolsillo:</strong> Dashboards gerenciales en vivo. Monitorea KPIs críticos (presiones, cuellos de botella) desde tu celular o tablet en cualquier parte del mundo.</span>
                </li>
              </ul>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}
