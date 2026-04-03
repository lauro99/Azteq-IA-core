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
          <div className="pointer-events-auto">
            <LanguageSelector />
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
                <span className="text-[#E0F2F1] text-[10px] font-bold uppercase tracking-widest">{t.accessControl}</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input 
                  id="operatorIdInput"
                  type="text" 
                  placeholder={t.operatorId} 
                  value={operatorId || ''}
                  onChange={(e) => setOperatorId(e.target.value)}
                  disabled={isLoading}
                  className="bg-white/5 border border-white/10 text-white placeholder-white/30 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-[#D4AF37]/50 focus:bg-white/10 transition-all font-light w-full flex-1" 
                />
                <input 
                  type="password" 
                  placeholder={t.accessCode} 
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
          className="w-full flex-1 flex flex-col justify-end"
          onClick={(e) => {
            if (e.target === e.currentTarget) setExpandedCard('none');
          }}
        >
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
              }}
              className={`rounded-3xl bg-black/20 backdrop-blur-sm border border-white/5 border-dashed transition-all duration-500 cursor-pointer overflow-hidden relative shrink-0 
                ${expandedCard === 'plant' 
                  ? 'flex flex-col items-center text-center w-full max-w-[320px] rounded-3xl p-6 h-auto opacity-100 grayscale-0' 
                  : expandedCard === 'expert' 
                    ? 'hidden' 
                    : 'flex flex-col items-center justify-center w-16 h-16 rounded-full p-0 opacity-80 backdrop-blur-md grayscale'}`}
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
                <span className="bg-white/5 border border-white/10 text-white/50 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">{t.comingSoon}</span>
              </div>

              <div className={`text-[#D4AF37] transition-all duration-500 flex items-center justify-center 
                ${expandedCard === 'plant' ? 'w-12 h-12 bg-white/5 border border-white/10 rounded-2xl mb-4' : 'w-full h-full bg-transparent'}`}>
                <svg className={`drop-shadow-[0_0_8px_rgba(212,175,55,0.4)] ${expandedCard === 'plant' ? 'w-7 h-7' : 'w-8 h-8'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4l-3 4h6l-3-4z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 8l-3 5h16l-3-5H7z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2 13l-2 7h24l-2-7H2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v5m-4-4v4m8-4v4" />
                  <rect x="10" y="10" width="4" height="3" className="fill-white/10" strokeWidth="1.5" />
                </svg>
              </div>

              <div className={`flex flex-col items-center flex-1 transition-opacity duration-300 w-full ${expandedCard === 'plant' ? 'opacity-100 delay-100 block' : 'opacity-0 hidden'}`}>
                <h3 className="text-lg font-bold text-white/80 mb-2 tracking-wide">{t.iaPlant}</h3>
                <p className="text-white/50 mb-4 flex-1 text-xs leading-relaxed font-light">{t.iaPlantDesc}</p>
                <div className="text-white/30 font-semibold text-xs flex items-center justify-center gap-2">{t.inDevelopment}</div>
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
            
            <div className="rounded-3xl bg-black/20 backdrop-blur-sm border border-white/5 border-dashed p-6 flex flex-col items-center text-center h-full relative overflow-hidden opacity-60 grayscale hover:grayscale-0 transition-all w-[320px] shrink-0">
              <div className="absolute top-0 right-0 p-3">
                <span className="bg-white/5 border border-white/10 text-white/50 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">{t.comingSoon}</span>
              </div>
              <div className="w-12 h-12 bg-white/5 border border-white/10 text-[#D4AF37] rounded-2xl flex items-center justify-center mb-4">
                <svg className="w-7 h-7 drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4l-3 4h6l-3-4z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 8l-3 5h16l-3-5H7z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2 13l-2 7h24l-2-7H2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v5m-4-4v4m8-4v4" />
                  <rect x="10" y="10" width="4" height="3" className="fill-white/10" strokeWidth="1.5" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white/80 mb-2 tracking-wide">{t.iaPlant}</h3>
              <p className="text-white/50 mb-4 flex-1 text-xs leading-relaxed font-light">{t.iaPlantDesc}</p>
              <div className="text-white/30 font-semibold text-xs flex items-center gap-2">{t.inDevelopment}</div>
            </div>
          </div>
        </main>
        <footer className="w-full mt-4 pt-4 border-t border-white/10 text-center text-xs text-white/40 tracking-widest uppercase">
          <p>{t.footer}</p>
        </footer>
      </div>
    </div>
  );
}
