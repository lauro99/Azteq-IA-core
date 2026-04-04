'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import LanguageSelector from '@/components/LanguageSelector';

export default function PlantDashboard() {
  const router = useRouter();
  const [liveData, setLiveData] = useState<Record<string, any>>({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userPLCs, setUserPLCs] = useState<any[]>([]); // Lista real traída de Supabase

  // Verificación de Sesión, Rol y Obtención de Reliquias Reales
  useEffect(() => {
    const fetchSessionAndData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/');
        return;
      }
      
      const email = session.user?.email || '';
      const isUserAdmin = email.toLowerCase().startsWith('adm');
      setIsAdmin(isUserAdmin);

      // Consultar PLCs almacenados por el usuario
      const { data: plcs } = await supabase
        .from('plcs')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (plcs) {
        // Inicializamos estatus en "online" de forma predeterminada para ver la maqueta
        // En el futuro, aquí se hará ping real a las máquinas
        setUserPLCs(plcs.map(plc => ({ ...plc, status: 'online' })));
      }
      
      setLoading(false);
    };
    fetchSessionAndData();
  }, [router]);

  // Simulación de datos en tiempo real o fetch real para las máquinas traídas
  useEffect(() => {
    if (userPLCs.length === 0) return;

    let isMounted = true;

    const fetchData = async () => {
      const newData: Record<string, any> = {};
      
      const promises = userPLCs.map(async (plc) => {
        // Obtenemos los valores a través de la misma API que en las vistas individuales, 
        // pasamos mockMode: true para no romper en caso de no tener PLC conectado físicamente,
        // pero usaremos el mapeo real de io_config.
        try {
          const res = await fetch('/api/plc/connect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              brand: plc.brand,
              ip: plc.ip,
              port: plc.port?.toString() || '102',
              rack: Number(plc.rack) || 0,
              slot: Number(plc.slot) || 1,
              isCloud: plc.is_cloud,
              mockMode: true, // Forzamos simulación visual en el dashboard por ahora
              ioTags: plc.io_config || []
            })
          });
          const data = await res.json();
          if (data.success) {
            newData[plc.id] = data.data;
          }
        } catch (error) {
          console.error('Polling error:', error);
        }
      });

      await Promise.all(promises);

      if (isMounted) {
        setLiveData(prev => ({ ...prev, ...newData }));
      }
    };

    fetchData(); // Obtener el primer set de datos Inmediatamente
    const interval = setInterval(fetchData, 2000); // 2 segundos

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [userPLCs]); // Se depende de que ya estén cargados los PLCs desde Supabase para iniciar

  const displayPLCs = userPLCs; // Ahora ya TODOS (Admin o no) ven las reliquias guardadas, pero las verdaderas obtenidas desde su cuenta


  // Real PLC errors/alerts from Supabase
  const [recentErrors, setRecentErrors] = useState<any[]>([]);

  useEffect(() => {
    const fetchErrors = async () => {
      const { data, error } = await supabase
        .from('plc_errors')
        .select('*')
        .order('time', { ascending: false })
        .gte('time', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // Últimos 7 días
      if (!error && data) setRecentErrors(data);
    };
    fetchErrors();
    const interval = setInterval(fetchErrors, 5000); // Refresca cada 5s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full bg-[#E8C673] animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col relative bg-[#111]">
      {/* Fondo Texturizado Azteca */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1501504905252-473c47e087f8?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-15 pointer-events-none z-0 mix-blend-luminosity sepia grayscale-0"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/90 to-black/60 pointer-events-none z-0"></div>

      {/* Header Fijo */}
      <header className="relative z-20 p-4 sm:p-6 flex justify-between items-center border-b border-white/10 bg-black/40 backdrop-blur-md">
        <button 
          onClick={() => router.push('/planta')}
          className="text-white/70 hover:text-white flex items-center gap-2 text-sm font-semibold transition-colors"
        >
          <span>← Volver a Marcas</span>
        </button>
        <div className="flex items-center gap-4">
          <LanguageSelector />
          <div className="h-6 w-px bg-white/20"></div>
          <span className="font-bold text-sm tracking-widest uppercase text-[#E8C673]">
            Visión del Imperio
          </span>
        </div>
      </header>

      <main className="relative z-10 flex-1 p-6 md:p-10 mx-auto w-full max-w-7xl">
        <div className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#E8C673] tracking-widest font-serif uppercase flex items-center gap-3">
              <span className="text-[#A3855B]">❂</span> Visión Global
            </h1>
            <p className="text-white/50 mt-2 font-medium tracking-wide uppercase text-xs">
              Monitoreo panóptico de reliquias y nodos sincronizados en tiempo real
            </p>
          </div>
        </div>

        {/* Rejilla de Tarjetas (Cards) de las Máquinas */}
        {displayPLCs.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 mt-10 border-[2px] border-dashed border-[#69523C] bg-black/40 backdrop-blur-sm"
               style={{ clipPath: 'polygon(15px 0, calc(100% - 15px) 0, 100% 15px, 100% calc(100% - 15px), calc(100% - 15px) 100%, 15px 100%, 0 calc(100% - 15px), 0 15px)' }}>
            <span className="text-4xl mb-4">⚠️</span>
            <h2 className="text-[#E8C673] font-serif uppercase tracking-widest text-lg font-bold">Sin Reliquias Conectadas</h2>
            <p className="text-[#CBB596] text-sm mt-2 font-medium text-center">Todavía no hay conexiones físicas con equipos industriales.<br/>Solo los usuarios administradores pueden visualizar la maqueta de simulación.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayPLCs.map((plc) => {
              const data = liveData[plc.id];
              const isOnline = plc.status === 'online';

            return (
              <div key={plc.id} className="relative group">
                <div 
                  className={`w-full h-full bg-[#E5DBCA]/95 backdrop-blur-md border-[3px] ${isOnline ? 'border-[#69523C]' : 'border-red-900/40 bg-red-950/20 text-white/50'} p-6 flex flex-col shadow-[0_15px_30px_rgba(0,0,0,0.6)] transition-all duration-500 hover:-translate-y-2`}
                  style={{ clipPath: 'polygon(15px 0, calc(100% - 15px) 0, 100% 15px, 100% calc(100% - 15px), calc(100% - 15px) 100%, 15px 100%, 0 calc(100% - 15px), 0 15px)' }}
                >
                  {/* Adornos Modulares Esquinas */}
                  <div className="absolute top-1 left-1 w-4 h-4 border-t-[3px] border-l-[3px] border-[#A3855B] z-10 pointer-events-none"></div>
                  <div className="absolute top-1 right-1 w-4 h-4 border-t-[3px] border-r-[3px] border-[#A3855B] z-10 pointer-events-none"></div>
                  <div className="absolute bottom-1 left-1 w-4 h-4 border-b-[3px] border-l-[3px] border-[#A3855B] z-10 pointer-events-none"></div>
                  <div className="absolute bottom-1 right-1 w-4 h-4 border-b-[3px] border-r-[3px] border-[#A3855B] z-10 pointer-events-none"></div>

                  <div className="flex justify-between items-start mb-4">
                    <div className="pr-4">
                      <h3 className={`font-bold font-serif uppercase tracking-wider text-lg leading-tight ${isOnline ? 'text-[#312011]' : 'text-red-400 opacity-70'}`}>
                        {plc.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-[#FCFAEA] ${isOnline ? 'bg-[#A3855B]' : 'bg-red-900'}`}>
                          {plc.brand}
                        </span>
                        <p className="text-xs font-mono font-bold text-[#69523C]">{plc.ip}</p>
                      </div>
                    </div>
                    {/* Foco Titilante Verde/Rojo */}
                    <div className={`w-4 h-4 rounded-full mt-1 shrink-0 ${isOnline ? 'bg-green-500 shadow-[0_0_12px_#22c55e] animate-pulse' : 'bg-red-600 shadow-[0_0_12px_#dc2626]'}`}></div>
                  </div>

                  {isOnline && data ? (
                    <div className="grid grid-cols-2 gap-4 mt-2 mb-6">
                      {!plc.io_config || plc.io_config.length === 0 ? (
                        <div className="col-span-2 flex items-center justify-center p-3 text-[#CBB596] text-[10px] tracking-widest uppercase font-bold border-2 border-dashed border-[#69523C]/50 opacity-80 h-[80px]">
                          Sin Variables Configuradas
                        </div>
                      ) : (
                        plc.io_config.slice(0, 4).map((tag: any) => {
                          const val = data[tag.name];
                          const isBool = typeof val === 'boolean' || tag.type === 'Bool';
                          const displayVal = isBool ? (val ? 'ON' : 'OFF') : (typeof val === 'number' ? val.toFixed(1) : String(val ?? 0));
                          
                          return (
                            <div key={tag.name} className="bg-[#F2EADA] border-[2px] border-[#CBB596] p-3 shadow-inner flex flex-col items-center justify-center text-center overflow-hidden">
                              <span className="text-[10px] uppercase font-bold text-[#69523C] mb-1 tracking-widest truncate w-full">{tag.name}</span>
                              <span className={`text-xl font-black ${isBool ? (val ? 'text-green-700' : 'text-gray-500') : 'text-[#312011]'}`}>
                                {displayVal}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-[90px] mt-2 mb-6 bg-black/60 border-[2px] border-red-900/50 shadow-inner">
                        <div className="flex flex-col items-center">
                          <svg className="w-6 h-6 text-red-500 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                          <span className="text-red-500 font-bold uppercase tracking-widest text-[10px]">Pérdida de Enlace</span>
                        </div>
                    </div>
                  )}

                  <button 
                    onClick={() => router.push(`/planta/${plc.brand}?id=${plc.id}`)}
                    className={`mt-auto w-full py-3 font-bold text-[12px] uppercase tracking-[0.2em] transition-all border-b-[4px] border-r-[4px] shadow-sm relative overflow-hidden group/btn
                      ${isOnline 
                        ? 'bg-[#121927] text-[#E8C673] border-[#E8C673]/60 hover:bg-[#1A2624] hover:text-[#FBE7A1] hover:border-[#E8C673]' 
                        : 'bg-red-950/80 text-red-400 border-red-900 cursor-not-allowed opacity-80 hover:bg-red-950 hover:text-red-300'}`}
                    style={{ clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))' }}
                    disabled={!isOnline}
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                       {isOnline ? 'Intervenir' : 'Ofrenda Caída'}
                       {isOnline && <svg className="w-4 h-4 translate-y-[-1px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                    </span>
                    {isOnline && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#E8C673] to-transparent opacity-0 group-hover/btn:opacity-20 transition-opacity duration-500 blur-sm z-0"></div>}
                  </button>

                </div>
              </div>
            );
          })}
        </div>
        )}
      {/* --- REGISTRO DE ALERTAS Y ANOMALÍAS --- */}
      <section className="mt-16">
        <div
          className="border border-[#E8C673]/30 bg-[#1A2624]/60 rounded-xl shadow-lg overflow-hidden"
          style={{
            clipPath:
              'polygon(20px 0, calc(100% - 20px) 0, 100% 20px, 100% calc(100% - 20px), calc(100% - 20px) 100%, 20px 100%, 0 calc(100% - 20px), 0 20px)'
          }}
        >
          <div className="px-6 py-4 border-b border-[#E8C673]/20 bg-black/30 flex items-center gap-3">
            <svg className="w-6 h-6 text-[#E8C673]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <h2 className="text-lg md:text-xl font-bold font-serif uppercase tracking-widest text-[#E8C673]">Registro de Alertas y Anomalías</h2>
          </div>
          {isAdmin && (
            <div className="flex justify-end px-6 py-2 bg-black/20">
              <button
                onClick={async () => {
                  if (confirm('¿Seguro que deseas borrar todos los errores? Esta acción no se puede deshacer.')) {
                    await supabase.from('plc_errors').delete().neq('id', 0);
                    // Refresca la lista de errores
                    const { data, error } = await supabase
                      .from('plc_errors')
                      .select('*')
                      .order('time', { ascending: false })
                      .gte('time', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
                    if (!error && data) setRecentErrors(data);
                  }
                }}
                className="bg-red-700 hover:bg-red-800 text-white font-bold px-4 py-2 rounded shadow transition-all"
              >
                Borrar todos los errores
              </button>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-[#1A2624] text-[#E8C673] uppercase text-xs border-b border-[#E8C673]/20">
                <tr>
                  <th className="py-3 px-4 font-bold">Hora</th>
                  <th className="py-3 px-4 font-bold">Equipo/Nodo</th>
                  <th className="py-3 px-4 font-bold">Código</th>
                  <th className="py-3 px-4 font-bold">Descripción</th>
                  <th className="py-3 px-4 font-bold">Severidad</th>
                </tr>
              </thead>
              <tbody>
                {recentErrors.map((err) => {
                  let sevColor = '';
                  if (!err.resolved && err.severity === 'Crítico') sevColor = 'text-red-400 border-l-4 border-red-400 bg-red-950/10';
                  else if (!err.resolved && err.severity === 'Advertencia') sevColor = 'text-yellow-400 border-l-4 border-yellow-400 bg-yellow-900/10';
                  else if (err.resolved) sevColor = 'text-green-400 border-l-4 border-green-400 bg-green-900/10';
                  else sevColor = 'text-white';
                  return (
                    <tr key={err.id} className={`transition-colors duration-200 ${sevColor}`}>
                      <td className="py-2 px-4 whitespace-nowrap font-mono">{new Date(err.time).toLocaleString()}</td>
                      <td className="py-2 px-4 whitespace-nowrap">{err.equip}</td>
                      <td className="py-2 px-4 font-bold">{err.code}</td>
                      <td className="py-2 px-4">{err.desc}</td>
                      <td className="py-2 px-4 font-bold uppercase">{err.resolved ? 'Resuelto' : err.severity}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

    </main>
  </div>
  );
}
