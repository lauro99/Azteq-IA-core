'use client';
import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import LanguageSelector from '@/components/LanguageSelector';
import { useLanguage } from '@/components/LanguageContext';
import RestrictedAccess from '@/components/RestrictedAccess';

const brandData: Record<string, {name: string, color: string}> = {
  siemens: { name: 'Siemens', color: 'text-teal-400' },
  allenbradley: { name: 'Allen-Bradley', color: 'text-blue-400' },
  delta: { name: 'Delta', color: 'text-cyan-400' },
  keyence: { name: 'Keyence', color: 'text-slate-300' },
  mitsubishi: { name: 'Mitsubishi', color: 'text-red-400' },
  fanuc: { name: 'Fanuc', color: 'text-yellow-400' }
};

function PlcDashboardContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const autoConnectId = searchParams?.get('id');
  
  // Extraemos el nombre de la marca desde la URL (dinámicamente)
  const brandId = (params?.brand as string) || 'desconocido';
  const brandInfo = brandData[brandId] || { name: brandId.toUpperCase(), color: 'text-[#D4AF37]' };
  const { t } = useLanguage();

  // Validación de administrador y usuario actual
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isLocked, setIsLocked] = useState(false);

  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [connectionMode, setConnectionMode] = useState<'local' | 'cloud'>('local');
  const [plcData, setPlcData] = useState<any>(null);
  const [plcWarning, setPlcWarning] = useState<string | null>(null);
  const [selectedPlcId, setSelectedPlcId] = useState('');
  const [chatMessages, setChatMessages] = useState<{role: 'user'|'ai', content: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'|'info'} | null>(null);
  
  // Lista dinámica de PLCs desde Supabase y nuevo nombre
  const [savedPLCs, setSavedPLCs] = useState<any[]>([{ id: '', name: '-- Seleccionar Equipo Guardado --', ip: '', port: '102', rack: '0', slot: '1', is_cloud: false }]);
  const [newPlcName, setNewPlcName] = useState('');
  const [plcModel, setPlcModel] = useState(brandId === 'siemens' ? 's7-1200' : 'standard');

  // Configuración de E/S
  const [showConfigurator, setShowConfigurator] = useState(false);
  const [showMapperHelp, setShowMapperHelp] = useState(false);
  const [ioTags, setIoTags] = useState<{id: string, group?: string, name: string, address: string, type: string, unit?: string}[]>([]);
  const [newTag, setNewTag] = useState({ group: '', name: '', address: '', type: 'Bool', unit: '' });

  // Form states
  const [ipAddress, setIpAddress] = useState('');
  const [port, setPort] = useState('102'); // Default common port for PLCs like S7
  const [rack, setRack] = useState('0');
  const [slot, setSlot] = useState(brandId === 'siemens' ? '0' : '1');

  const showToast = (msg: string, type: 'success'|'error'|'info' = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/');
        return;
      }
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('plan, support_validated')
        .eq('id', session.user.id)
        .single();
        
      if (profile?.plan === 'free') {
        router.push('/planes');
        return;
      }

      setUser({ ...session.user, plan: profile?.plan });

      if (profile?.support_validated === false) {
        setIsLocked(true);
        return;
      }
    };
    checkUser();
  }, [router]);

  useEffect(() => {
    if (brandId === 'siemens') {
      if (plcModel === 's7-1200' || plcModel === 's7-1500' || plcModel === 'logo') {
        setSlot('0');
      } else if (plcModel === 's7-300') {
        setSlot('2');
      }
    }
  }, [brandId, plcModel]);

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
      setNewPlcName(config.name);
        setIoTags(config.io_config || []);
    } else {
      setIpAddress('');
      setNewPlcName('');
        setIoTags([]);
      }
  };

  // Inicial tag states for new PLC
  const [initTagName, setInitTagName] = useState('Inicio_Ciclo');
  const [initTagAddress, setInitTagAddress] = useState('M0.0');

  const handleSavePlc = async () => {
    if (!newPlcName || !ipAddress || !user) {
      showToast("Falta nombre o IP para guardar el PLC", "error");
      return;
    }
    
    setIsSaving(true);
    try {
      const initialTags = [{ 
        id: crypto.randomUUID(), 
        group: 'General', 
        name: initTagName || 'Variable_1', 
        address: initTagAddress || 'M0.0', 
        type: 'Bool', 
        unit: '' 
      }];

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
          is_cloud: connectionMode === 'cloud',
          io_config: initialTags
        }])
        .select();

      if (error) throw error;
      
      showToast(`${newPlcName} guardado con éxito`, "success");
      
      if (data && (data as any).length > 0) {
        setSavedPLCs(prev => [...prev, (data as any)[0]]);
        setSelectedPlcId((data as any)[0].id);
        setIoTags(initialTags);
      }
    } catch (err: any) {
      showToast("Error al guardar: " + err.message, "error");
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
        }
        
        // Obtener PLCs de este usuario desde Supabase
        const { data: userPlcs } = await supabase
          .from('plcs')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('brand', brandId)
          .order('created_at', { ascending: false });

        if (userPlcs && userPlcs.length > 0) {
          const loadedPLCs = [
            { id: '', name: '-- Seleccionar Equipo Guardado --', ip: '', port: '102', rack: '0', slot: '1', is_cloud: false },
            ...userPlcs
          ];
          setSavedPLCs(loadedPLCs);

          // Si venimos con un ID desde el dashboard, autoseleccionamos y autoconectamos
          if (autoConnectId) {
            const config = userPlcs.find((p: any) => p.id === autoConnectId);
            if (config) {
              setSelectedPlcId(config.id);
              setIpAddress(config.ip);
              setPort(config.port?.toString() || '102');
              setRack(config.rack?.toString() || '0');
              setSlot(config.slot?.toString() || '1');
              setConnectionMode(config.is_cloud ? 'cloud' : 'local');
              setConnectionMode(config.is_cloud ? 'cloud' : 'local');
              setNewPlcName(config.name);
              setIoTags(config.io_config || []);
              
              // Iniciar conexión automática
              setIsConnecting(true);
              try {
                if (config.is_cloud) {
                  // MODO NUBE: Leer directamente de Supabase en lugar de intentar conectar por IP local
                  const { data, error } = await supabase.from('plc_realtime').select('*').eq('plc_id', config.id).single();
                  
                  if (error || !data) {
                    showToast('No se encontraron métricas en vivo en la nube.', 'error');
                  } else {
                    setPlcData({ ...data.data, estatusGeneral: data.estatusgeneral });
                    setPlcWarning(null);
                    setIsConnected(true);
                  }
                } else {
                  // MODO LOCAL
                  const res = await fetch('/api/plc/connect', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      brand: brandId,
                      ip: config.ip,
                      port: config.port?.toString() || '102',
                      rack: Number(config.rack) || 0,
                      slot: Number(brandId === 'siemens' ? '0' : (config.slot || '1')),
                      isCloud: config.is_cloud,
                      connectOnly: !(config.io_config && config.io_config.length > 0),
                      ioTags: config.io_config || []
                    })
                  });
                  const data = await res.json();
                  if (data.success) {
                    setPlcData(data.data);
                    setPlcWarning(data.warning || null);
                    setIsConnected(true);
                  } else {
                    showToast(data.error || 'Error conectando al PLC', 'error');
                  }
                }
              } catch (error) {
                showToast('Error de red contactando al servidor', 'error');
              } finally {
                setIsConnecting(false);
              }
            }
          }
        }

        setLoading(false);
      }
    };
    checkSession();
  }, [router, brandId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let isFetching = false;
    let channel: any;

    if (isConnected) {
      if (connectionMode === 'cloud') {
        // --- ☁️ MODO NUBE (VERCEL) CON SUPABASE REALTIME ---
        const plcTargetId = selectedPlcId || 'bb34bcc6-9cd7-47f6-935e-eae22cba04e1'; 

        // Obtener estado inicial (para no esperar a que cambie)
        const fetchInitial = async () => {
          const { data } = await supabase.from('plc_realtime').select('*').eq('plc_id', plcTargetId).single();
          if (data) {
            setPlcData({ ...data.data, estatusGeneral: data.estatusgeneral });
          }
        };
        fetchInitial();

        // 🔄 Polling a la BD de Supabase cada 2 segundos en lugar de WebSockets dependientes
        interval = setInterval(async () => {
          if (isFetching) return;
          isFetching = true;
          try {
            const { data } = await supabase.from('plc_realtime').select('*').eq('plc_id', plcTargetId).single();
            if (data) {
              setPlcData({ ...data.data, estatusGeneral: data.estatusgeneral });
            }
          } catch (e) {
            console.error('Error en polling de Supabase:', e);
          } finally {
            isFetching = false;
          }
        }, 2000);

      } else {
        // --- 🏭 MODO LOCAL ORIGINAL (Cable directo / Polling) ---
        interval = setInterval(async () => {
          if (isFetching) return;
          isFetching = true;
          try {
            const res = await fetch('/api/plc/connect', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                brand: brandId,
                ip: ipAddress,
                port,
                rack: Number(rack),
                slot: Number(brandId === 'siemens' && ['s7-1200','s7-1500','logo'].includes(plcModel) ? '0' : slot),
                isCloud: (connectionMode as string) === 'cloud',
                connectOnly: ioTags.length === 0,
                ioTags
              })
            });
            const data = await res.json();
            if (data.success) {
              setPlcData(data.data);
              setPlcWarning(data.warning || null);
            } else {
              console.error('Polling error:', data.error);
            }
          } catch (error) {
            console.error('Polling network error:', error);
          } finally {
            isFetching = false;
          }
        }, 3000); // 3 segundos
      }
    }
    
    return () => {
      if (interval) clearInterval(interval);
      if (channel) supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, brandId, ipAddress, port, rack, slot, connectionMode, ioTags, selectedPlcId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isConnected) {
      interval = setInterval(async () => {
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
              ioTags
            })
          });
          const data = await res.json();
          if (data.success) {
            setPlcData(data.data);
          } else {
            console.error('Polling error:', data.error);
          }
        } catch (error) {
          console.error('Polling network error:', error);
        }
      }, 2000); // 2 segundos (refresco en tiempo real)
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isConnected, brandId, ipAddress, port, rack, slot, connectionMode, ioTags]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full bg-[#D4AF37] animate-pulse"></div>
      </div>
    );
  }

  if (isLocked) {
    return <RestrictedAccess userEmail={user?.email} userPlan={user?.plan} />;
  }

  const handleChatSend = async () => {
    const trimmed = chatInput.trim();
    if (!trimmed || chatLoading) return;

    // Inject current PLC live data as context
    let contextPrefix = '';
    if (plcData) {
      const vars = plcData.variables || plcData;
      contextPrefix = '[Contexto en tiempo real del PLC ' + brandInfo.name + ': ' + JSON.stringify(vars) + '] ';
    }

    const userMsg = trimmed;
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: contextPrefix + userMsg,
          userEmail: user?.email || ''
        })
      });
      const data = await res.json();
      if (data.reply) {
        setChatMessages(prev => [...prev, { role: 'ai', content: data.reply }]);
      } else {
        setChatMessages(prev => [...prev, { role: 'ai', content: data.error || 'Error al obtener respuesta.' }]);
      }
    } catch {
      setChatMessages(prev => [...prev, { role: 'ai', content: 'Error de conexión con la IA.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsConnecting(true);
    
    // Si es una nueva conexión en modo nube, forzamos a guadar primero para tener un ID válido
    if (connectionMode === 'cloud' && !selectedPlcId) {
      showToast('Por favor, guarda la conexión antes de enlazar en modo nube.', 'error');
      setIsConnecting(false);
      return;
    }
    
    try {
      if (connectionMode === 'cloud') {
        const plcTargetId = selectedPlcId || 'bb34bcc6-9cd7-47f6-935e-eae22cba04e1'; // Fallback a tu id de .env.local

        // Comprobar si existe el dato en la nube antes de autorizar el cambio de pantalla
        const { data, error } = await supabase.from('plc_realtime').select('*').eq('plc_id', plcTargetId).single();

        if (error || !data) {
           showToast('No se encontraron métricas en vivo (Asegúrate de que el Gateway esté encendido en planta).', 'error');
           setIsConnecting(false);
           return;
        }

        // Si conecta exitosamente, configuramos el estado
        setPlcData({ ...data.data, estatusGeneral: data.estatusgeneral });
        setPlcWarning(null);
        setIsConnected(true);

      } else {
        // --- 🏭 MODO LOCAL (Cable directo) ---
        const res = await fetch('/api/plc/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            brand: brandId,
            ip: ipAddress,
            port,
            rack: Number(rack),
            slot: Number(brandId === 'siemens' && ['s7-1200','s7-1500','logo'].includes(plcModel) ? '0' : slot),
            isCloud: (connectionMode as string) === 'cloud',
            connectOnly: ioTags.length === 0,
            ioTags
          })
        });
        const data = await res.json();
        
        if (data.success) {
          setPlcData(data.data);
          setPlcWarning(data.warning || null);
          setIsConnected(true);
        } else {
          showToast(data.error || 'Error conectando al PLC', 'error');
        }
      }
    } catch (error) {
      showToast('Error de red contactando al servidor o base de datos', 'error');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col relative bg-[#111]">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1565514020179-026b92b84bb6?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10 pointer-events-none z-0 mix-blend-luminosity grayscale"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/90 to-black/60 pointer-events-none z-0"></div>
      {/* Modal del Configurador de E/S */}
      {showConfigurator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#121927] border-[3px] border-[#E8C673] w-full max-w-5xl text-[#FCFAEA] relative flex flex-col max-h-[90vh] shadow-[0_0_30px_rgba(232,198,115,0.2)]" style={{ clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)' }}>
            <div className="p-6 border-b border-[#E8C673]/30 flex justify-between items-center bg-[#1A2624]">
              <div className="flex items-center gap-4">
                <h3 className="text-lg font-bold text-[#E8C673] tracking-widest font-serif flex items-center gap-2 uppercase">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {t.plVarMapper}
                </h3>
                <button 
                  onClick={() => setShowMapperHelp(!showMapperHelp)} 
                  className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border transition-all ${showMapperHelp ? 'bg-[#E8C673] text-black border-[#E8C673]' : 'bg-transparent text-[#CBB596] border-[#CBB596] hover:bg-[#E8C673]/20'}`}
                >
                  {showMapperHelp ? t.plHideHelp : t.plHowItWorks}
                </button>
              </div>
              <button onClick={() => setShowConfigurator(false)} className="text-[#CBB596] hover:text-red-400 transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-4">
              {/* Panel de Ayuda (Condicional) */}
              {showMapperHelp && (
                <div className="bg-[#E8C673]/10 border-l-4 border-[#E8C673] p-4 text-sm text-[#FCFAEA] font-light mb-2">
                  <h4 className="font-bold text-[#E8C673] text-base mb-2">Instrucciones Básicas para Universitarios de Mantenimiento</h4>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Área del Equipo:</strong> Imagina que es la carpeta donde guardarás la variable. Ejemplos: <em>"Banda Transportadora"</em>, <em>"Horno 1"</em> u <em>"Organizador"</em>.</li>
                    <li><strong>¿Qué estamos leyendo?:</strong> Pon el nombre específico de lo que detecta el sensor. <strong>Regla de oro: No uses espacios</strong> (usa guiones bajos `_`). Ejemplo: <em>Temperatura_Agua</em>.</li>
                    <li><strong>Dirección del PLC:</strong> Aquí pones la ubicación exacta en el autómata. Si tienes dudas, revisa el manual del fabricante.
                      <ul className="pl-4 mt-1 text-gray-400 text-xs list-[circle]">
                        <li><strong className="text-white">Siemens:</strong> Marcas (ej. M0.0), Entradas/Salidas (ej. I0.0 / Q0.1) o Data Blocks (ej. DB1,X0.0). <br/><em>💡 Tip Contadores: </em> Engancha la salida "CV" del contador a una Memoria (ej. MW10) y escribe aquí "MW10" con tipo "Entero".</li>
                        <li><strong className="text-white">Allen-Bradley:</strong> El nombre de la etiqueta (Tag) directo (ej. Motor_Activo).</li>
                        <li><strong className="text-white">Modbus (Delta/Keyence):</strong> Usa los registros clásicos (ej. 40001, 40002).</li>
                      </ul>
                    </li>
                      <li><strong>Tipo de Dato y Unidad:</strong> Selecciona si es una simple alerta visual encendido/apagado (<strong>Sí/No</strong>), si tiene punto decimal (<strong>Decimales</strong>) o son números redondos (<strong>Enteros</strong>). Escribe la unidad de medida según corresponda (ej. "°C", "PSI", "kg", "RPM"). Para tipos <strong>Sí/No (Bool)</strong>, puedes dejar la unidad en blanco o usar textos descriptivos como "(ON/OFF)", "Activo/Inactivo" o "Abierto".</li>
                  </ul>
                </div>
              )}

              {/* Formulario de nueva variable */}
              <div className="bg-black/40 border border-[#E8C673]/30 p-4 relative" style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}>
                <h4 className="text-[#CBB596] text-xs font-bold uppercase tracking-widest mb-3">{t.plNewSignal}</h4>
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="flex-1 min-w-0 w-full relative group">
                    <input
                      type="text"
                      placeholder="Área del Equipo (ej. Empacadora)"
                      value={newTag.group}
                      onChange={(e) => setNewTag({...newTag, group: e.target.value})}
                      className="w-full bg-[#1A253A] border-[2px] border-[#A3855B]/80 pl-8 pr-3 py-2 text-[#FCFAEA] placeholder-[#A3855B]/50 focus:outline-none focus:border-[#E8C673] text-sm font-bold"
                    />
                    <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#A3855B] hover:text-[#E8C673] cursor-help" title="Organiza tus señales por máquina o etapa (carpeta) para no perderte después. Ej: 'Zona de Enfriamiento'">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 w-full relative group">
                    <input
                      type="text"
                      placeholder="¿Qué estamos leyendo? (ej. Temp_Horno)"
                      value={newTag.name}
                      onChange={(e) => setNewTag({...newTag, name: e.target.value})}
                      className="w-full bg-[#1A253A] border-[2px] border-[#A3855B]/80 pl-8 pr-3 py-2 text-[#FCFAEA] placeholder-[#A3855B]/50 focus:outline-none focus:border-[#E8C673] text-sm font-bold"
                    />
                    <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#A3855B] hover:text-[#E8C673] cursor-help" title="Ponle un nombre lógico para que la Inteligencia Artificial lo entienda. Importante: ¡No uses espacios!">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 w-full relative group">
                    <input
                      type="text"
                      placeholder="Dirección del PLC (ej. M0.0, 40001)"
                      title="Ejemplos: Si es Siemens pon M0.0 o DB1,X0. Si es AB pon Motor_Run. Si es Modbus pon 40001."
                      value={newTag.address}
                      onChange={(e) => setNewTag({...newTag, address: e.target.value.toUpperCase()})}
                      className="w-full bg-[#1A253A] border-[2px] border-[#A3855B]/80 pl-8 pr-3 py-2 text-[#FCFAEA] placeholder-[#A3855B]/50 focus:outline-none focus:border-[#E8C673] text-sm font-mono font-bold uppercase"
                    />
                    <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#A3855B] hover:text-[#E8C673] cursor-help" title="Revisa tu software (TIA Portal, Studio 5000, etc.) y escribe la dirección de memoria exacta o el Tag.">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 w-full relative group">
                    <input
                      type="text"
                      placeholder="Unidad (ej. °C, kg, bar)"
                      value={newTag.unit}
                      onChange={(e) => setNewTag({...newTag, unit: e.target.value})}
                      className="w-full bg-[#1A253A] border-[2px] border-[#A3855B]/80 pl-8 pr-3 py-2 text-[#FCFAEA] placeholder-[#A3855B]/50 focus:outline-none focus:border-[#E8C673] text-sm font-bold"
                    />
                    <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#A3855B] hover:text-[#E8C673] cursor-help" title="Unidad de medida para mostrar en el dashboard (ej. bar, °C, RPM, kg). Para tipos Bool puedes usar (ON/OFF), Activo/Inactivo, o blanco.">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 w-full relative flex gap-2">
                    <div className="relative flex-1 group">
                      <select
                        value={newTag.type}
                        onChange={(e) => setNewTag({...newTag, type: e.target.value})}
                        className="w-full h-full bg-[#1A253A] border-[2px] border-[#A3855B]/80 pl-8 pr-8 py-2 text-[#FCFAEA] focus:outline-none focus:border-[#E8C673] text-sm font-bold appearance-none cursor-pointer"
                      >
                        <option value="Bool">Sí/No (Bool - Bits)</option>
                        <option value="Real">Decimales (Real/Float)</option>
                        <option value="Int">Números Enteros (Int)</option>
                        <option value="DInt">Doble Entero</option>
                        <option value="Byte">Byte</option>
                        <option value="Word">Word</option>
                      </select>
                      <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#A3855B] hover:text-[#E8C673] cursor-help z-10" title="Selecciona el tipo de variable (Booleano = On/Off, Real = números con decimal, Int = entero)">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </div>
                      <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-[#A3855B]">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        if (newTag.name && newTag.address) {
                          setIoTags([...ioTags, { id: Date.now().toString(), ...newTag }]);
                          setNewTag({ group: newTag.group, name: '', address: '', type: 'Bool', unit: '' }); // Mantiene el grupo para agilidad
                        }
                      }}
                      className="bg-[#D4AF37] hover:bg-[#E5C158] text-black px-4 py-2 font-bold tracking-widest text-sm transition-all shadow-[2px_2px_0_0_rgba(163,133,91,0.5)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] shrink-0 md:w-12 flex items-center justify-center"
                      style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Lista de tags creados */}
              <div className="mt-2 text-sm flex-1">
                <div className="grid grid-cols-12 gap-2 text-[#CBB596] font-bold text-[10px] uppercase tracking-widest border-b-[2px] border-[#E8C673]/30 pb-2 mb-2">
                  <div className="col-span-2 px-2 flex items-center gap-1">
                    {t.plGroupCol}
                    <span title="Banderas, memorias o entradas bajo un mismo proceso" className="cursor-help font-normal opacity-70 hover:opacity-100 hover:text-[#E8C673]">(?)</span>
                  </div>
                  <div className="col-span-3 px-2 flex items-center gap-1">
                    {t.plLabelCol}
                    <span title="El nombre con el que el Gemelo Digital entenderá qué es esta variable" className="cursor-help font-normal opacity-70 hover:opacity-100 hover:text-[#E8C673]">(?)</span>
                  </div>
                  <div className="col-span-3 flex items-center gap-1">
                    {t.plAddressCol}
                    <span title="La ruta exacta en el mapa de memoria del PLC" className="cursor-help font-normal opacity-70 hover:opacity-100 hover:text-[#E8C673]">(?)</span>
                  </div>
                  <div className="col-span-1 flex items-center gap-1">
                    {t.plUnitCol}
                  </div>
                  <div className="col-span-2 flex items-center gap-1">
                    {t.plDataTypeCol}
                    <span title="Las dimensiones y formato de los datos que extraes" className="cursor-help font-normal opacity-70 hover:opacity-100 hover:text-[#E8C673]">(?)</span>
                  </div>
                  <div className="col-span-1 text-right pr-2">{t.plActionCol}</div>
                </div>

                <div className="flex flex-col gap-1.5 max-h-[30vh] overflow-y-auto pr-2">
                  {ioTags.length === 0 ? (
                    <div className="text-center py-8 text-[#A3855B] font-mono text-xs opacity-70 border-[2px] border-dashed border-[#A3855B]/30 m-2">
                      {t.plNoMappings}
                      <br/>{t.plAddVarsHint}
                    </div>
                  ) : (
                    ioTags.map(tag => (
                      <div key={tag.id} className="grid grid-cols-12 gap-2 items-center bg-[#1A2624]/70 hover:bg-[#1A2624] p-2.5 border-l-[4px] border-[#D4AF37] group transition-colors">
                        <div className="col-span-2 font-semibold text-[#8B9BB4] text-xs px-2 truncate" title={tag.group || 'Sin grupo'}>{tag.group || '---'}</div>
                        <div className="col-span-3 font-bold text-[#FCFAEA] text-sm break-words px-2">{tag.name}</div>
                        <div className="col-span-3 font-mono text-[#4ade80] text-xs uppercase hover:text-white transition-colors cursor-help" title={`Dirección en PLC: ${tag.address}`}>{tag.address}</div>
                        <div className="col-span-1 font-mono text-[#A3855B] text-xs">{tag.unit || '-'}</div>
                        <div className="col-span-2 text-[#E8C673] text-xs font-bold uppercase">{tag.type}</div>
                        <div className="col-span-1 flex gap-3 justify-end items-center pr-1">
                          <button
                            onClick={() => {
                              setNewTag({ group: tag.group || '', name: tag.name, address: tag.address, type: tag.type, unit: tag.unit || '' });
                              setIoTags(ioTags.filter(t => t.id !== tag.id));
                            }}
                            className="text-[#E8C673] opacity-50 group-hover:opacity-100 hover:text-[#D4AF37] hover:scale-110 transition-all text-lg leading-none"
                            aria-label={`Editar ${tag.name}`}
                            title="Editar"
                          >
                            ✎
                          </button>
                          <button 
                            onClick={() => setIoTags(ioTags.filter(t => t.id !== tag.id))}
                            className="text-red-400 opacity-50 group-hover:opacity-100 hover:text-red-300 hover:scale-110 font-bold transition-all text-lg leading-none"
                            aria-label={`Eliminar ${tag.name}`}
                            title="Eliminar"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[#E8C673]/30 flex justify-end gap-4 bg-[#0B0F19]">
              <button 
                onClick={() => setShowConfigurator(false)}
                className="px-6 py-2.5 text-[#CBB596] hover:text-[#FCFAEA] font-bold tracking-widest uppercase text-sm transition-colors"
                style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
              >
                {t.plCancel}
              </button>
              <button 
                onClick={() => {
                  if (selectedPlcId) {
                      setIsSaving(true);
                      supabase.from('plcs').update({ io_config: ioTags }).eq('id', selectedPlcId).then(({ error }) => {
                        setIsSaving(false);
                        if (error) { showToast('Error al guardar I/O: ' + error.message, 'error'); return; }
                        showToast('Mapa I/O guardado correctamente', 'success');
                        setSavedPLCs(prev => prev.map(p => p.id === selectedPlcId ? { ...p, io_config: ioTags } : p));
                        setShowConfigurator(false);
                      });
                    } else {
                      showToast('Primero guarda el PLC antes de mapear variables', 'error');
                      setShowConfigurator(false);
                    }
                }}
                className="px-6 py-2.5 bg-[#E8C673] hover:bg-[#D4AF37] text-[#312011] font-bold tracking-[0.1em] uppercase text-sm transition-all"
                style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
              >
                {t.plSaveMap}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Header Fijo */}
      <header className="relative z-20 p-4 sm:p-6 flex justify-between items-center border-b border-white/10 bg-black/40 backdrop-blur-md">
        <button 
          onClick={() => isConnected ? setIsConnected(false) : router.push('/planta')}
          className="text-white/70 hover:text-white flex items-center gap-2 text-sm font-semibold transition-colors"
        >
          <span>← {isConnected ? t.plDisconnect : t.plBackToBrands}</span>
        </button>
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/planta/dashboard')}
            className="text-xs font-semibold tracking-widest uppercase text-[#D4AF37] border border-[#D4AF37]/40 px-3 py-1.5 rounded hover:bg-[#D4AF37]/10 transition-colors"
          >
            {t.plDashboard}
          </button>
          <LanguageSelector />
          <div className="h-6 w-px bg-white/20"></div>
          <span className={`font-bold text-sm tracking-widest uppercase ${brandInfo.color}`}>
            {isConnected ? `${t.plControlCenter} - ${brandInfo.name}` : `${t.plPlcConnection} - ${brandInfo.name}`}
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
              <h2 className="text-2xl font-bold text-[#312011] tracking-tight font-serif uppercase">{t.plRitualLink}</h2>
              <p className="text-[#4B3B2B] text-sm font-medium mt-1">
                {t.plConnectingTo} <span className="font-bold">{brandInfo.name}</span>.
              </p>
            </div>

            {/* Selector de Modo de Conexión */}
            <div className="w-full bg-[#D1C3AD]/50 p-1 border-[2px] border-[#A3855B] flex items-center mb-6 relative z-10" style={{ clipPath: 'polygon(8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px), 0 8px)' }}>
              <div 
                className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-[#121927] border-[2px] border-[#E8C673] transition-all duration-300 ease-in-out ${connectionMode === 'local' ? 'left-1' : 'left-[calc(50%+2px)]'}`}
              ></div>
              <button 
                onClick={() => setConnectionMode('local')}
                className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-widest relative z-10 transition-colors ${connectionMode === 'local' ? 'text-[#E8C673]' : 'text-[#69523C] hover:text-[#312011]'}`}
              >
                {t.plLocalMode}
              </button>
              <button
                onClick={() => setConnectionMode('cloud')}
                className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-widest relative z-10 transition-colors ${connectionMode === 'cloud' ? 'text-[#E8C673]' : 'text-[#69523C] hover:text-[#312011]'}`}
              >
                {t.plCloudMode}
              </button>
            </div>

            {/* Quick Select Autocomplete (Mock Data) */}
            <div className="w-full mb-6 relative z-10 flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#69523C] uppercase tracking-widest px-1 font-sans">{t.plSelectPlc}</label>
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
                        ? t.plNewConnection
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
                  <span className="text-[#A3855B]">❂</span> {t.plConnectionPaths}
                </h3>
                <div className="text-[#4B3B2B] text-xs font-medium space-y-3 leading-relaxed">
                  <p><strong className="text-[#312011]">{t.plLocalMode}:</strong> {t.plLocalModeDesc} {brandInfo.name}.</p>
                  <p><strong className="text-[#312011]">{t.plCloudMode}:</strong> {t.plCloudModeDesc}</p>
                </div>
                <button
                  onClick={() => router.push('/planta/ayuda')}
                  className="mt-4 text-[#A3855B] text-xs font-bold uppercase tracking-widest hover:underline flex items-center gap-1 transition-colors hover:text-[#69523C]"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {t.plReadMore} &rarr;
                </button>
              </div>
            )}

            <form onSubmit={handleConnect} className="w-full flex flex-col gap-4">

              {/* Selector de Modelo Físico */}
              <div className="flex flex-col gap-1.5 relative z-10 mb-2">
                <label className="text-xs font-bold text-[#69523C] uppercase tracking-widest px-1 font-sans">{t.plControllerFamily}</label>
                <div className="relative">
                  <select 
                    value={plcModel}
                    onChange={(e) => setPlcModel(e.target.value)}

                    className="w-full bg-[#FCFAEA]/90 border-[2px] border-[#69523C] px-4 py-3 text-[#312011] focus:outline-none focus:border-[#A3855B] transition-all font-sans font-bold appearance-none cursor-pointer text-sm"
                  >
                    {brandId === 'siemens' ? (
                      <>
                        <option value="s7-1200">Siemens S7-1200</option>
                        <option value="s7-1500">Siemens S7-1500</option>
                        <option value="s7-300">Siemens S7-300</option>
                        <option value="logo">Siemens LOGO! 8</option>
                      </>
                    ) : (
                      <option value="standard">{brandInfo.name} Estándar (Predeterminado)</option>
                    )}
                  </select>
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-[#69523C]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>

              {/* Nombre y Guardado en el Panel Principal */}
              {!selectedPlcId && (
                <div className="w-full mb-4 relative z-10 flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-[#69523C] uppercase tracking-widest px-1 font-sans">{t.plSaveName}</label>
                    <div className="flex items-center gap-2 bg-[#F2EADA] border-[2px] border-[#A3855B]/50 p-1" style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}>
                      <input 
                        type="text"
                        placeholder="Ej. Línea de Envasado 1"
                        value={newPlcName}
                        onChange={(e) => setNewPlcName(e.target.value)}
                        className="bg-transparent text-sm text-[#312011] px-2 py-1 focus:outline-none flex-1 placeholder-[#A3855B]/60 font-bold"
                      />
                      <button 
                        type="button"
                        onClick={handleSavePlc}
                        disabled={isSaving || !newPlcName.trim() || !ipAddress.trim()}
                        className="bg-[#D4AF37] hover:bg-[#CBB596] disabled:bg-gray-400 disabled:text-gray-200 text-[#312011] text-[10px] uppercase font-bold px-4 py-2 transition-all tracking-widest flex items-center gap-2"
                        style={{ clipPath: 'polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 5px)' }}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                        {isSaving ? '...' : t.plSave}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <div className="flex-1 flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-[#69523C] uppercase tracking-widest px-1 font-sans">1er Tag Nominal</label>
                      <input 
                        type="text"
                        placeholder="Nombre"
                        value={initTagName}
                        onChange={(e) => setInitTagName(e.target.value)}
                        className="w-full bg-[#F2EADA] border-[2px] border-[#A3855B]/50 px-3 py-1.5 text-sm text-[#312011] placeholder-[#A3855B]/60 focus:outline-none focus:border-[#69523C] transition-all font-bold"
                      />
                    </div>
                    <div className="flex-1 flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-[#69523C] uppercase tracking-widest px-1 font-sans">Dirección Física</label>
                      <input 
                        type="text"
                        placeholder="Ej: M0.0"
                        value={initTagAddress}
                        onChange={(e) => setInitTagAddress(e.target.value)}
                        className="w-full bg-[#F2EADA] border-[2px] border-[#A3855B]/50 px-3 py-1.5 text-sm text-[#312011] placeholder-[#A3855B]/60 focus:outline-none focus:border-[#69523C] transition-all font-bold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {connectionMode === 'cloud' && (
                <div className="bg-[#D1C3AD] border-[2px] border-[#A3855B] p-3 flex items-start gap-3 relative z-10" style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}>
                  <svg className="w-5 h-5 text-[#69523C] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <p className="text-xs text-[#312011] font-medium leading-relaxed">
                    <strong>Túnel de Vientos:</strong> {t.plVpnNote}
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-1.5 relative z-10">
                <label className="text-xs font-bold text-[#69523C] uppercase tracking-widest px-1 font-sans">
                  {connectionMode === 'local' ? t.plIpLocal : t.plIpVpn}
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
                <label className="text-xs font-bold text-[#69523C] uppercase tracking-widest px-1 font-sans">{t.plPortLabel}</label>
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
                    <label className="text-xs font-bold text-[#69523C] uppercase tracking-widest px-1 font-sans">{t.plRackLabel}</label>
                    <input 
                      type="number" 
                      value={rack}
                      onChange={(e) => setRack(e.target.value)}
                      className="w-full bg-[#F2EADA] border-[3px] border-[#A3855B]/80 px-4 py-3 text-[#312011] focus:outline-none focus:border-[#69523C] transition-all font-mono shadow-inner font-bold"
                      style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }} 
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-[#69523C] uppercase tracking-widest px-1 font-sans">{t.plSlotLabel}</label>
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
                    {t.plConnecting}
                  </>
                ) : (
                  <>
                    {t.plConnect}
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
                  {t.plRealTimeMonitoring}                </h2>
                {selectedPlcId && newPlcName && (
                  <div className="text-xs text-white/60 font-mono mt-1 ml-7">
                    PLC: {newPlcName}
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 flex-wrap">
                  {/* Botón de Configuración de E/S en Dashboard */}
                  <button
                    type="button"
                    onClick={() => setShowConfigurator(true)}
                    className="bg-[#E8C673] hover:bg-[#D4B362] text-[#312011] border border-[#69523C] py-1.5 px-3 font-bold font-sans uppercase tracking-wider text-[10px] flex items-center gap-1.5 transition-all shadow-[1px_1px_0_0_rgba(105,82,60,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] rounded"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {t.plAdjustIO}
                  </button>

                  <span className="text-xs font-mono text-white/40 bg-black/30 px-2 py-1 rounded hidden sm:inline-block">{ipAddress}:{port}</span>
                  {!selectedPlcId && (
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-1">
                      <input 
                        type="text"
                        placeholder={t.plSaveName}
                        value={newPlcName}
                        onChange={(e) => setNewPlcName(e.target.value)}
                        className="bg-transparent text-xs text-white px-2 focus:outline-none w-36 placeholder-white/30"
                      />
                      <button 
                        onClick={handleSavePlc}
                        disabled={isSaving || !newPlcName.trim()}
                        className="bg-[#D4AF37] hover:bg-[#E5C158] disabled:bg-gray-600 disabled:text-gray-400 text-black text-[10px] font-bold px-3 py-1.5 rounded transition-colors tracking-widest"
                      >
                         {isSaving ? '...' : t.plSave}
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {ioTags.length > 0 ? (
                <>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center hover:bg-white/10 transition-colors">
                    <span className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-2">{t.plConnectionStatus}</span>
                    <span className={`text-lg font-black mt-2 shadow-sm drop-shadow-lg ${plcData?.estatusGeneral?.includes('OPERATIVO') ? 'text-green-400' : 'text-red-400'}`}>
                      {plcData?.estatusGeneral ?? 'No Conectado'}
                    </span>
                  </div>
                  {ioTags.map((tag) => {
                    const saneName = tag.name.replace(/\s+/g, '_');
                    return (
                      <div key={tag.id || tag.name} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center hover:bg-white/10 transition-colors">
                        <span className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-2">{tag.group ? `${tag.group} - ` : ''}{tag.name}</span>
                        <span className="text-3xl font-black text-white">
                          {plcData?.[saneName] !== undefined 
                            ? (typeof plcData[saneName] === 'boolean' 
                                ? <span className={plcData[saneName] ? "text-green-500" : "text-red-500"}>{plcData[saneName] ? 'ON' : 'OFF'}</span> 
                                : plcData[saneName]) 
                            : '--'}
                          {tag.unit && plcData?.[saneName] !== undefined ? <span className="text-lg text-white/40 ml-1">{tag.unit}</span> : (!tag.unit && plcData?.[saneName] !== undefined && !tag.type.toLowerCase().includes('bool') && <span className="text-lg text-white/40"> ±</span>)}
                        </span>
                      </div>
                    );
                  })}
                </>
              ) : (
                <>
                  {/* GENERACIÓN AUTOMÁTICA DE VISTAS SEGÚN LO QUE LLEGUE DEL GATEWAY */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center hover:bg-white/10 transition-colors">
                    <span className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-2">{t.plConnectionStatus}</span>
                    <span className={`text-lg font-black mt-2 shadow-sm drop-shadow-lg ${plcData?.estatusGeneral?.includes('OPERATIVO') ? 'text-green-400' : 'text-red-400'}`}>
                      {plcData?.estatusGeneral ?? 'No Conectado'}
                    </span>
                  </div>
                  
                  {plcData && Object.keys(plcData).filter(p => !['estatusGeneral', 'estatusgeneral', 'updated_at', 'plc_id', 'variables'].includes(p)).length > 0 ? (
                    Object.entries(plcData)
                      .filter(([key]) => !['estatusGeneral', 'estatusgeneral', 'updated_at', 'plc_id', 'variables'].includes(key))
                      .map(([key, value]) => (
                        <div key={key} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center hover:bg-white/10 transition-colors">
                          <span className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-2">{key.replace(/_/g, ' ')}</span>
                          <span className="text-3xl font-black text-white">
                            {typeof value === 'boolean' 
                              ? <span className={value ? "text-green-500" : "text-red-500"}>{value ? 'ON' : 'OFF'}</span> 
                              : String(value)}
                          </span>
                        </div>
                      ))
                  ) : (
                    <>
                      {/* Cuadro de Muestra si no hay data */}
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center hover:bg-white/10 transition-colors">
                        <span className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-2">Aviso</span>
                        <span className="text-sm font-black text-white/50 mt-2 text-balance leading-relaxed">
                          Esperando datos o falta Mapeo de E/S
                        </span>     
                      </div>
                    </>
                  )}
                </>
              )}
              {/* Mensaje Largo */}
              <div className={`${plcWarning?.includes('0x8104') ? 'bg-red-900/30 border-red-500/40' : 'bg-white/5 border-white/10'} border rounded-2xl p-4 flex flex-col items-center justify-center text-center col-span-2 md:col-span-2 hover:bg-white/10 transition-colors`}>
                <span className={`${plcWarning?.includes('0x8104') ? 'text-red-400' : 'text-white/50'} text-[10px] font-bold uppercase tracking-widest mb-2`}>
                  {plcWarning?.includes('0x8104') ? t.plAccessError : t.plPredictiveAlarm}
                </span>
                <span className={`text-sm font-light ${plcWarning?.includes('0x8104') ? 'text-red-200' : 'text-white/80'} mt-1`}>
                  {plcWarning
                    ? plcWarning
                    : `${brandInfo.name} ${t.plAllNormal}`
                  }
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
                {t.plLiveAssistant} {brandInfo.name}
              </p>

              <div className="flex-1 bg-black/60 rounded-2xl border border-white/5 p-4 flex flex-col h-full overflow-hidden relative">
                {/* Área de Mensajes */}
                <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-2 pb-4">
                  {chatMessages.length === 0 && (
                    <div className="bg-white/10 text-white/90 text-sm p-4 rounded-tr-2xl rounded-bl-2xl rounded-br-2xl self-start w-11/12 border border-white/5 backdrop-blur-sm">
                      {t.plAiGreeting} <b>{brandInfo.name}</b>{t.plAiGreetingEnd}
                    </div>
                  )}
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`text-sm p-4 border border-white/5 backdrop-blur-sm ${
                      msg.role === 'user'
                        ? 'bg-[#D4AF37]/10 text-[#D4AF37] rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl self-end w-10/12'
                        : 'bg-white/10 text-white/90 rounded-tr-2xl rounded-bl-2xl rounded-br-2xl self-start w-11/12'
                    }`}>
                      {msg.content}
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="bg-white/5 text-white/40 text-sm p-4 rounded-tr-2xl rounded-bl-2xl rounded-br-2xl self-start animate-pulse">
                      {t.plAnalyzing}
                    </div>
                  )}
                </div>

                {/* Input */}
                <div className="mt-auto pt-2 flex gap-2 border-t border-white/5">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleChatSend()}
                    placeholder={`${t.plChatPlaceholder} ${brandInfo.name}...`}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#D4AF37]/50 focus:bg-white/10 transition-all font-light"
                    disabled={chatLoading}
                  />
                  <button
                    onClick={handleChatSend}
                    disabled={chatLoading || !chatInput.trim()}
                    className="bg-[#D4AF37] hover:bg-[#E5C158] disabled:opacity-40 text-black px-4 py-3 rounded-xl transition-all hover:scale-105 shadow-[0_0_10px_rgba(212,175,55,0.4)]"
                  >
                    <svg className="w-5 h-5 mx-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                  </button>
              </div>
              </div>
            </div>
          </div>
        </main>
      )}
    {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl border backdrop-blur-md transition-all ${
          toast.type === 'success' ? 'bg-green-900/80 border-green-500/40 text-green-300' :
          toast.type === 'error'   ? 'bg-red-900/80 border-red-500/40 text-red-300' :
                                     'bg-black/90 border-[#D4AF37]/30 text-[#D4AF37]'
        }`}>
          <span className="text-sm font-light">{toast.msg}</span>
          <button onClick={() => setToast(null)} className="opacity-50 hover:opacity-100 text-xs ml-2">✕</button>
        </div>
      )}
    </div>

  );
}

export default function PlcDashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#111] flex items-center justify-center"><div className="w-8 h-8 rounded-full bg-[#D4AF37] animate-pulse"></div></div>}>
      <PlcDashboardContent />
    </Suspense>
  );
}
