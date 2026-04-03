import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="min-h-screen w-full flex flex-col relative overflow-y-auto bg-[#111] bg-no-repeat bg-center"
         style={{ backgroundImage: 'url(/azteq-IA.png)', backgroundSize: '100% 100%', backgroundAttachment: 'fixed' }}>
      
      {/* Overlay oscuro para que el texto sea legible */}
      <div className="absolute inset-0 bg-black/60 pointer-events-none z-0"></div>

      <div className="relative z-10 w-full min-h-screen pt-4 pb-2 px-4 flex flex-col">
        {/* Contenido Principal */}
        <main className="max-w-6xl w-full mx-auto flex-1 flex flex-col justify-end">

          {/* Tarjetas de Módulos */}
          {/* Se usa flex con justify-between para mandarlas a las orillas */}
          <div className="flex flex-col md:flex-row items-end justify-between gap-4 pb-2 w-full">  

            {/* Módulo 1: Chat Experto (Listo) */}
            <Link href="/chat" className="group rounded-3xl bg-black/40 backdrop-blur-md border border-white/10 p-6 shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:shadow-[0_0_25px_rgba(13,148,136,0.4)] hover:border-[#0D9488]/50 transition-all cursor-pointer flex flex-col items-start h-full relative overflow-hidden w-full md:w-[320px] shrink-0">
              <div className="absolute top-0 right-0 p-3">
                <span className="bg-[#0D9488]/20 border border-[#0D9488]/50 text-[#E0F2F1] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Activo</span>
              </div>
              <div className="w-12 h-12 bg-white/5 border border-white/10 text-[#0D9488] rounded-2xl flex items-center justify-center text-xl mb-4 group-hover:scale-110 group-hover:bg-[#0D9488]/20 transition-all">
                🤖
              </div>
              <h3 className="text-lg font-bold text-white mb-2 tracking-wide">IA Experta (Manuales)</h3>
              <p className="text-white/60 mb-4 flex-1 text-xs leading-relaxed font-light">   
                Asistente de Superinteligencia basado en los manuales oficiales de tu empresa. Resuelve dudas operativas en base a conocimiento guardado.
              </p>
              <div className="text-[#0D9488] font-semibold text-xs flex items-center gap-2 group-hover:translate-x-2 transition-transform">
                Abrir Chat <span aria-hidden="true">&rarr;</span>
              </div>
            </Link>

            {/* Módulo 3: IA Planta (Próximamente) */}
            <div className="rounded-3xl bg-black/20 backdrop-blur-sm border border-white/5 border-dashed p-6 flex flex-col items-start h-full relative overflow-hidden opacity-60 grayscale hover:grayscale-0 transition-all w-full md:w-[320px] shrink-0">
              <div className="absolute top-0 right-0 p-3">
                <span className="bg-white/5 border border-white/10 text-white/50 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Próximamente</span>
              </div>
              <div className="w-12 h-12 bg-white/5 border border-white/10 text-white/40 rounded-2xl flex items-center justify-center text-xl mb-4">
                🏭
              </div>
              <h3 className="text-lg font-bold text-white/80 mb-2 tracking-wide">IA Planta (Conexión PLC)</h3>
              <p className="text-white/50 mb-4 flex-1 text-xs leading-relaxed font-light">   
                Monitoreo analítico predictivo en tiempo real conectado a sensores. Detecta posibles fallas y anomalías en las máquinas de forma autónoma.        
              </p>
              <div className="text-white/30 font-semibold text-xs flex items-center gap-2">
                En desarrollo...
              </div>
            </div>

          </div>
        </main>

        {/* Footer */}
        <footer className="max-w-6xl w-full mx-auto mt-4 pt-4 border-t border-white/10 text-center text-xs text-white/40 tracking-widest uppercase">
          <p>&copy; 2026 Azteq-IA. Sistema Operacional de Nueva Generación.</p>   
        </footer>
      </div>
    </div>
  );
}
