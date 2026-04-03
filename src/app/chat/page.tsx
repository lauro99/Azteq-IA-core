'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import ChatClient from './ChatClient';
import Link from 'next/link';
import LanguageSelector from '@/components/LanguageSelector';
import { useLanguage } from '@/components/LanguageContext';

export default function ChatPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Si no hay sesión válida, redirigir a la página principal
        router.push('/');
      } else {
        // Todo en orden
        setIsAuthorized(true);
        
        // Revisamos si el usuario es administrador (su correo/ID empieza con 'adm')
        const userEmail = session.user?.email || '';
        const username = userEmail.split('@')[0].toLowerCase();
        if (username.startsWith('adm')) {
          setIsAdmin(true);
        }
      }
    };
    checkAuth();
  }, [router]);

  if (!isAuthorized) {
    return <div className="h-screen w-full bg-[#111] flex items-center justify-center text-white">Cargando módulos de seguridad...</div>;
  }

  return (
    <div className="h-screen w-full bg-[#111] flex flex-col relative overflow-hidden bg-no-repeat bg-center"
         style={{ backgroundImage: 'url(/Chat-Azteq.png)', backgroundSize: '100% 100%' }}>
      
      {/* Botón de retorno y Cambio de Lenguaje */}
      <div className="absolute top-4 left-4 right-4 sm:top-6 sm:left-6 sm:right-6 z-50 flex justify-between items-start pointer-events-none">
        
        <div className="pointer-events-auto flex items-center gap-4">
          <Link href="/" className="group relative flex items-center gap-3 bg-black/60 backdrop-blur-md border border-[#0D9488]/30 px-5 py-2.5 shadow-[0_4px_20px_rgba(0,0,0,0.6)] hover:bg-[#0D9488]/10 hover:border-[#D4AF37]/50 hover:shadow-[0_0_15px_rgba(212,175,55,0.3)] transition-all overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-[#0D9488] group-hover:border-[#D4AF37] transition-colors"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-[#0D9488] group-hover:border-[#D4AF37] transition-colors"></div>
            
            <div className="w-5 h-5 text-[#0D9488] group-hover:text-[#D4AF37] group-hover:-translate-x-1 drop-shadow-[0_0_5px_currentColor] transition-all">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="1.5" d="M11 20L3 12l8-8" />
                <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="1.5" d="M18 16l-4-4 4-4" />
                <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="1.5" d="M4 12h14" />
              </svg>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#E0F2F1] group-hover:text-[#D4AF37] transition-colors">
              {t.returnBtn}
            </span>
          </Link>

          {/* EL BOTÓN SECRETO QUE SOLO SE MUESTRA SI ES ADMIN */}
          {isAdmin && (
            <Link href="/admin" className="group relative flex items-center gap-3 bg-[#111]/80 backdrop-blur-md border border-[#D4AF37]/30 px-5 py-2.5 shadow-[0_4px_20px_rgba(0,0,0,0.8)] hover:bg-[#D4AF37]/20 transition-all overflow-hidden cursor-pointer rounded-xl">
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#D4AF37] group-hover:text-white transition-colors">
                Panel Admin
              </span>
              <span className="text-sm group-hover:rotate-90 transition-transform duration-500">❂</span>
            </Link>
          )}
        </div>

        <div className="pointer-events-auto">
          <LanguageSelector />
        </div>
      </div>

      {/* Contenedor posicionado en la parte inferior para no tapar el rostro del Azteca */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-end pb-6 md:pb-8 px-4">
         <ChatClient />
      </div>
    </div>
  );
}
