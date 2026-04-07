require('dotenv').config({ path: '.env.local' });
const nodes7 = require('nodes7');
const { createClient } = require('@supabase/supabase-js');

// 1. Configuración de Supabase (Lee de tu archivo .env.local de Next.js)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Usamos la Service Role Key para poder leer la base de datos sin estar "iniciados sesión" (Bypass RLS)
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERROR: No se encontraron las variables de entorno de Supabase.');
  console.log('Asegúrate de ejecutar este script en la misma carpeta que tu .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 2. Configuración de tu PLC Físico Múltiple
const PLC_IP = process.env.PLC_IP || '192.168.0.100';
const PLC_RACK = 0;
const PLC_SLOT = 1;

// Este es el ID de tu PLC en la base de datos de Azteq-IA. 
// Tiene que coincidir *exactamente* con el ID que genera Supabase
const PLC_ID = process.env.PLC_ID || 'bb34bcc6-9cd7-47f6-935e-eae22cba04e1'; 

const conn = new nodes7();

// Función principal asíncrona para poder usar await
async function iniciarServicio() {
  console.log(`[EDGE GATEWAY] Descargando configuración del PLC con ID: ${PLC_ID}`);
  
  // 3. Descargar configuración del PLC desde Supabase
  const { data: plcData, error } = await supabase
    .from('plcs')
    .select('ip, rack, slot, io_config')
    .eq('id', PLC_ID)
    .single();

  if (error) {
    console.error('❌ Error obteniendo configuración de la nube:', error.message);
    console.log('⚠️ Asegúrate de que el PLC_ID sea el correcto.');
    process.exit(1);
  }

  // Utilizar los valores desde la BD (por si cambiaron) o hacer fallback al env
  const finalIp = plcData?.ip || PLC_IP;
  const finalRack = plcData?.rack !== null ? plcData.rack : PLC_RACK;
  const finalSlot = plcData?.slot !== null ? plcData.slot : PLC_SLOT;

  let variables = {};
  if (plcData?.io_config && Array.isArray(plcData.io_config)) {
    plcData.io_config.forEach(tag => {
      // Reemplazamos espacios por guiones bajos para que sirva de llave segura en nodes7
      const tagName = tag.name.replace(/\s+/g, '_');
      variables[tagName] = tag.address;
    });
  }

  if (Object.keys(variables).length === 0) {
    console.warn('⚠️ No se encontraron tags de E/S configurados en la nube. Deteniendo recolector.');
    console.log('👉 Ve al dashboard web, edita el PLC y agrega las variables en "Ajustar E/S".');
    process.exit(1);
  }

  console.log('📦 Variables descargadas:', variables);
  console.log(`[EDGE GATEWAY] Conectando a PLC en ${finalIp} (Rack: ${finalRack}, Slot: ${finalSlot})...`);

  conn.initiateConnection({ port: 102, host: finalIp, rack: finalRack, slot: finalSlot, timeout: 8000 }, (err) => {
    if (typeof err !== 'undefined') {
      console.error('❌ Error Crítico: No se pudo conectar al PLC.', err);
      process.exit(1);
    }
    
    console.log('✅ ENLACE ESTABLECIDO CON EL PLC.');
    console.log('Conectando a la Nube (Supabase)...');
    
    conn.setTranslationCB((tag) => variables[tag]);
    conn.addItems(Object.keys(variables));
    
    // 4. Bucle infinito: Cada 2 segundos lee el PLC y lo inyecta a Internet
    setInterval(() => {
      conn.readAllItems(async (err, values) => {
        if (err) {
          console.error('⚠️ Error leyendo la memoria del PLC:', err);
          return;
        }
        
        // Armamos el paquete JSON que subirá a Supabase
        const payload = {
          plc_id: PLC_ID,
          data: values,
          estatusgeneral: 'OPERATIVO',
          updated_at: new Date().toISOString()
        };

        console.log(`[${new Date().toLocaleTimeString()}] 📡 PLC -> ${JSON.stringify(values)} -> Subiendo a la Nube...`);
        
        // UPSERT: Si no existe la fila la crea, si existe la sobrescribe (actualiza)
        const { error: upsertError } = await supabase
          .from('plc_realtime')
          .upsert(payload, { onConflict: 'plc_id' });
          
        if (upsertError) {
          console.error('❌ Error de red subiendo a Supabase:', upsertError.message);
        }
      });
    }, 2000); // 2000 ms = 2 segundos
  });
}

// Ejecutar el servicio
iniciarServicio();
