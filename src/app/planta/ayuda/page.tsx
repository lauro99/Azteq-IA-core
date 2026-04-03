'use client';
import { useRouter } from 'next/navigation';
import LanguageSelector from '@/components/LanguageSelector';

export default function PlantaAyuda() {
  const router = useRouter();

  return (
    <div className="min-h-screen w-full flex flex-col relative bg-[#111]">
      <div className="absolute inset-0 bg-black/80 pointer-events-none z-0"></div>

      {/* Header Fijo */}
      <header className="relative z-20 p-4 sm:p-6 flex justify-between items-center border-b border-white/10 bg-black/40 backdrop-blur-md">
        <button 
          onClick={() => router.back()}
          className="text-white/70 hover:text-white flex items-center gap-2 text-sm font-semibold transition-colors"
        >
          <span>← Volver</span>
        </button>
        <div className="flex items-center gap-4">
          <LanguageSelector />
          <div className="h-6 w-px bg-white/20"></div>
          <span className="font-bold text-sm tracking-widest uppercase text-[#D4AF37]">
            Guía de Conexión
          </span>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="relative z-10 flex-1 overflow-y-auto p-4 md:p-8 flex justify-center text-white">
        <div className="w-full max-w-4xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            ¿Cómo conectar tu PLC a Azteq-IA?
          </h1>
          <p className="text-white/60 mb-10 text-lg font-light">
            Sigue estos pasos detallados para establecer una comunicación exitosa entre tu equipo y nuestro Central Core.
          </p>

          <div className="space-y-8">
            {/* Paso 1 */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37] font-bold text-xl">
                  1
                </div>
                <h2 className="text-2xl font-semibold">Misma Subred (IP)</h2>
              </div>
              <p className="text-white/70 mb-4 font-light leading-relaxed">
                Para que nuestro sistema pueda hablar con el PLC, ambos deben estar en la misma red local. Si tu PLC tiene la dirección IP <code className="bg-black/50 px-2 py-1 rounded text-cyan-400">192.168.0.10</code>, tu computadora debe tener una IP en el mismo rango, por ejemplo <code className="bg-black/50 px-2 py-1 rounded text-cyan-400">192.168.0.x</code> (donde "x" es cualquier número entre 1 y 254, excepto el 10).
              </p>
              <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                <h3 className="font-semibold text-sm mb-2 text-white/90">Cómo cambiar tu IP en Windows:</h3>
                <ol className="text-sm text-white/60 space-y-2 list-decimal pl-4">
                  <li>Presiona <kbd className="bg-white/10 px-1 rounded text-white/90">Win + R</kbd>, escribe <code>ncpa.cpl</code> y da Enter.</li>
                  <li>Click derecho en tu adaptador de red (Ethernet o Wi-Fi) y selecciona <strong>Propiedades</strong>.</li>
                  <li>Haz doble click en <strong>Protocolo de Internet versión 4 (TCP/IPv4)</strong>.</li>
                  <li>Selecciona "Usar la siguiente dirección IP" y escribe tu IP (ej. 192.168.0.100) y la máscara de subred (usualmente 255.255.255.0).</li>
                  <li>Guarda y cierra.</li>
                </ol>
              </div>
            </div>

            {/* Paso 2 */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37] font-bold text-xl">
                  2
                </div>
                <h2 className="text-2xl font-semibold">Configuración de Puertos</h2>
              </div>
              <p className="text-white/70 mb-4 font-light leading-relaxed">
                El puerto especifica el "canal" por el cual nos comunicaremos con el hardware. Dependiendo de tu marca de PLC, este puerto cambia.
              </p>
              <ul className="text-sm text-white/60 space-y-2 list-disc pl-4 mb-4">
                <li><strong className="text-white/90">Siemens:</strong> Generalmente usa el puerto <code className="text-teal-400">102</code>.</li>
                <li><strong className="text-white/90">Allen-Bradley:</strong> Generalmente usa el puerto <code className="text-blue-400">44818</code> (EtherNet/IP).</li>
                <li><strong className="text-white/90">Modbus TCP (Varios):</strong> Generalmente usa el puerto <code className="text-purple-400">502</code>.</li>
              </ul>
              <p className="text-white/50 text-xs font-light italic">
                Nota: Asegúrate de que el firewall de Windows no esté bloqueando las conexiones entrantes y salientes en estos puertos.
              </p>
            </div>

            {/* Paso 3 */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37] font-bold text-xl">
                  3
                </div>
                <h2 className="text-2xl font-semibold">Configuración específica: Siemens</h2>
              </div>
              <p className="text-white/70 mb-4 font-light leading-relaxed">
                Si utilizas un equipo Siemens (S7-1200 o S7-1500), existen un par de requisitos extra dentro del entorno <strong>TIA Portal</strong>.
              </p>
              <div className="space-y-4 text-sm text-white/70">
                <div className="bg-black/30 p-3 rounded-lg border-l-2 border-teal-500">
                  <h4 className="font-bold text-white mb-1">1. Habilitar Acceso PUT/GET</h4>
                  <p className="text-white/60 font-light">
                    Ve a las propiedades del CPU &gt; Protección y Seguridad &gt; Mecanismos de conexión &gt; Marca la casilla <strong>"Permitir acceso vía comunicación PUT/GET desde el interlocutor remoto"</strong>.
                  </p>
                </div>
                <div className="bg-black/30 p-3 rounded-lg border-l-2 border-teal-500">
                  <h4 className="font-bold text-white mb-1">2. Bloques de Datos Optimizados (DB)</h4>
                  <p className="text-white/60 font-light">
                    Si necesitas leer variables dentro de un Data Block (DB), asegúrate de dar click derecho en el DB &gt; Propiedades &gt; Desmarca <strong>"Acceso optimizado al bloque"</strong>. Esto permitirá al software externo ubicar la dirección real de la variable.
                  </p>
                </div>
                <div className="bg-black/30 p-3 rounded-lg border-l-2 border-teal-500">
                  <h4 className="font-bold text-white mb-1">3. Rack y Slot</h4>
                  <p className="text-white/60 font-light">
                    Normalmente, para un S7-300 o S7-1200/1500, el <strong>Rack es 0</strong> y el <strong>Slot es 1</strong>. Para equipos más viejos (S7-400), el Slot a veces es 2.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}