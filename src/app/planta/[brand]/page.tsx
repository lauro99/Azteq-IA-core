'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import LanguageSelector from '@/components/LanguageSelector';

const brandData: Record<string, {name: string, color: string}> = {
  siemens: { name: 'Siemens', color: 'text-teal-400' },
  allenbradley: { name: 'Allen-Bradley', color: 'text-blue-400' },
  delta: { name: 'Delta', color: 'text-cyan-400' },
  keyence: { name: 'Keyence', color: 'text-slate-300' },
  mitsubishi: { name: 'Mitsubishi', color: 'text-red-400' },
  fanuc: { name: 'Fanuc', color: 'text-yellow-400' }
};

export default function PlcDashboard() {
  const params = useParams();
  const router = useRouter();
  
  // Extraemos el nombre de la marca desde la URL (dinámicamente)
  const brandId = (params?.brand as string) || 'desconocido';
  const brandInfo = brandData[brandId] || { name: brandId.toUpperCase(), color: 'text-[#D4AF37]' };

  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Form states
  const [ipAddress, setIpAddress] = useState('');
  const [port, setPort] = useState('102'); // Default common port for PLCs like S7

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/');
      } else {
        setLoading(false);
      }
    };
    checkSession();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full bg-[#D4AF37] animate-pulse"></div>
      </div>
    );
  }

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    setIsConnecting(true);
    
    // Simulate connection delay
    setTimeout(() => {
      setIsConnecting(false);
      setIsConnected(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen w-full flex flex-col relative bg-[#111]">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1565514020179-026b92b84bb6?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10 pointer-events-none z-0 mix-blend-luminosity grayscale"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/90 to-black/60 pointer-events-none z-0"></div>

      {/* Header Fijo */}
      <header className="relative z-20 p-4 sm:p-6 flex justify-between items-center border-b border-white/10 bg-black/40 backdrop-blur-md">
        <button 
          onClick={() => isConnected ? setIsConnected(false) : router.push('/planta')}
          className="text-white/70 hover:text-white flex items-center gap-2 text-sm font-semibold transition-colors"
        >
          <span>← {isConnected ? 'Desconectar' : 'Volver a Marcas'}</span>
        </button>
        <div className="flex items-center gap-4">
          <LanguageSelector />
          <div className="h-6 w-px bg-white/20"></div>
          <span className={`font-bold text-sm tracking-widest uppercase ${brandInfo.color}`}>
            {isConnected ? `Control Central - ${brandInfo.name}` : `Conexión PLC - ${brandInfo.name}`}
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      {!isConnected ? (
        /* PANTALLA DE CONEXIÓN AL PLC */
        <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-md bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 flex flex-col items-center shadow-2xl relative overflow-hidden">
            {/* Ambient Background Glow for Form */}
            <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${
              brandId === 'siemens' ? 'from-teal-400 to-teal-700' : 
              brandId === 'allenbradley' ? 'from-blue-400 to-blue-700' : 
              brandId === 'delta' ? 'from-cyan-400 to-cyan-700' : 
              brandId === 'mitsubishi' ? 'from-red-400 to-red-700' : 
              brandId === 'fanuc' ? 'from-yellow-400 to-yellow-700' : 
              'from-slate-400 to-slate-700'
            }`}></div>

            <div className="mb-6 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 shadow-lg">
                <svg className={`w-8 h-8 ${brandInfo.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Establecer Conexión</h2>
              <p className="text-white/50 text-sm font-light">
                Por favor ingresa los parámetros de red para conetar al controlador <span className="font-semibold text-white/80">{brandInfo.name}</span>.
              </p>
            </div>

            <form onSubmit={handleConnect} className="w-full flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-white/70 uppercase tracking-widest px-1">Dirección IP / Host</label>
                <input 
                  type="text" 
                  value={ipAddress}
                  onChange={(e) => setIpAddress(e.target.value)}
                  placeholder="ej. 192.168.0.1"
                  required
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/50 transition-all font-mono"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-white/70 uppercase tracking-widest px-1">Puerto (Opcional)</label>
                <input 
                  type="text" 
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  placeholder="ej. 102"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/50 transition-all font-mono"
                />
              </div>

              {brandId === 'siemens' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-white/70 uppercase tracking-widest px-1">Rack</label>
                    <input type="number" defaultValue="0" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-[#D4AF37] transition-all font-mono" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-white/70 uppercase tracking-widest px-1">Slot</label>
                    <input type="number" defaultValue="1" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-[#D4AF37] transition-all font-mono" />
                  </div>
                </div>
              )}

              <button 
                type="submit" 
                disabled={isConnecting}
                className="mt-4 w-full bg-[#D4AF37] hover:bg-[#E5C158] text-black font-bold uppercase tracking-widest py-4 rounded-xl transition-all shadow-[0_0_15px_rgba(212,175,55,0.3)] hover:shadow-[0_0_25px_rgba(212,175,55,0.5)] flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isConnecting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                    Conectando...
                  </>
                ) : (
                  <>
                    Conectar al PLC
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  </>
                )}
              </button>
            </form>
          </div>
        </main>
      ) : (
        /* Tablero Principal Dashboard / Chat */
        <main className="relative z-10 flex-1 p-4 md:p-6 lg:p-8 flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
          
          {/* Columna Izquierda: Sensores y Datos (IoT Dashboard Falso/Estructura base) */}
          <div className="flex-[2] flex flex-col gap-6 min-h-[400px]">
            <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-3xl p-6 flex flex-col shadow-lg h-full relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-green-500/50 shadow-[0_0_10px_#22c55e]"></div>
              <h2 className="text-white font-bold tracking-wider mb-6 flex items-center justify-between">
                <span className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]"></div>
                  MONITOREO EN TIEMPO REAL
                </span>
                <span className="text-xs font-mono text-white/40">{ipAddress}:{port}</span>
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {/* Cuadro de Sensor 1 */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center hover:bg-white/10 transition-colors">
                <span className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-2">Temperatura CPU</span>
                <span className="text-3xl font-black text-white">45<span className="text-lg text-white/40">°C</span></span>
              </div>
              {/* Cuadro de Sensor 2 */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center hover:bg-white/10 transition-colors">
                <span className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-2">Presión Sistema</span>
                <span className="text-3xl font-black text-white">1.2<span className="text-lg text-white/40">bar</span></span>
              </div>
              {/* Cuadro de Sensor 3 */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center hover:bg-white/10 transition-colors">
                <span className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-2">Estatus General</span>
                <span className="text-lg font-black text-green-400 mt-2 shadow-sm drop-shadow-lg">OPERATIVO</span>
              </div>
              {/* Cuadro de Sensor 4 */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center hover:bg-white/10 transition-colors">
                <span className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-2">Ciclos / Hora</span>
                <span className="text-3xl font-black text-white">1,240</span>
              </div>
              {/* Mensaje Largo */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center col-span-2 md:col-span-2 hover:bg-white/10 transition-colors">
                <span className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-2">Alarma Predictiva</span>
                <span className="text-sm font-light text-white/80 mt-1">
                  El sistema {brandInfo.name} no presenta anomalías en la última lectura. Todo rinde al 98% de su capacidad.
                </span>
              </div>
              </div>
            </div>
          </div>

          {/* Columna Derecha: IA Analítica (Chatbot especializado) */}
          <div className="flex-[1.5] flex flex-col min-h-[500px]">
            <div className="bg-black/40 backdrop-blur-md border border-[#D4AF37]/30 rounded-3xl p-6 flex flex-col shadow-[0_0_20px_rgba(212,175,55,0.1)] h-full">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-[#D4AF37] font-bold tracking-wider flex items-center gap-3">
                  <svg className="w-5 h-5 drop-shadow-[0_0_5px_rgba(212,175,55,0.5)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  IA PLANTA CORE
                </h2>
              </div>
              
              <p className="text-white/40 text-xs font-light mb-4 uppercase tracking-widest">
                Asistente en vivo conectado a {brandInfo.name}
              </p>

              <div className="flex-1 bg-black/60 rounded-2xl border border-white/5 p-4 flex flex-col h-full overflow-hidden relative">
                {/* Área de Mensajes del Asistente */}
                <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-2 pb-4">
                  
                  {/* Mensaje de Bienvenida */}
                  <div className="bg-white/10 text-white/90 text-sm p-4 rounded-tr-2xl rounded-bl-2xl rounded-br-2xl self-start w-11/12 border border-white/5 backdrop-blur-sm">
                    Hola. Conexión de puente TIA Portal a <b>{brandInfo.name}</b> habilitada. Estoy visualizando los parámetros actuales (45°C, Operativo). ¿Qué datos o diagnósticos deseas obtener?
                  </div>

                  {/* Futuros mensajes del usuario pueden ir aquí */}
                </div>

                {/* Caja de Input (Input para preguntar a la IA Planta) */}
                <div className="mt-auto pt-2 flex gap-2 border-t border-white/5">
                  <input 
                    type="text" 
                    placeholder={`Pregunta sobre el sistema ${brandInfo.name}...`}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#D4AF37]/50 focus:bg-white/10 transition-all font-light"
                  />
                  <button className="bg-[#D4AF37] hover:bg-[#E5C158] text-black px-4 py-3 rounded-xl transition-all hover:scale-105 shadow-[0_0_10px_rgba(212,175,55,0.4)]">
                    <svg className="w-5 h-5 mx-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                  </button>
              </div>
              </div>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}