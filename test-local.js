// ====== TESTADOR DE PLC PARA AZTEQ-IA (OFFLINE / ONLINE) ======
// Ejecutar en consola con: node test-local.js
// Funciona idéntico sea conexión LAN (cable directo) o VPN.
const snap7 = require('node-snap7');
const s7client = new snap7.S7Client();

// 1️⃣ CONFIGURACIÓN DE RED (¡El único lugar que cambia!)
// Si estás LOCAL con cable directo, pon la IP del PLC en tu red: '192.168.0.10'
// Si estuvieras lejos por VPN, pondrías la IP de la VPN: ej. '10.8.0.2'
const PLC_IP = '192.168.0.1' // <- PON AQUÍ LA IP DE TU PLC SIEMENS
const RACK   = 0;
const SLOT   = 1;  // Para S7-1200 / S7-1500 suele ser 1. Para S7-300 suele ser 2.

console.log(`\n[AZTEQ-IA] Iniciando Protocolo de Sincronización...`);
console.log(`[+] Apuntando al Nodo: ${PLC_IP} (Rack: ${RACK}, Slot: ${SLOT})`);

// 2️⃣ CONEXIÓN DIRECTA
s7client.ConnectTo(PLC_IP, RACK, SLOT, function(err) {
    if(err) {
        console.error('\n❌ ERROR CRÍTICO. El enlace falló.');
        console.error('MOTIVO:', s7client.ErrorText(err));
        console.log('\n--- CHECKLIST DE DIAGNÓSTICO OFFLINE ---');
        console.log('1. Revisa tu TCP/IPv4. ¿Tu IP está en la misma subred? (Ej: 192.168.0.50)');
        console.log('2. TIA Portal -> PLC -> Propiedades -> "Permitir acceso PUT/GET" ¿Está activado?');
        console.log('3. ¿Pusiste correctamente la IP del PLC en test-local.js?');
        return;
    }
    
    console.log('\n✅ ENLACE ESTABLECIDO (TCP/IP CONNECTED)');

    // 3️⃣ SACAR INFO BÁSICA DEL PLC
    const info = s7client.ExecTimeout(() => s7client.GetCpuInfo(), 2000);
    if(info) {
        console.log(`[+] Hardware CPU  : ${info.ModuleTypeName}`);
        console.log(`[+] Serial Number : ${info.SerialNumber}`);
    }

    // 4️⃣ LEER UN DATO DE PRUEBA (Memoria M0)
    console.log('\nExtrayendo registros de prueba (Memoria M0)...');
    s7client.MBRead(0, 1, function(err, buffer) {
        if(err) {
            console.error('❌ Error leyendo memoria:', s7client.ErrorText(err));
            console.log('NOTA: Asegúrate de recompilar tu código en TIA Portal.');
        } else {
            const rawByte = buffer[0];
            console.log(`✅ LECTURA EXITOSA. M0 Byte raw: ${rawByte.toString(2).padStart(8, '0')}`);
            console.log(`[BIT 0] (M0.0) -> ${!!(rawByte & 0x01)}`);
            console.log(`[BIT 1] (M0.1) -> ${!!(rawByte & 0x02)}`);
        }

        // Siempre cerrar la conexión al terminar
        s7client.Disconnect();
        console.log('\n[AZTEQ-IA] Conexión finalizada de manera segura.');
    });
});
