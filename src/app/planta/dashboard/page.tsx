
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import LanguageSelector from '@/components/LanguageSelector';
import { useLanguage } from '@/components/LanguageContext';



export default function PlantDashboard() {
  const router = useRouter();
  const { t } = useLanguage();
  // Estado para mostrar/ocultar variables por PLC
  const [showVars, setShowVars] = useState<Record<string, boolean>>({});
  // Estado para userId
  const [userId, setUserId] = useState<string | null>(null);
    // Grupos/Lineas de producción
    const [groups, setGroups] = useState<any[]>([]);
    const [groupName, setGroupName] = useState('');
    const [editingGroup, setEditingGroup] = useState<any>(null);
    const [groupLoading, setGroupLoading] = useState(false);
    const [groupError, setGroupError] = useState<string | null>(null);

    useEffect(() => {
      const checkUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/');
          return;
        }
        setUserId(session.user.id);
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('plan')
          .eq('id', session.user.id)
          .single();
          
        if (profile?.plan === 'free') {
          router.push('/planes');
          return;
        }
      };
      checkUser();
    }, [router]);

    // Obtener grupos del usuario
    useEffect(() => {
      if (!userId) return;
      const fetchGroups = async () => {
        setGroupLoading(true);
        const { data, error } = await supabase
          .from('plc_groups')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: true });
        if (!error && data) setGroups(data);
        setGroupLoading(false);
      };
      fetchGroups();
    }, [userId]);

    // Crear o editar grupo
    const handleSaveGroup = async (e: any) => {
      e.preventDefault();
      setGroupError(null);
      setGroupLoading(true);
      try {
        if (editingGroup) {
          // Editar
          const { error } = await supabase.from('plc_groups').update({ name: groupName }).eq('id', editingGroup.id);
          if (error) setGroupError(error.message);
        } else {
          // Crear
          if (!userId) {
            setGroupError('No hay usuario autenticado.');
            setGroupLoading(false);
            return;
          }
          const { error } = await supabase.from('plc_groups').insert([{ name: groupName, user_id: userId }]);
          if (error) setGroupError(error.message);
        }
        setGroupName('');
        setEditingGroup(null);
        // Refrescar
        if (userId) {
          const { data } = await supabase.from('plc_groups').select('*').eq('user_id', userId).order('created_at', { ascending: true });
          setGroups(data || []);
        }
      } catch (err: any) {
        setGroupError(err.message || 'Error desconocido');
      }
      setGroupLoading(false);
    };

    // Eliminar grupo
    const handleDeleteGroup = async (id: string) => {
      if (!confirm(t.dbConfirmDeleteGroup)) return;
      setGroupLoading(true);
      if (userId) {
        const { data } = await supabase.from('plc_groups').select('*').eq('user_id', userId).order('created_at', { ascending: true });
        setGroups(data || []);
      }
      setGroupLoading(false);
    };

  const [liveData, setLiveData] = useState<Record<string, any>>({});
  const [plcConnErrors, setPlcConnErrors] = useState<Record<string, string>>({});
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
      setUserId(session.user.id);
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
        // usamos el mapeo real de io_config para las máquinas físicas.
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
               // Forzamos simulación visual en el dashboard por ahora
              ioTags: plc.io_config || []
            })
          });
          const data = await res.json();
          if (data.success) {
            newData[plc.id] = data.data;
            // Limpiar error previo si ahora hay éxito
            setPlcConnErrors(prev => { const e = {...prev}; delete e[plc.id]; return e; });
          } else {
            setPlcConnErrors(prev => ({ ...prev, [plc.id]: data.error || 'Error de conexión' }));
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

  // Permitir asignar PLCs a grupos/lineas
  const [plcError, setPlcError] = useState<string | null>(null);
  const handleAssignGroup = async (plcId: string, groupId: string) => {
    setPlcError(null);
    if (!userId) return;
    const { error } = await supabase.from('plcs').update({ group_id: groupId }).eq('id', plcId);
    if (error) {
      setPlcError(error.message);
      return;
    }
    // Refrescar PLCs
    const { data: plcs } = await supabase
      .from('plcs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (plcs) setUserPLCs(plcs.map(plc => ({ ...plc, status: 'online' })));
  };

  // Eliminar PLC con confirmación (ahora dentro del componente)
  const handleDeletePLC = async (plcId: string) => {
    if (!userId) return;
    if (!confirm(t.dbConfirmDelete)) return;
    await supabase.from('plcs').delete().eq('id', plcId);
    // Refrescar PLCs
    const { data: plcs } = await supabase
      .from('plcs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (plcs) setUserPLCs(plcs.map(plc => ({ ...plc, status: 'online' })));
  };

  const displayPLCs = userPLCs;


  // Real PLC errors/alerts from internal API
  const [recentErrors, setRecentErrors] = useState<any[]>([]);

  useEffect(() => {
    const fetchErrors = async () => {
      try {
        const res = await fetch('/api/plc/errors');
        if (!res.ok) {
          console.error('Error fetching PLC errors:', await res.text());
          return;
        }
        const data = await res.json();
        setRecentErrors(data || []);
      } catch (fetchError) {
        console.error('Error fetching PLC errors:', fetchError);
      }
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
          <span>{t.dbBackToBrands}</span>
        </button>
        <div className="flex items-center gap-4">
          <LanguageSelector />
          <button
            onClick={() => router.push('/planes')}
            className="hidden sm:flex group flex-row items-center justify-center gap-1.5 bg-gradient-to-r from-[#0f172a] to-[#1e1b4b] hover:from-[#1e1b4b] hover:to-[#312e81] border border-indigo-500/30 hover:border-indigo-400/50 text-indigo-200 hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all shadow-[0_4px_10px_rgba(79,70,229,0.15)] hover:shadow-[0_4px_15px_rgba(79,70,229,0.3)]"
          >
            <svg className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>{(t as any).changePlan || 'Cambiar Plan'}</span>
          </button>
          <div className="h-6 w-px bg-white/20"></div>
          <span className="font-bold text-sm tracking-widest uppercase text-[#E8C673]">
            {t.dbVisionTitle}
          </span>
        </div>
      </header>

      <main className="relative z-10 flex-1 p-6 md:p-10 mx-auto w-full max-w-7xl">
        {/* Panel de gestión de grupos/lineas */}
        <section className="mb-10">
          {groupError && (
            <div className="mb-2 p-2 bg-red-900 text-red-200 rounded border border-red-700 font-bold">
              Error: {groupError}
            </div>
          )}
          <h2 className="text-xl font-bold text-[#E8C673] mb-2 flex items-center gap-2">
            <svg className="w-6 h-6 text-[#E8C673]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2h5" /></svg>
            {t.dbProductionGroups}
          </h2>
          <form onSubmit={handleSaveGroup} className="flex gap-2 items-center mb-4">
            <input
              type="text"
              className="px-3 py-2 rounded bg-[#222] border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-[#E8C673]"
              placeholder={t.dbGroupNamePlaceholder}
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              disabled={groupLoading}
              required
              maxLength={32}
            />
            <button
              type="submit"
              className="bg-[#E8C673] text-black font-bold px-4 py-2 rounded hover:bg-[#CBB596] transition-all"
              disabled={groupLoading || !groupName.trim()}
            >
              {editingGroup ? t.dbSaveChanges : t.dbCreateGroup}
            </button>
            {editingGroup && (
              <button
                type="button"
                className="ml-2 px-3 py-2 rounded bg-gray-700 text-white hover:bg-gray-600"
                onClick={() => { setEditingGroup(null); setGroupName(''); }}
              >{t.dbCancel}</button>
            )}
          </form>
          <div className="flex flex-wrap gap-3">
            {groupLoading ? (
              <span className="text-gray-400">{t.dbLoading}</span>
            ) : groups.length === 0 ? (
              <span className="text-gray-400">{t.dbNoGroups}</span>
            ) : (
              groups.map(group => (
                <div key={group.id} className="flex items-center gap-2 bg-[#1A1A1A] border border-[#E8C673]/30 rounded px-3 py-1">
                  <span className="font-bold text-[#E8C673]">{group.name}</span>
                  <button
                    className="text-xs text-blue-400 hover:underline"
                    onClick={() => { setEditingGroup(group); setGroupName(group.name); }}
                  >{t.dbEdit}</button>
                  <button
                    className="text-xs text-red-400 hover:underline"
                    onClick={() => handleDeleteGroup(group.id)}
                  >{t.dbDelete}</button>
                </div>
              ))
            )}
          </div>
        </section>
        <div className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#E8C673] tracking-widest font-serif uppercase flex items-center gap-3">
              <span className="text-[#A3855B]">❂</span> {t.dbGlobalVision}
            </h1>
            <p className="text-white/50 mt-2 font-medium tracking-wide uppercase text-xs">
              {t.dbGlobalVisionDesc}
            </p>
          </div>
        </div>

        {/* Mensaje de error al asignar grupo a PLC */}
        {plcError && (
          <div className="mb-4 p-2 bg-red-900 text-red-200 rounded border border-red-700 font-bold">
            Error al asignar grupo: {plcError}
          </div>
        )}
        {/* Visualización agrupada por línea/grupo */}
        {displayPLCs.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 mt-10 border-[2px] border-dashed border-[#69523C] bg-black/40 backdrop-blur-sm"
               style={{ clipPath: 'polygon(15px 0, calc(100% - 15px) 0, 100% 15px, 100% calc(100% - 15px), calc(100% - 15px) 100%, 15px 100%, 0 calc(100% - 15px), 0 15px)' }}>
            <span className="text-4xl mb-4">⚠️</span>
            <h2 className="text-[#E8C673] font-serif uppercase tracking-widest text-lg font-bold">{t.dbNoPlcs}</h2>
            <p className="text-[#CBB596] text-sm mt-2 font-medium text-center">{t.dbNoPlcsDesc}</p>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Mostrar PLCs agrupados por grupo/linea */}
            {groups.map(group => {
              const plcsInGroup = displayPLCs.filter(plc => plc.group_id === group.id);
              if (plcsInGroup.length === 0) return null;
              return (
                <div key={group.id}>
                  <h3 className="text-lg font-bold text-[#E8C673] mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#E8C673]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2h5" /></svg>
                    {group.name}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {plcsInGroup.map((plc) => {
                      const data = liveData[plc.id];
                      const isOnline = plc.status === 'online';
                      return (
                        <div key={plc.id} className="relative group">
                          {/* ...existing code for PLC card... */}
                          <div 
                            className={`w-full h-full bg-[#E5DBCA]/95 backdrop-blur-md border-[3px] ${isOnline ? 'border-[#69523C]' : 'border-red-900/40 bg-red-950/20 text-white/50'} p-6 flex flex-col shadow-[0_15px_30px_rgba(0,0,0,0.6)] transition-all duration-500 hover:-translate-y-2`}
                            style={{ clipPath: 'polygon(15px 0, calc(100% - 15px) 0, 100% 15px, 100% calc(100% - 15px), calc(100% - 15px) 100%, 15px 100%, 0 calc(100% - 15px), 0 15px)' }}
                          >
                            {/* Selector de grupo/linea y botón eliminar PLC */}
                            <div className="mb-2 flex items-center gap-2">
                              <select
                                className="px-2 py-1 rounded border border-gray-400 text-xs bg-[#222] text-white"
                                value={plc.group_id || ''}
                                onChange={e => handleAssignGroup(plc.id, e.target.value)}
                              >
                                <option value="">{t.dbNoGroup}</option>
                                {groups.map(g => (
                                  <option key={g.id} value={g.id}>{g.name}</option>
                                ))}
                              </select>
                              <button
                                className="ml-2 px-2 py-1 rounded bg-[#E8C673] text-[#312011] text-xs font-bold flex items-center gap-1 hover:bg-[#CBB596] transition-all"
                                onClick={() => router.push(`/planta/${plc.brand}?id=${plc.id}`)}
                                title="Inspeccionar en tiempo real"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" /></svg>
                                {t.dbInspect}
                              </button>
                              <button
                                className="ml-2 px-2 py-1 rounded bg-red-700 text-white text-xs hover:bg-red-800 transition-all"
                                onClick={() => handleDeletePLC(plc.id)}
                                title="Eliminar PLC"
                              >{t.dbDelete}</button>
                            </div>
                            {/* ...existing code... */}
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
                              <div className={`w-4 h-4 rounded-full mt-1 shrink-0 ${plcConnErrors[plc.id] ? 'bg-red-600 shadow-[0_0_12px_#dc2626]' : 'bg-green-500 shadow-[0_0_12px_#22c55e] animate-pulse'}`}></div>
                            </div>
                            {/* ...existing code... */}
                            {/* Visualización profesional de variables */}
                            <div className="mt-2">
                              {plcConnErrors[plc.id] ? (
                                <div className="text-xs text-red-400 font-mono bg-red-900/20 border border-red-500/30 rounded p-2 break-all">
                                  ⚠ {plcConnErrors[plc.id]}
                                </div>
                              ) : (
                              <>
                              <button
                                className="px-3 py-1 rounded bg-[#E8C673] text-[#312011] font-bold text-xs uppercase tracking-widest shadow hover:bg-[#CBB596] transition-all mb-1"
                                onClick={() => setShowVars(prev => ({ ...prev, [plc.id]: !prev[plc.id] }))}
                              >
                              {showVars[plc.id] ? t.dbHideVars : t.dbShowVars}
                              </button>
                              {showVars[plc.id] && (
                                <div>
                                  <h4 className="font-bold text-[#69523C] text-xs uppercase mb-1 tracking-widest">{t.dbVariables}</h4>
                                  {data && Object.keys(data).length > 0 ? (
                                    <div className="max-h-40 overflow-y-auto rounded border border-[#CBB596]/30 bg-white/80 shadow-inner">
                                      <table className="min-w-full text-xs text-left">
                                        <thead className="bg-[#F5E9D0] sticky top-0 z-10">
                                          <tr>
                                            <th className="py-1 px-2 font-bold text-[#A3855B]">{t.dbColName}</th>
                                            <th className="py-1 px-2 font-bold text-[#A3855B]">{t.dbColValue}</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {Object.entries(data).map(([varName, varValue]) => (
                                            <tr key={varName} className="border-b last:border-b-0 border-[#E8C673]/10 hover:bg-[#F5E9D0]/60 transition-colors">
                                              <td className="py-1 px-2 font-mono text-[#312011] break-all">{varName}</td>
                                              <td className="py-1 px-2 font-mono text-[#69523C] text-right">{typeof varValue === 'object' ? JSON.stringify(varValue) : String(varValue)}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  ) : (
                                    <div className="text-xs text-gray-400 italic">{t.dbNoVars}</div>
                                  )}
                                </div>
                              )}
                              </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {/* Mostrar PLCs sin grupo */}
            {(() => {
              const plcsNoGroup = displayPLCs.filter(plc => !plc.group_id);
              if (plcsNoGroup.length === 0) return null;
              return (
                <div>
                  <h3 className="text-lg font-bold text-[#E8C673] mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#E8C673]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
                    {t.dbNoGroup}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {plcsNoGroup.map((plc) => {
                      const data = liveData[plc.id];
                      const isOnline = plc.status === 'online';
                      return (
                        <div key={plc.id} className="relative group">
                          {/* ...existing code for PLC card... */}
                          <div
                            className={`w-full h-full bg-[#E5DBCA]/95 backdrop-blur-md border-[3px] ${isOnline ? 'border-[#69523C]' : 'border-red-900/40 bg-red-950/20 text-white/50'} p-6 flex flex-col shadow-[0_15px_30px_rgba(0,0,0,0.6)] transition-all duration-500 hover:-translate-y-2`}
                            style={{ clipPath: 'polygon(15px 0, calc(100% - 15px) 0, 100% 15px, 100% calc(100% - 15px), calc(100% - 15px) 100%, 15px 100%, 0 calc(100% - 15px), 0 15px)' }}
                          >
                            {/* Selector de grupo/linea */}
                            <div className="mb-2 flex items-center gap-2">
                              <select
                                className="px-2 py-1 rounded border border-gray-400 text-xs bg-[#222] text-white"
                                value={plc.group_id || ''}
                                onChange={e => handleAssignGroup(plc.id, e.target.value)}
                              >
                                <option value="">{t.dbNoGroup}</option>
                                {groups.map(g => (
                                  <option key={g.id} value={g.id}>{g.name}</option>
                                ))}
                              </select>
                            </div>
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
                              <div className={`w-4 h-4 rounded-full mt-1 shrink-0 ${plcConnErrors[plc.id] ? 'bg-red-600 shadow-[0_0_12px_#dc2626]' : 'bg-green-500 shadow-[0_0_12px_#22c55e] animate-pulse'}`}></div>
                            </div>
                            {/* Visualización profesional de variables */}
                            <div className="mt-2">
                              {plcConnErrors[plc.id] ? (
                                <div className="text-xs text-red-400 font-mono bg-red-900/20 border border-red-500/30 rounded p-2 break-all">
                                  ⚠ {plcConnErrors[plc.id]}
                                </div>
                              ) : (
                              <>
                              <button
                                className="px-3 py-1 rounded bg-[#E8C673] text-[#312011] font-bold text-xs uppercase tracking-widest shadow hover:bg-[#CBB596] transition-all mb-1"
                                onClick={() => setShowVars(prev => ({ ...prev, [plc.id]: !prev[plc.id] }))}
                              >
                              {showVars[plc.id] ? t.dbHideVars : t.dbShowVars}
                              </button>
                              {showVars[plc.id] && (
                                <div>
                                  <h4 className="font-bold text-[#69523C] text-xs uppercase mb-1 tracking-widest">{t.dbVariables}</h4>
                                  {data && Object.keys(data).length > 0 ? (
                                    <div className="max-h-40 overflow-y-auto rounded border border-[#CBB596]/30 bg-white/80 shadow-inner">
                                      <table className="min-w-full text-xs text-left">
                                        <thead className="bg-[#F5E9D0] sticky top-0 z-10">
                                          <tr>
                                            <th className="py-1 px-2 font-bold text-[#A3855B]">{t.dbColName}</th>
                                            <th className="py-1 px-2 font-bold text-[#A3855B]">{t.dbColValue}</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {Object.entries(data).map(([varName, varValue]) => (
                                            <tr key={varName} className="border-b last:border-b-0 border-[#E8C673]/10 hover:bg-[#F5E9D0]/60 transition-colors">
                                              <td className="py-1 px-2 font-mono text-[#312011] break-all">{varName}</td>
                                              <td className="py-1 px-2 font-mono text-[#69523C] text-right">{typeof varValue === 'object' ? JSON.stringify(varValue) : String(varValue)}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  ) : (
                                    <div className="text-xs text-gray-400 italic">{t.dbNoVars}</div>
                                  )}
                                </div>
                              )}
                              </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
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
            <h2 className="text-lg md:text-xl font-bold font-serif uppercase tracking-widest text-[#E8C673]">{t.dbAlertsTitle}</h2>
          </div>
          {isAdmin && (
            <div className="flex justify-end px-6 py-2 bg-black/20">
              <button
                onClick={async () => {
                  if (confirm(t.dbConfirmClearErrors)) {
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
                {t.dbClearErrors}
              </button>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-[#1A2624] text-[#E8C673] uppercase text-xs border-b border-[#E8C673]/20">
                <tr>
                  <th className="py-3 px-4 font-bold">{t.dbColTime}</th>
                  <th className="py-3 px-4 font-bold">{t.dbColEquip}</th>
                  <th className="py-3 px-4 font-bold">{t.dbColCode}</th>
                  <th className="py-3 px-4 font-bold">{t.dbColDesc}</th>
                  <th className="py-3 px-4 font-bold">{t.dbColSeverity}</th>
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
                      <td className="py-2 px-4 font-bold uppercase">{err.resolved ? t.dbResolved : err.severity}</td>
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
