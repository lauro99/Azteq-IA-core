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

  // Validación de administrador y usuario actual
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [connectionMode, setConnectionMode] = useState<'local' | 'cloud'>('local');
  const [mockMode, setMockMode] = useState(true);
  const [plcData, setPlcData] = useState<any>(null);
  const [selectedPlcId, setSelectedPlcId] = useState('');
  
  // Lista dinámica de PLCs desde Supabase y nuevo nombre
  const [savedPLCs, setSavedPLCs] = useState<any[]>([{ id: '', name: '-- Seleccionar Equipo Guardado --', ip: '', port: '102', rack: '0', slot: '1', is_cloud: false }]);
  const [newPlcName, setNewPlcName] = useState('');

  // Form states
  const [ipAddress, setIpAddress] = useState('');
  const [port, setPort] = useState('102'); // Default common port for PLCs like S7
  const [rack, setRack] = useState('0');
  const [slot, setSlot] = useState('1');

  const handlePlcSelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedPlcId(id);
    const config = savedPLCs.find(p => p.id === id);
    if (config && id !== '') {
      setIpAddress(config.ip);
      setPort(config.port?.toString() || '102');
      setRack(config.rack?.toString() || '0');
      setSlot(config.slot?.toString() || '1');
      setConnectionMode(config.is_cloud ? 'cloud' : 'local');
      setNewPlcName(config.name); // Para que se sepa de qué máquina hablamos
    } else {
      setIpAddress('');
      setNewPlcName('');
    }
  };

  const handleSavePlc = async () => {
    if (!newPlcName || !ipAddress || !user) return alert("Falta nombre o IP para guardar el PLC");
    
    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from('plcs')
        .insert([{
          user_id: user.id,
          name: newPlcName,
          brand: brandId,
          ip: ipAddress,
          port: parseInt(port) || 102,
          rack: parseInt(rack) || 0,
          slot: parseInt(slot) || 1,
          is_cloud: connectionMode === 'cloud'
        }])
        .select();

      if (error) throw error;
      
      alert(`Reliquia ${newPlcName} guardada con éxito en tu cuenta.`);
      
      if (data && data.length > 0) {
        setSavedPLCs(prev => [...prev, data[0]]);
        setSelectedPlcId(data[0].id);
      }
    } catch (err: any) {
      alert("Error al guardar PLC en la base de datos: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/');
      } else {
        // Validar si es admin (usuarios cuyo email empieza con adm, como adm1, adm2)
        const email = session.user?.email || '';
        setUser(session.user);
        if (email.toLowerCase().startsWith('adm')) {
          setIsAdmin(true);
        } else {
          setMockMode(false); // Ocultar y apagar simulación para usuarios mortales
        }
        
        // Obtener PLCs de este usuario desde Supabase
        const { data: userPlcs } = await supabase
          .from('plcs')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('brand', brandId)
          .order('created_at', { ascending: false });

        if (userPlcs && userPlcs.length > 0) {
          setSavedPLCs([
            { id: '', name: '-- Seleccionar Equipo Guardado --', ip: '', port: '102', rack: '0', slot: '1', is_cloud: false },
            ...userPlcs
          ]);
        }

        setLoading(false);
      }
    };
    checkSession();
  }, [router, brandId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full bg-[#D4AF37] animate-pulse"></div>
      </div>
    );
  }

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsConnecting(true);
    
    try {
      const res = await fetch('/api/plc/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand: brandId,
          ip: ipAddress,
          port,
          rack: Number(rack),
          slot: Number(slot),
          isCloud: connectionMode === 'cloud',
          mockMode
        })
      });
      const data = await res.json();
      
      if (data.success) {
        setPlcData(data.data);
        setIsConnected(true);
      } else {
        alert(data.error || 'Error conectando al PLC');
      }
    } catch (error) {
      alert('Error de red contactando al servidor');
    } finally {
      setIsConnecting(false);
    }
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
        /* PANTALLA DE CONEXIÓN AL PLC - AZTEC THEME */
        <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-4">
          
          <div 
            className="w-full max-w-md bg-[#E5DBCA]/95 backdrop-blur-xl border-[4px] border-[#69523C] p-8 flex flex-col items-center shadow-[0_15px_40px_rgba(0,0,0,0.8)] relative"
            style={{ clipPath: 'polygon(20px 0, calc(100% - 20px) 0, 100% 20px, 100% calc(100% - 20px), calc(100% - 20px) 100%, 20px 100%, 0 calc(100% - 20px), 0 20px)' }}
          >
            {/* Adornos en las esquinas interiores (Motivo Escalonado) */}
            <div className="absolute top-1 left-1 w-6 h-6 border-t-4 border-l-4 border-[#A3855B] z-10 pointer-events-none"></div>
            <div className="absolute top-1 right-1 w-6 h-6 border-t-4 border-r-4 border-[#A3855B] z-10 pointer-events-none"></div>
            <div className="absolute bottom-1 left-1 w-6 h-6 border-b-4 border-l-4 border-[#A3855B] z-10 pointer-events-none"></div>
            <div className="absolute bottom-1 right-1 w-6 h-6 border-b-4 border-r-4 border-[#A3855B] z-10 pointer-events-none"></div>

            <div className="mb-6 flex flex-col items-center text-center mt-2 relative z-10">
              <div className="w-16 h-16 bg-[#121927] border-[3px] border-[#E8C673] flex items-center justify-center mb-4 shadow-lg relative group"
                   style={{ clipPath: 'polygon(10px 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0 calc(100% - 10px), 0 10px)' }}>
                <svg className="w-8 h-8 text-[#E8C673]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>

                {/* Help Bubble Button */}
                <button 
                  type="button"
                  onClick={() => setShowHelp(!showHelp)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-[#A3855B] text-white border-2 border-[#69523C] flex items-center justify-center font-bold text-[10px] hover:scale-110 transition-transform shadow-md z-20"
                  aria-label="Ayuda para conectar"
                >
                  ?
                </button>
              </div>
              <h2 className="text-2xl font-bold text-[#312011] tracking-tight font-serif uppercase">Enlace Ritual</h2>
              <p className="text-[#4B3B2B] text-sm font-medium mt-1">
                Conectando ofrenda a <span className="font-bold">{brandInfo.name}</span>.
              </p>
            </div>

            {/* Admin Toggle (MOCK / REAL) - VISIBLE SOLO PARA ADMINS */}
            {isAdmin && (
              <div className="w-full flex items-center justify-between mb-6 px-4 py-3 bg-[#F2EADA] border-l-[4px] border-[#CBB596] shadow-inner relative z-10">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#312011] uppercase tracking-widest font-sans">Modo Visión (Simulación)</span>
                  <span className="text-[10px] text-[#69523C] font-semibold italic">Ver sin sacrificar hardware real</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={mockMode} 
                    onChange={(e) => setMockMode(e.target.checked)} 
                  />
                  <div className="w-9 h-5 bg-[#CBB596] peer-focus:outline-none peer peer-checked:after:translate-x-full peer-checked:after:border-[#312011] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#FCFAEA] after:border-[#A3855B] after:border-[2px] after:h-4 after:w-4 after:transition-all peer-checked:bg-[#A3855B] border-[2px] border-[#69523C]"></div>
                </label>
              </div>
            )}

            {/* Selector de Modo de Conexión */}
            <div className="w-full bg-[#D1C3AD]/50 p-1 border-[2px] border-[#A3855B] flex items-center mb-6 relative z-10" style={{ clipPath: 'polygon(8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px), 0 8px)' }}>
              <div 
                className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-[#121927] border-[2px] border-[#E8C673] transition-all duration-300 ease-in-out ${connectionMode === 'local' ? 'left-1' : 'left-[calc(50%+2px)]'}`}
              ></div>
              <button 
                onClick={() => setConnectionMode('local')}
                className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-widest relative z-10 transition-colors ${connectionMode === 'local' ? 'text-[#E8C673]' : 'text-[#69523C] hover:text-[#312011]'}`}
              >
                Templo Reliquia (Local)
              </button>
              <button 
                onClick={() => setConnectionMode('cloud')}
                className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-widest relative z-10 transition-colors ${connectionMode === 'cloud' ? 'text-[#E8C673]' : 'text-[#69523C] hover:text-[#312011]'}`}
              >
                Cielo Puro (VPN)
              </button>
            </div>

            {/* Quick Select Autocomplete (Mock Data) */}
            <div className="w-full mb-6 relative z-10 flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#69523C] uppercase tracking-widest px-1 font-sans">Seleccionar Reliquia / Conexión Nueva</label>
              <div className="relative">
                <select 
                  value={selectedPlcId}
                  onChange={handlePlcSelection}
                  className="w-full bg-[#F2EADA] border-[3px] border-[#A3855B]/80 px-4 py-3 text-[#312011] focus:outline-none focus:border-[#69523C] transition-all font-sans font-bold appearance-none cursor-pointer"
                  style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
                >
                  {savedPLCs.map(plc => (
                    <option key={plc.id} value={plc.id}>
                      {plc.name === '-- Seleccionar Equipo Guardado --' 
                        ? '-- Crear Nueva Conexión --' 
                        : plc.name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-[#69523C]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>

            {/* Tooltip / Modal de Ayuda */}
            {showHelp && (
              <div className="mb-6 bg-[#F2EADA] border-[3px] border-[#CBB596] p-5 text-left animate-in fade-in slide-in-from-top-4 relative z-20 shadow-md" style={{ clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)' }}>
                <button 
                  onClick={() => setShowHelp(false)}
                  className="absolute top-2 right-2 text-[#A3855B] hover:text-[#69523C]"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <h3 className="text-[#312011] font-bold text-sm mb-3 flex items-center gap-2 font-serif uppercase">
                  <span className="text-[#A3855B]">❂</span> Sendas de Conexión
                </h3>
                <div className="text-[#4B3B2B] text-xs font-medium space-y-3 leading-relaxed">
                  <p><strong className="text-[#312011]">Templo Reliquia:</strong> La ofrenda (equipo Azteq-IA) se hace en el mismo suelo sagrado (LAN) que el {brandInfo.name}.</p>
                  <p><strong className="text-[#312011]">Cielo Puro:</strong> La comunicación viaja por los vientos a través de un túnel místico (VPN) que proveen los guardianes de red.</p>
                </div>
              </div>
            )}

            <form onSubmit={handleConnect} className="w-full flex flex-col gap-4">

              {connectionMode === 'cloud' && (
                <div className="bg-[#D1C3AD] border-[2px] border-[#A3855B] p-3 flex items-start gap-3 relative z-10" style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}>
                  <svg className="w-5 h-5 text-[#69523C] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <p className="text-xs text-[#312011] font-medium leading-relaxed">
                    <strong>Túnel de Vientos:</strong> La IP debe pertenecer al túnel cifrado (VPN), no a la aldea local (LAN) de la fábrica.
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-1.5 relative z-10">
                <label className="text-xs font-bold text-[#69523C] uppercase tracking-widest px-1 font-sans">
                  {connectionMode === 'local' ? 'IP de Ofrenda (LAN)' : 'IP de Túnel (VPN)'}
                </label>
                <input 
                  type="text" 
                  value={ipAddress}
                  onChange={(e) => setIpAddress(e.target.value)}
                  placeholder="ej. 192.168.0.1"
                  required
                  className="w-full bg-[#F2EADA] border-[3px] border-[#A3855B]/80 px-4 py-3 text-[#312011] placeholder-[#A3855B]/50 focus:outline-none focus:border-[#69523C] transition-all font-mono shadow-inner font-bold"
                  style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
                />
              </div>

              <div className="flex flex-col gap-1.5 relative z-10">
                <label className="text-xs font-bold text-[#69523C] uppercase tracking-widest px-1 font-sans">Puerta de Acceso (Puerto)</label>
                <input 
                  type="text" 
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  placeholder="ej. 102"
                  className="w-full bg-[#F2EADA] border-[3px] border-[#A3855B]/80 px-4 py-3 text-[#312011] placeholder-[#A3855B]/50 focus:outline-none focus:border-[#69523C] transition-all font-mono shadow-inner font-bold"
                  style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
                />
              </div>

              {brandId === 'siemens' && (
                <div className="grid grid-cols-2 gap-4 relative z-10">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-[#69523C] uppercase tracking-widest px-1 font-sans">Nivel (Rack)</label>
                    <input 
                      type="number" 
                      value={rack}
                      onChange={(e) => setRack(e.target.value)}
                      className="w-full bg-[#F2EADA] border-[3px] border-[#A3855B]/80 px-4 py-3 text-[#312011] focus:outline-none focus:border-[#69523C] transition-all font-mono shadow-inner font-bold"
                      style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }} 
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-[#69523C] uppercase tracking-widest px-1 font-sans">Piedra (Slot)</label>
                    <input 
                      type="number" 
                      value={slot}
                      onChange={(e) => setSlot(e.target.value)}
                      className="w-full bg-[#F2EADA] border-[3px] border-[#A3855B]/80 px-4 py-3 text-[#312011] focus:outline-none focus:border-[#69523C] transition-all font-mono shadow-inner font-bold"
                      style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }} 
                    />
                  </div>
                </div>
              )}

              <button 
                type="submit" 
                disabled={isConnecting}
                className="group relative bg-[#121927] text-[#E8C673] font-bold tracking-[0.2em] px-8 md:px-10 py-[16px] uppercase hover:bg-[#1A2624] hover:text-[#FBE7A1] transition-all disabled:opacity-50 disabled:cursor-not-allowed font-sans text-[14px] border-b-[4px] border-r-[4px] border-[#E8C673]/50 hover:border-[#E8C673] mt-4 flex items-center justify-center gap-3 z-10"  
                style={{ clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))' }}
              >
                {isConnecting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-[#E8C673]/20 border-t-[#E8C673] rounded-full animate-spin"></div>
                    INVOCANDO...
                  </>
                ) : (
                  <>
                    REALIZAR ENLACE
                    <svg className="w-5 h-5 text-[#E8C673]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  </>
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#E8C673] to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-sm"></div>
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
              
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <h2 className="text-white font-bold tracking-wider flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]"></div>
                  MONITOREO EN TIEMPO REAL
                </h2>
                
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-white/40">{ipAddress}:{port}</span>
                  {!selectedPlcId && (
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-1">
                      <input 
                        type="text"
                        placeholder="Nombre para guardar..."
                        value={newPlcName}
                        onChange={(e) => setNewPlcName(e.target.value)}
                        className="bg-transparent text-xs text-white px-2 focus:outline-none w-36 placeholder-white/30"
                      />
                      <button 
                        onClick={handleSavePlc}
                        disabled={isSaving || !newPlcName.trim()}
                        className="bg-[#D4AF37] hover:bg-[#E5C158] disabled:bg-gray-600 disabled:text-gray-400 text-black text-[10px] font-bold px-3 py-1.5 rounded transition-colors tracking-widest"
                      >
                         {isSaving ? '...' : 'GUARDAR'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {/* Cuadro de Sensor 1 */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center hover:bg-white/10 transition-colors">
                <span className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-2">Temperatura CPU</span>
                <span className="text-3xl font-black text-white">{plcData?.temperaturaCpu ?? '--'}<span className="text-lg text-white/40">°C</span></span>
              </div>
              {/* Cuadro de Sensor 2 */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center hover:bg-white/10 transition-colors">
                <span className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-2">Presión Sistema</span>
                <span className="text-3xl font-black text-white">{plcData?.presionSistema ?? '--'}<span className="text-lg text-white/40">bar</span></span>
              </div>
              {/* Cuadro de Sensor 3 */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center hover:bg-white/10 transition-colors">
                <span className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-2">Estatus General</span>
                <span className={`text-lg font-black mt-2 shadow-sm drop-shadow-lg ${plcData?.estatusGeneral === 'OPERATIVO' ? 'text-green-400' : 'text-red-400'}`}>
                  {plcData?.estatusGeneral ?? '--'}
                </span>
              </div>
              {/* Cuadro de Sensor 4 */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center hover:bg-white/10 transition-colors">
                <span className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-2">Ciclos / Hora</span>
                <span className="text-3xl font-black text-white">{plcData?.ciclosPorHora?.toLocaleString() ?? '--'}</span>
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
                    Hola. Conexión de puente a <b>{brandInfo.name}</b> habilitada. Estoy visualizando los parámetros actuales ({plcData?.temperaturaCpu}°C, {plcData?.estatusGeneral}). ¿Qué datos o diagnósticos deseas obtener?
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