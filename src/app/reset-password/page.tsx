'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  
  // Validamos si efectivamente hay una sesión de recuperación en curso
  useEffect(() => {
    supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'PASSWORD_RECOVERY') {
        // Todo en orden, el usuario hizo clic en el enlace de su correo
        console.log("Recuperación de contraseña iniciada");
      }
    });
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    
    if (!newPassword) {
      setMessage('Por favor ingresa la nueva contraseña.');
      setIsError(true);
      return;
    }

    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);

    if (newPassword.length < 6 || !hasUpperCase || !hasSpecialChar || !hasNumber) {
      setMessage('La contraseña debe tener al menos 6 caracteres (incluyendo números), 1 mayúscula y 1 símbolo especial (#$%&).');
      setIsError(true);
      return;
    }
    
    setIsLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    
    setIsLoading(false);
    
    if (error) {
      setMessage(error.message || 'Error al actualizar tu contraseña.');
      setIsError(true);
    } else {
      setMessage('¡Contraseña actualizada con éxito! Redirigiendo...');
      setIsError(false);
      // Tras unos segundos, redirigimos al inicio
      setTimeout(() => {
        router.push('/');
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#111] relative overflow-y-auto bg-no-repeat bg-center bg-[url('/azteq-IA_phone.png')] md:bg-[url('/azteq-IA.png')] bg-[length:100%_100%] bg-fixed">
      <div className="absolute inset-0 bg-black/60 z-0 pointer-events-none"></div>
      
      <div className="relative z-10 w-full max-w-sm m-4">
        <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] flex flex-col items-center">
          
          <div className="w-12 h-12 mb-4 rounded-full bg-[#0D9488]/20 flex items-center justify-center shadow-[0_0_15px_#0D9488]">
            <svg className="w-6 h-6 text-[#0D9488]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          
          <h1 className="text-xl font-bold text-white mb-2 tracking-widest drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] text-center uppercase">
            Nueva Contraseña
          </h1>
          <p className="text-white/50 text-[10px] uppercase text-center mb-8 px-2">
            Ingresa tu nueva credencial de seguridad.
          </p>
          
          <form onSubmit={handleUpdatePassword} className="w-full flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-white/60 text-[10px] uppercase font-bold tracking-widest ml-1">Nueva Contraseña</label>
              <input
                type="password"
                placeholder="6 caracteres, 1 número, 1 mayú, 1 símbolo"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
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
              {isLoading ? 'Actualizando...' : 'Guardar y Entrar'}
            </button>
          </form>
          
          {!isLoading && isError && (
             <div className="mt-8 pt-6 border-t border-white/10 w-full text-center">
              <Link 
                href="/" 
                className="text-[#E0F2F1] hover:text-[#0D9488] text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
              >
                Cancelar y volver al inicio
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}