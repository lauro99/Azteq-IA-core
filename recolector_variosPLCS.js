require('dotenv').config({ path: '.env.local' });
const nodes7 = require('nodes7');
const { createClient } = require('@supabase/supabase-js');

// 1. Configuración de Supabase usando el Service Role para saltar permisos (RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERROR: Faltan credenciales de Supabase.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Obtenemos todos los IDs separados por una coma de tu archivo .env.local
// Ejemplo en el .env: PLC_IDS=id-del-primer-plc,id-del-segundo-plc
const envPlcIds = process.env.PLC_IDS || process.env.PLC_ID || '';
const plcIdsList = envPlcIds.split(',').map(id => id.trim()).filter(id => id !== '');

if (plcIdsList.length === 0) {
  console.error('❌ ERROR: No definiste ningún PLC en la variable PLC_IDS (separados por coma)');
  process.exit(1);
}

// Función para inicializar un solo PLC
function arrancarHebraPLC(plcConfig) {
  console.log(`[EDGE GATEWAY ENTERPRISE] Iniciando configuración de PLC [${plcConfig.name}] en la IP ${plcConfig.ip}...`);
  
  let variables = {};
  if (plcConfig.io_config && Array.isArray(plcConfig.io_config)) {
    plcConfig.io_config.forEach(tag => {
      const tagName = tag.name.replace(/\s+/g, '_');
      variables[tagName] = tag.address;
    });
  }

  if (Object.keys(variables).length === 0) {
    console.warn(`⚠️ PLC [${plcConfig.name}] en IP ${plcConfig.ip} no tiene tags de E/S configurados en la nube. Ignorando...`);
    return;
  }

  const conn = new nodes7();
  const rack = plcConfig.rack !== null ? plcConfig.rack : 0;
  const slot = plcConfig.slot !== null ? plcConfig.slot : 1;

  conn.initiateConnection({ port: 102, host: plcConfig.ip, rack: rack, slot: slot, timeout: 8000 }, (err) => {
    if (typeof err !== 'undefined') {
      console.error(`❌ [${plcConfig.name}] Error conectando a IP ${plcConfig.ip}:`, err);
      // Aqui podrías agregar lógica para reintentar la conexión si falla
      return;
    }
    
    console.log(`✅ [${plcConfig.name}] Enlace establecido en ${plcConfig.ip}. Lectura iniciada.`);
    conn.setTranslationCB((tag) => variables[tag]);
    conn.addItems(Object.keys(variables));
    
    // Leer y subir cada 2 segundos
    setInterval(() => {
      conn.readAllItems(async (err, values) => {
        if (err) {
          console.error(`⚠️ [${plcConfig.name}] Error de lectura del PLC:`, err);
          return;
        }
        
        const payload = {
          plc_id: plcConfig.id,
          data: values,
          estatusgeneral: 'OPERATIVO',
          updated_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from('plc_realtime')
          .upsert(payload, { onConflict: 'plc_id' });
          
        if (error) {
          console.error(`❌ [${plcConfig.name}] Error subiendo datos a Supabase:`, error.message);
        } else {
          console.log(`📡 [${plcConfig.name} - ${new Date().toLocaleTimeString()}] Datos subidos a la Nube OK.`);
        }
      });
    }, 2000); // Se repite cada 2s
  });
}

// Función principal
async function iniciarSistemaCompleto() {
  console.log(`[EDGE GATEWAY ENTERPRISE] Arrancando sistema. Buscando info de ${plcIdsList.length} PLCs en la nube...`);

  // Descargamos la configuración de todos los PLCs que pasaste por lista
  const { data: plcsData, error } = await supabase
    .from('plcs')
    .select('id, name, ip, rack, slot, io_config')
    .in('id', plcIdsList);

  if (error) {
    console.error('❌ Error obteniendo configuración de los PLCs.', error.message);
    process.exit(1);
  }

  if (!plcsData || plcsData.length === 0) {
    console.error('❌ No se encontró ningún PLC en la base de datos con los IDs proporcionados en el .env');
    process.exit(1);
  }

  console.log(`📦 Se encontraron ${plcsData.length} configuraciones válidas en la nube.`);

  // Iteramos sobre todos los PLCs encontrados y levantamos un "hilo" de comunicación para cada uno
  plcsData.forEach(plcConfig => {
    arrancarHebraPLC(plcConfig);
  });
}

iniciarSistemaCompleto();
