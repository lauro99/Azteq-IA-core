import ChatClient from './ChatClient';
import Link from 'next/link';
import LanguageSelector from '@/components/LanguageSelector';

export default function ChatPage() {
  return (
    <div className="h-screen w-full bg-[#111] flex flex-col relative overflow-hidden bg-no-repeat bg-center"
         style={{ backgroundImage: 'url(/aztec_chat.png)', backgroundSize: '100% 100%' }}>
      
      {/* Top Bar para botones superiores */}
      <div className="absolute top-4 left-4 right-4 sm:top-6 sm:left-6 sm:right-6 z-50 flex justify-between items-start pointer-events-none">
        
        {/* Botón de regreso al inicio */}
        <div className="pointer-events-auto">
          <Link href="/" className="group relative flex items-center gap-3 bg-black/60 backdrop-blur-md border border-[#0D9488]/30 px-5 py-2.5 shadow-[0_4px_20px_rgba(0,0,0,0.6)] hover:bg-[#0D9488]/10 hover:border-[#D4AF37]/50 hover:shadow-[0_0_15px_rgba(212,175,55,0.3)] transition-all overflow-hidden">
            
            {/* Esquinas / Decoración Geométrica Azteca */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-[#0D9488] group-hover:border-[#D4AF37] transition-colors"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-[#0D9488] group-hover:border-[#D4AF37] transition-colors"></div>       
            
            {/* Ícono de punta de lanza / pirámide azteca */}
            <div className="w-5 h-5 text-[#0D9488] group-hover:text-[#D4AF37] group-hover:-translate-x-1 drop-shadow-[0_0_5px_currentColor] transition-all">      
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="1.5" d="M11 20L3 12l8-8" />
                <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="1.5" d="M18 16l-4-4 4-4" />
                <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="1.5" d="M4 12h14" />
              </svg>
            </div>
            
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#E0F2F1] group-hover:text-[#D4AF37] transition-colors">
              Retornar
            </span>
          </Link>
        </div>

        {/* Selector de Idioma (Lado Derecho en Chat) */}
        <LanguageSelector />
      </div>

      {/* Contenedor posicionado en la parte inferior para no tapar el rostro del Azteca */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-end pb-16 md:pb-24 px-4">
         <ChatClient />
      </div>
    </div>
  );
}
