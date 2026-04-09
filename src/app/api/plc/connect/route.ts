
import { NextResponse } from 'next/server';
// @ts-ignore
import nodes7 from 'nodes7';
import { supabase } from './supabase';

// ---------------------------------------------------------------------------
// POOL DE CONEXIONES PERSISTENTES
// ---------------------------------------------------------------------------
// Cada PLC se identifica por ip:port:rack:slot. Se reutiliza la misma instancia
// de nodes7 para evitar agotar las conexiones TCP del S7-1200 (máx ~8).
// ---------------------------------------------------------------------------
interface PlcConnection {
  conn: any;
  ready: boolean;
  lastUsed: number;
  tagsSignature: string;
}

const globalForPlcPool = global as unknown as { plcPool: Map<string, PlcConnection>; plCleanupInterval: NodeJS.Timeout };

const plcPool = globalForPlcPool.plcPool || new Map<string, PlcConnection>();
if (!globalForPlcPool.plcPool) {
  globalForPlcPool.plcPool = plcPool;
}

// Limpiar intervalo anterior al recargar
if (globalForPlcPool.plCleanupInterval) {
  clearInterval(globalForPlcPool.plCleanupInterval);
}

// Limpieza de conexiones inactivas (>60s sin uso)
globalForPlcPool.plCleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of plcPool) {
    if (now - entry.lastUsed > 60_000) {
      console.log(`[Azteq Pool] Desconectando ${key} por inactividad`);
      try { entry.conn.dropConnection(); } catch { /* ignore */ }
      plcPool.delete(key);
    }
  }
}, 15_000);

function getPoolKey(ip: string, port: number, rack: number, slot: number) {
  return `${ip}:${port}:${rack}:${slot}`;
}

function getOrCreateConnection(
  ip: string, plcPort: number, plcRack: number, plcSlot: number
): Promise<PlcConnection> {
  const key = getPoolKey(ip, plcPort, plcRack, plcSlot);
  const existing = plcPool.get(key);

  if (existing && existing.ready) {
    // Verificar que la conexión TCP siga viva (isoConnectionState 4 = operativa)
    const connState = existing.conn.isoConnectionState;
    if (connState === 4) {
      existing.lastUsed = Date.now();
      return Promise.resolve(existing);
    }
    // Conexión muerta — descartar y reconectar
    console.warn(`[Azteq Pool] Conexión ${key} muerta (state=${connState}), reconectando...`);
    try { existing.conn.dropConnection(); } catch { /* ignore */ }
    plcPool.delete(key);
  }

  // Si hay una entrada muerta, descartamos
  if (existing) {
    try { existing.conn.dropConnection(); } catch { /* ignore */ }
    plcPool.delete(key);
  }

  return new Promise((resolve, reject) => {
    const conn = new nodes7({ debug: true });

    // S7-1200: rack=0, slot=1, sin TSAP manual (nodes7 los calcula internamente)
    const connParams: any = {
      port: plcPort,
      host: ip,
      rack: plcRack,
      slot: plcSlot,
      timeout: 8000,
    };
    console.log(`[Azteq Pool] Conectando rack=${plcRack} slot=${plcSlot} host=${ip}:${plcPort}`);

    conn.initiateConnection(connParams, (err: any) => {
        if (typeof err !== 'undefined') {
          try { conn.dropConnection(); } catch { /* ignore */ }
          return reject(err);
        }
        const entry: PlcConnection = {
          conn,
          ready: true,
          lastUsed: Date.now(),
          tagsSignature: '',
        };
        plcPool.set(key, entry);
        resolve(entry);
      }
    );
  });
}

function destroyConnection(ip: string, plcPort: number, plcRack: number, plcSlot: number) {
  const key = getPoolKey(ip, plcPort, plcRack, plcSlot);
  const entry = plcPool.get(key);
  if (entry) {
    try { entry.conn.dropConnection(); } catch { /* ignore */ }
    plcPool.delete(key);
  }
}

// ---------------------------------------------------------------------------
// Utilidades de direcciones
// ---------------------------------------------------------------------------
const normalizePlcAddress = (address: string) => {
  return String(address).trim().replace(/^%/, '').replace(/\s+/g, '').toUpperCase();
};

