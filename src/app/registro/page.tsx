'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useLanguage } from '@/components/LanguageContext';

export default function RegistroPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    
    if (!email || !username || !password) {
      setMessage(t.fillAllFields || 'Por favor llena todos los campos.');
      setIsError(true);
      return;
    }

    if (!acceptedTerms) {
      setMessage('Debes aceptar los Términos y Políticas para registrarte.');
      setIsError(true);
      return;
    }

    // Validaciones de contraseña
    const hasUpperCase = /[A-Z]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (password.length < 6 || !hasUpperCase || !hasSpecialChar || !hasNumber) {
      setMessage(t.passwordRequirements || 'La contraseña debe tener al menos 6 caracteres (incluyendo números), 1 mayúscula y 1 símbolo especial (#$%&).');
      setIsError(true);
      return;
    }
    
    setIsLoading(true);
    
    // Si no incluye arroba, usamos el dominio base como en el login
    const emailToUse = email.includes('@') ? email : `${email}@azteq.com`;

    const { error } = await supabase.auth.signUp({
      email: emailToUse,
      password,
      options: {
        data: {
          username: username,
        }
      }
    });
    
    if (error) {
      setMessage(error.message || t.registerError || 'Error al registrarte. Intenta de nuevo.');
      setIsError(true);
      setIsLoading(false);
    } else {
      setMessage(t.redirecting || 'Redirigiendo al sistema...');
      setIsError(false);
      // Supabase por defecto inicia sesión automáticamente si no requiere confirmación de email
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#111] relative overflow-y-auto bg-no-repeat bg-center bg-[url('/azteq-IA_phone.png')] md:bg-[url('/azteq-IA.png')] bg-[length:100%_100%] bg-fixed">
      <div className="absolute inset-0 bg-black/60 z-0 pointer-events-none"></div>
      
      <div className="relative z-10 w-full max-w-sm m-4">
        <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] flex flex-col items-center">
          
          <div className="w-12 h-12 mb-4 rounded-full bg-[#0D9488]/20 flex items-center justify-center shadow-[0_0_15px_#0D9488]">
            <svg className="w-6 h-6 text-[#0D9488]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          
          <h1 className="text-xl font-bold text-white mb-8 tracking-widest drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] text-center uppercase">
            {t.registerOperator || 'Registro de Operador'}
          </h1>
          
          <form onSubmit={handleRegister} className="w-full flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-white/60 text-[10px] uppercase font-bold tracking-widest ml-1">{t.operatorName || 'Nombre de Operador'}</label>
              <input
                type="text"
                placeholder={t.operatorNamePlaceholder || "Ej. Juan Perez"}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                className="bg-white/5 border border-white/10 text-white placeholder-white/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#0D9488]/50 focus:bg-white/10 transition-all font-light w-full"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-white/60 text-[10px] uppercase font-bold tracking-widest ml-1">{t.emailAddress || 'Correo electrónico'}</label>
              <input
                type="email"
                placeholder={t.emailPlaceholder || "operador@ejemplo.com"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="bg-white/5 border border-white/10 text-white placeholder-white/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#D4AF37]/50 focus:bg-white/10 transition-all font-light w-full"
              />
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-white/60 text-[10px] uppercase font-bold tracking-widest ml-1">{t.password || 'Contraseña'}</label>
              <input
                type="password"
                placeholder={t.passwordPlaceholder || "6 caracteres, 1 número, 1 mayú, 1 símbolo"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="bg-white/5 border border-white/10 text-white placeholder-white/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#D4AF37]/50 focus:bg-white/10 transition-all font-light w-full"
              />
            </div>
            
            <div className="flex items-start gap-3 mt-2 pr-2">
              <input
                type="checkbox"
                id="terms"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                disabled={isLoading}
                className="mt-1 w-4 h-4 bg-black/40 border border-white/30 rounded cursor-pointer accent-[#D4AF37]"
              />
              <label htmlFor="terms" className="text-white/60 text-[10px] leading-tight flex-1">
                He leído y acepto los <Link href="/terminos-condiciones" className="text-[#D4AF37] hover:underline" target="_blank">Términos y Condiciones</Link>, la <Link href="/politica-privacidad" className="text-[#0D9488] hover:underline" target="_blank">Política de Privacidad</Link> y la <Link href="/politica-cookies" className="text-white/80 hover:underline" target="_blank">Política de Cookies</Link>.
              </label>
            </div>
            
            {message && (
              <p className={`text-xs uppercase font-bold tracking-widest text-center mt-2 ${isError ? 'text-red-400' : 'text-[#D4AF37]'}`}>
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="mt-4 bg-[#D4AF37] hover:bg-[#E5C158] disabled:opacity-50 text-black px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all hover:scale-105 active:scale-95 w-full shadow-[0_4px_15px_rgba(212,175,55,0.3)]"
            >
              {isLoading ? (t.registering || 'Registrando...') : (t.registerAction || 'Registrar')}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/10 w-full text-center">
            <Link 
              href="/" 
              className="text-[#E0F2F1] hover:text-[#0D9488] text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {t.backToHome || 'Volver al Inicio'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
