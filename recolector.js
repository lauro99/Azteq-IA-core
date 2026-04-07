require('dotenv').config({ path: '.env.local' });
const nodes7 = require('nodes7');
const { createClient } = require('@supabase/supabase-js');

// 1. Configuración de Supabase (Lee de tu archivo .env.local de Next.js)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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
// Por ahora usaremos uno de prueba genérico, luego lo haremos dinámico.
const PLC_ID = 'plc-siemens-local-01'; 

const conn = new nodes7();

// 3. Tus memorias a leer (Mapeo)
// En la versión final, este script descargará esto automáticamente desde Supabase.
const variables = {
  Foco_Activo: 'Q0.2',
  Boton_Arranque: 'M0.4',
  Contador: 'MW10' // Ejemplo de tu contador
};

console.log(`[EDGE GATEWAY] Iniciando servicio. Conectando a PLC en ${PLC_IP}...`);

conn.initiateConnection({ port: 102, host: PLC_IP, rack: PLC_RACK, slot: PLC_SLOT, timeout: 8000 }, (err) => {
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
      const { error } = await supabase
        .from('plc_realtime')
        .upsert(payload, { onConflict: 'plc_id' });
        
      if (error) {
        console.error('❌ Error de red subiendo a Supabase:', error.message);
      }
    });
  }, 2000); // 2000 ms = 2 segundos
});