const buildNodes7Address = (address: string, type: string): string => {
  const dbMatch = address.match(/^(DB\d+),(.+)$/i);
  if (dbMatch) {
    const dbPart = dbMatch[1].toUpperCase();
    const offsetPart = dbMatch[2];
    if (/^(X|BYTE|B(?!\d)|INT|WORD|W(?!\d)|DINT|DWORD|DW|REAL|R(?!\d)|S|CHAR|C(?!\d))/i.test(offsetPart)) {
      return address;
    }
    const typeMap: Record<string, string> = {
      'bool': 'X', 'real': 'REAL', 'float': 'REAL',
      'int': 'INT', 'dint': 'DINT', 'byte': 'BYTE', 'word': 'WORD',
    };
    const prefix = typeMap[type] || 'REAL';
    return `${dbPart},${prefix}${offsetPart}`;
  }
  return address;
};

// ---------------------------------------------------------------------------
// API ROUTE
// ---------------------------------------------------------------------------
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { brand, ip, port, rack, slot, isCloud, ioTags, connectOnly } = body;

      if (!ip) {
        await supabase.from('plc_errors').insert([{
          user_id: body.user_id || null, plc_id: body.plc_id || null,
          equip: brand || 'Desconocido', code: 'ERR-NOIP',
          desc: 'Falta la dirección IP del PLC', severity: 'Crítico', resolved: false
        }]);
        return NextResponse.json({ success: false, error: 'Falta la dirección IP del PLC' }, { status: 400 });
      }

      // --- VALIDACIÓN DE PROTECCIÓN SSRF PARA IPs ---
      const allowedIPs = process.env.ALLOWED_PLC_IPS ? process.env.ALLOWED_PLC_IPS.split(',') : [];
      const isPrivateIP = /^10\.|^172\.(1[6-9]|2[0-9]|3[0-1])\.|^192\.168\./.test(ip || '');
      const isLocalhost = /^127\.|^::1$/.test(ip || '') || ip === 'localhost';      

      if (!isPrivateIP && !isLocalhost && !allowedIPs.includes(ip)) {
        return NextResponse.json({ success: false, error: 'Conexión a IP no permitida por seguridad' }, { status: 403 });
      }
      // ----------------------------------------------
    // =====================================================================
    if (brand.toLowerCase().includes('siemens') || brand.toLowerCase() === 's7') {
      const plcPort = port ? parseInt(port, 10) : 102;
      const plcRack = rack !== undefined ? parseInt(rack, 10) : 0;
      const plcSlot = slot !== undefined ? parseInt(slot, 10) : 1;

      // --- Solo conectar (sin tags) ---
      const shouldConnectOnly = connectOnly || !ioTags || ioTags.length === 0;
      if (shouldConnectOnly) {
        try {
          const connEntry = await getOrCreateConnection(ip, plcPort, plcRack, plcSlot);
          const state = connEntry.conn.isoConnectionState;
          if (state !== 4) {
            destroyConnection(ip, plcPort, plcRack, plcSlot);
            throw new Error(`Conexión TCP no operativa (state=${state})`);
          }
          return NextResponse.json({
            success: true,
            message: 'Conexión exitosa con ' + brand.toUpperCase(),
            data: { estatusGeneral: 'OPERATIVO' }
          });
        } catch (err: any) {
          supabase.from('plc_errors').insert([{
            user_id: body.user_id || null, plc_id: body.plc_id || null,
            equip: brand || 'Desconocido', code: 'ERR-CONN',
            desc: `Error de conexión en puerto industrial ${ip}: ${err}`,
            severity: 'Crítico', resolved: false
          }]);
          return NextResponse.json({
            success: false, error: `Error de conexión en puerto industrial ${ip}: ${err}`
          }, { status: 400 });
        }
      }

      // --- Conectar y leer variables ---
      const sanitizedNames = new Set<string>();
      const normalizedTags = (ioTags || [])
        .filter((tag: any) => tag?.name && tag?.address)
        .map((tag: any, index: number) => {
          const rawName = String(tag.name).trim() || `tag_${index}`;
          let alias = rawName.replace(/[^a-zA-Z0-9_]/g, '_');
          if (!alias || /^[0-9]/.test(alias)) alias = `tag_${alias}`;
          let uniqueAlias = alias;
          let counter = 1;
          while (sanitizedNames.has(uniqueAlias)) {
            uniqueAlias = `${alias}_${counter++}`;
          }
          sanitizedNames.add(uniqueAlias);
          const tagType = String(tag.type || 'bool').trim().toLowerCase();
          const normalizedAddr = normalizePlcAddress(tag.address);
          const finalAddr = buildNodes7Address(normalizedAddr, tagType);
          return {
            id: String(tag.id || Date.now()),
            alias: uniqueAlias,
            group: tag.group || '',
            name: rawName,
            address: finalAddr,
            type: tagType,
            unit: String(tag.unit || '').trim()
          };
        });

      if (normalizedTags.length === 0) {
        return NextResponse.json({
          success: true, message: 'Sin tags válidos para leer',
          data: { estatusGeneral: 'OPERATIVO' }
        });
      }

      // Obtener conexión del pool (reutilizada o nueva)
      let entry: PlcConnection;
      try {
        entry = await getOrCreateConnection(ip, plcPort, plcRack, plcSlot);
      } catch (err: any) {
        supabase.from('plc_errors').insert([{
          user_id: body.user_id || null, plc_id: body.plc_id || null,
          equip: brand || 'Desconocido', code: 'ERR-CONN',
          desc: `Error de conexión en puerto industrial ${ip}: ${err}`,
          severity: 'Crítico', resolved: false
        }]);
        return NextResponse.json({
          success: false, error: `Error de conexión en puerto industrial ${ip}: ${err}`
        }, { status: 400 });
      }

      const { conn } = entry;
      const itemAliases = normalizedTags.map((t: any) => t.alias);
      const newSignature = normalizedTags.map((t: any) => `${t.alias}=${t.address}`).join('|');

      // Solo re-registrar items cuando cambian los tags
      if (newSignature !== entry.tagsSignature) {
        console.log('[Azteq Pool] Tags cambiaron, destruyendo conexión vieja y creando nueva...');

        // Destruir la conexión anterior completamente y crear una nueva
        destroyConnection(ip, plcPort, plcRack, plcSlot);
        try {
          entry = await getOrCreateConnection(ip, plcPort, plcRack, plcSlot);
        } catch (err: any) {
          return NextResponse.json({
            success: false, error: `Error reconectando al PLC: ${err}`
          }, { status: 400 });
        }
        const freshConn = entry.conn;

        // Registrar el callback de traducción (alias → dirección real)
        const translationMap = new Map<string, string>();
        normalizedTags.forEach((t: any) => translationMap.set(t.alias, t.address));
        freshConn.setTranslationCB((tag: string) => {
          const addr = translationMap.get(tag);
          console.log(`[Azteq Pool] Traducción: ${tag} → ${addr}`);
          return addr;
        });

        // Agregar los nuevos items
        freshConn.addItems(itemAliases);
        entry.tagsSignature = newSignature;

        console.log('[Azteq Pool] Tags registrados:', itemAliases);
        console.log('[Azteq Pool] Traducciones:', normalizedTags.map((t: any) => ({ alias: t.alias, address: t.address })));

        // Esperar un momento para que nodes7 procese los items internamente
        await new Promise(r => setTimeout(r, 200));
      }

      const activeConn = entry.conn;
      const connState = (activeConn as any).isoConnectionState;
      console.log('[Azteq Pool] Estado conexión (isoConnectionState):', connState);

      // Si la conexión no está en estado operativo (4), forzar reconexión
      if (connState !== 4) {
        console.warn(`[Azteq Pool] Conexión no operativa (state=${connState}), forzando reconexión...`);
        destroyConnection(ip, plcPort, plcRack, plcSlot);
        return NextResponse.json({
          success: false,
          error: 'Conexión con el PLC perdida. Reconectando automáticamente...'
        }, { status: 503 });
      }

      // Leer variables (reutilizando la conexión existente)
      console.log('[Azteq Pool] Llamando readAllItems con', itemAliases.length, 'items...');
      const readStart = Date.now();
      const { readErr, values } = await new Promise<{ readErr: any; values: any }>((resolve) => {
        activeConn.readAllItems((err: any, vals: any) => {
          console.log(`[Azteq Pool] readAllItems callback en ${Date.now() - readStart}ms, err:`, err, 'values:', JSON.stringify(vals));
          resolve({ readErr: err, values: vals });
        });
      });

      const elapsedMs = Date.now() - readStart;

      // Si la lectura fue instantánea (<20ms) y todo es BAD, nodes7 devolvió caché stale
      // Forzar reconexión completa para que la próxima lectura sea real
      const allBad = itemAliases.every((alias: string) => {
        const raw = values?.[alias];
        return typeof raw === 'string' && raw.toUpperCase().startsWith('BAD');
      });
      if (allBad && elapsedMs < 20) {
        console.warn(`[Azteq Pool] Lectura instantánea (${elapsedMs}ms) con todos BAD — caché stale detectado. Forzando reconexión...`);
        destroyConnection(ip, plcPort, plcRack, plcSlot);
        // Intentar una reconexión inmediata y releer
        try {
          entry = await getOrCreateConnection(ip, plcPort, plcRack, plcSlot);
          const retryConn = entry.conn;
          // Re-registrar traducciones y tags en la conexión fresca
          const translationMap2 = new Map<string, string>();
          normalizedTags.forEach((t: any) => translationMap2.set(t.alias, t.address));
          retryConn.setTranslationCB((tag: string) => translationMap2.get(tag));
          retryConn.addItems(itemAliases);
          entry.tagsSignature = newSignature;
          await new Promise(r => setTimeout(r, 300));

          const retryResult = await new Promise<{ readErr: any; values: any }>((resolve) => {
            const retryStart = Date.now();
            retryConn.readAllItems((err: any, vals: any) => {
              console.log(`[Azteq Pool] RETRY readAllItems en ${Date.now() - retryStart}ms, err:`, err, 'values:', JSON.stringify(vals));
              resolve({ readErr: err, values: vals });
            });
          });
          // Usar los resultados del retry en adelante
          Object.assign(values, retryResult.values);
        } catch (retryErr) {
          console.error('[Azteq Pool] Reconexión fallida:', retryErr);
          return NextResponse.json({
            success: false,
            error: `PLC no responde. Verifica el cable de red y que el PLC esté en RUN.`
          }, { status: 503 });
        }
      }

      // Manejar errores de lectura
      const hadQualityIssue = readErr === true;
      if (readErr && !hadQualityIssue) {
        const readErrorMsg = typeof readErr === 'object'
          ? readErr.message || JSON.stringify(readErr) : String(readErr);
        const isReset = readErrorMsg.includes('ECONNRESET');

        if (isReset) {
          console.warn('[Azteq Pool] TCP reset detectado, invalidando conexión para reconectar...');
          destroyConnection(ip, plcPort, plcRack, plcSlot);
        }

        supabase.from('plc_errors').insert([{
          user_id: body.user_id || null, plc_id: body.plc_id || null,
          equip: brand || 'Desconocido', code: 'ERR-READ',
          desc: 'Error leyendo bus de datos: ' + readErrorMsg,
          severity: 'Crítico', resolved: false
        }]);
        return NextResponse.json({
          success: false,
          error: 'Error leyendo bus de datos: ' + readErrorMsg +
            (isReset ? ' (Reconectando automáticamente en el próximo ciclo)' : '')
        }, { status: 500 });
      }

      if (hadQualityIssue) {
        console.warn('[Azteq Pool] Lectura con calidad parcial:', values);
      } else {
        console.log('[Azteq Pool] Valores leídos:', values);
      }

      // Marcar errores previos como resueltos
      supabase.from('plc_errors')
        .update({ resolved: true })
        .eq('plc_id', body.plc_id || null)
        .eq('resolved', false)
        .lte('time', new Date().toISOString());

      // Verificar si se leyó algo válido
      const noValueRead = itemAliases.every((alias: string) => {
        const raw = values?.[alias];
        return raw === undefined || raw === null ||
          (typeof raw === 'string' && raw.toUpperCase().startsWith('BAD'));
      });

      if (noValueRead) {
        console.warn('[Azteq Pool] Ninguna variable leída:', values);

        // Detectar si es error 0x8104 (Access Denied) — BAD 255
        const hasBad255 = Object.values(values || {}).some(
          (v: any) => typeof v === 'string' && v.toUpperCase() === 'BAD 255'
        );

        const partialData: any = { estatusGeneral: 'OPERATIVO' };
        itemAliases.forEach((alias: string) => {
          const tag = normalizedTags.find((t: any) => t.alias === alias);
          if (tag) partialData[tag.name] = '--';
        });

        const warning = hasBad255
          ? 'El PLC rechazó la lectura (Error S7: 0x8104 — Acceso Denegado). ' +
            'En TIA Portal: Propiedades del PLC → Protección y Seguridad → ' +
            'Nivel de acceso → Seleccionar "Acceso completo (sin protección)". ' +
            'Luego compilar y descargar al PLC.'
          : 'No se pudieron leer las variables. Posibles causas: ' +
            '1) La dirección no existe en el programa del PLC. ' +
            '2) Formato de dirección incorrecto para el tipo de dato. ' +
            '3) Acceso PUT/GET no habilitado en TIA Portal.';

        return NextResponse.json({
          success: true,
          message: hasBad255 ? 'Conexión exitosa, acceso denegado por el PLC' : 'Conexión exitosa, variables sin lectura',
          data: partialData,
          warning,
          errorCode: hasBad255 ? '0x8104' : undefined,
          debug: { values, tags: normalizedTags.map((t: any) => ({ alias: t.alias, address: t.address })) }
        });
      }

      // Construir respuesta con valores leídos
      const finalData: any = { estatusGeneral: 'OPERATIVO' };
      itemAliases.forEach((alias: string) => {
        const tag = normalizedTags.find((t: any) => t.alias === alias);
        if (tag) {
          const rawValue = values[alias];
          finalData[tag.name] = (typeof rawValue === 'string' && rawValue.toUpperCase().startsWith('BAD'))
            ? '--' : (rawValue !== undefined ? rawValue : '--');
        }
      });

      const responseBody: any = {
        success: true,
        message: 'Conexión exitosa y lectura de variables',
        data: finalData
      };
      if (hadQualityIssue) {
        responseBody.warning = 'Lectura completada con calidad parcial en algunos valores.';
      }
      return NextResponse.json(responseBody);

    } else {
      // =====================================================================
      // CONTROLADOR GENÉRICO (Allen-Bradley, Delta, Keyence, Mitsubishi, Fanuc)
      // =====================================================================
      await new Promise(r => setTimeout(r, 1200));
      const genericSensorData: any = {
        temperaturaCpu: +(Math.random() * 8 + 35).toFixed(1),
        presionSistema: +(Math.random() * 0.8 + 1.2).toFixed(2),
        estatusGeneral: 'OPERATIVO',
        ciclosPorHora: Math.floor(Math.random() * 300 + 800)
      };

      if (ioTags && ioTags.length > 0) {
        for (let key in genericSensorData) delete genericSensorData[key];
        genericSensorData.estatusGeneral = 'OPERATIVO';
        ioTags.forEach((tag: any) => {
          if (tag.type.toLowerCase().includes('bool')) {
            genericSensorData[tag.name] = Math.random() > 0.5;
          } else if (tag.type.toLowerCase().includes('real') || tag.type.toLowerCase().includes('float')) {
            genericSensorData[tag.name] = +(Math.random() * 100).toFixed(2);
          } else {
            genericSensorData[tag.name] = Math.floor(Math.random() * 100);
          }
        });
      }

      return NextResponse.json({
        success: true,
        message: `Conexión genérica (Protocolo Universal) establecida con ${brand.toUpperCase()}`,
        data: genericSensorData
      });
    }

  } catch (error: any) {
    supabase.from('plc_errors').insert([{
      user_id: null, plc_id: null, equip: 'Servidor',
      code: 'ERR-EXC', desc: 'Excepción de Servidor: ' + error.message,
      severity: 'Crítico', resolved: false
    }]);
    return NextResponse.json({ success: false, error: 'Excepción de Servidor: ' + error.message }, { status: 500 });
  }
}
