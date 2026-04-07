'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function RecuperarPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    
    if (!email) {
      setMessage('Por favor ingresa tu correo electrónico.');
      setIsError(true);
      return;
    }
    
    setIsLoading(true);
    
    // Si no incluye arroba, usamos el dominio base
    const emailToUse = email.includes('@') ? email : `${email}@azteq.com`;

    // Solicitar a Supabase que envíe un correo de recuperación
    const { error } = await supabase.auth.resetPasswordForEmail(emailToUse, {
      // Esta URL debe apuntar a la página donde vas a procesar el cambio de clave real
      redirectTo: `${window.location.origin}/reset-password`,
    });
    
    setIsLoading(false);
    
    if (error) {
      setMessage(error.message || 'Error al solicitar el restablecimiento.');
      setIsError(true);
    } else {
      setMessage('Te hemos enviado un enlace para restablecer tu contraseña. Revisa tu correo.');
      setIsError(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#111] relative overflow-y-auto bg-no-repeat bg-center bg-[url('/azteq-IA_phone.png')] md:bg-[url('/azteq-IA.png')] bg-[length:100%_100%] bg-fixed">
      <div className="absolute inset-0 bg-black/60 z-0 pointer-events-none"></div>
      
      <div className="relative z-10 w-full max-w-sm m-4">
        <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] flex flex-col items-center">
          
          <div className="w-12 h-12 mb-4 rounded-full bg-[#0D9488]/20 flex items-center justify-center shadow-[0_0_15px_#0D9488]">
            <svg className="w-6 h-6 text-[#0D9488]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          
          <h1 className="text-xl font-bold text-white mb-2 tracking-widest drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] text-center uppercase">
            Recuperar Acceso
          </h1>
          <p className="text-white/50 text-[10px] uppercase text-center mb-8 px-2">
            Ingresa tu correo y te enviaremos un enlace seguro para que puedas cambiar tu contraseña.
          </p>
          
          <form onSubmit={handleResetPassword} className="w-full flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-white/60 text-[10px] uppercase font-bold tracking-widest ml-1">Correo electrónico</label>
              <input
                type="email"
                placeholder="operador@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="bg-white/5 border border-white/10 text-white placeholder-white/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#D4AF37]/50 focus:bg-white/10 transition-all font-light w-full"
              />
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
              {isLoading ? 'Enviando...' : 'Enviar enlace'}
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
              Volver al Inicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}