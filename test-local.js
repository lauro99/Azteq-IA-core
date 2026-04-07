// ====== TESTADOR DE PLC PARA AZTEQ-IA (OFFLINE / ONLINE) ======
// Ejecutar en consola con: node test-local.js
// Funciona idéntico sea conexión LAN (cable directo) o VPN.
const snap7 = require('node-snap7');
const s7client = new snap7.S7Client();

// 1️⃣ CONFIGURACIÓN DE RED (¡El único lugar que cambia!)
// Si estás LOCAL con cable directo, pon la IP del PLC en tu red: '192.168.0.241'
// Si estuvieras lejos por VPN, pondrías la IP de la VPN: ej. '10.8.0.2'
const PLC_IP = '192.168.0.100' // <- PON AQUÍ LA IP DE TU PLC SIEMENS
const RACK   = 0;
const SLOT   = 1;  // Para S7-1200 / S7-1500 suele ser 1. Para S7-300 suele ser 2.

console.log(`\n[AZTEQ-IA] Iniciando Protocolo de Sincronización...`);
console.log(`[+] Apuntando al Nodo: ${PLC_IP} (Rack: ${RACK}, Slot: ${SLOT})`);

// 2️⃣ CONEXIÓN DIRECTA
// Volvemos al tipo de conexión PG (0x01) que es el estándar para S7-1200
s7client.SetConnectionType(0x01); // 1 = PG connection

s7client.ConnectTo(PLC_IP, RACK, SLOT, function(err) {
    if(err) {
        console.error('\n❌ ERROR CRÍTICO. El enlace falló.');
        console.error('MOTIVO:', s7client.ErrorText(err));
        console.log('\n--- CHECKLIST DE DIAGNÓSTICO OFFLINE ---');
        console.log('1. Revisa tu TCP/IPv4. ¿Tu IP está en la misma subred? (Ej: 192.168.0.241)');
        console.log('2. TIA Portal -> PLC -> Propiedades -> "Permitir acceso PUT/GET" ¿Está activado?');
        console.log('3. ¿Pusiste correctamente la IP del PLC en test-local.js?');
        return;
    }
    
    console.log('\n✅ ENLACE ESTABLECIDO (TCP/IP CONNECTED)');

    // 3️⃣ SACAR INFO BÁSICA DEL PLC Y LEYER DATOS
    s7client.GetCpuInfo(function(err, info) {
        if(!err && info) {
            console.log(`[+] Hardware CPU  : ${info.ModuleTypeName}`);
            console.log(`[+] Serial Number : ${info.SerialNumber}`);
        } else {
            console.log(`[!] No se pudo obtener la info de la CPU, pero la conexión está activa.`);
        }

        // 4️⃣ LEER MEMORIA M0 Y Q0
        console.log('\nExtrayendo registros de prueba (Memoria M0 y Q0)...');
        
        // Primero leemos el byte M0
        s7client.MBRead(0, 1, function(err, bufferM) {
            if(err) {
                console.error('❌ Error leyendo memoria M:', s7client.ErrorText(err));
                console.log('NOTA: Asegúrate de habilitar PUT/GET en TIA Portal.');
                s7client.Disconnect();
            } else {
                const byteM0 = bufferM[0];
                console.log(`✅ LECTURA M0 EXITOSA. M0 Byte raw: ${byteM0.toString(2).padStart(8, '0')}`);
                // M0.4 corresponde al 5to bit (00010000 en binario, es decir 0x10 en hex)
                console.log(`[M0.4] -> ${!!(byteM0 & 0x10)}`);

                // Luego leemos el byte Q0 (Salidas / Outputs / Ausgänge)
                s7client.ABRead(0, 1, function(err, bufferQ) {
                    if(err) {
                        console.error('❌ Error leyendo salidas Q:', s7client.ErrorText(err));
                    } else {
                        const byteQ0 = bufferQ[0];
                        console.log(`✅ LECTURA Q0 EXITOSA. Q0 Byte raw: ${byteQ0.toString(2).padStart(8, '0')}`);
                        // Q0.2 corresponde al 3er bit (00000100 en binario, es decir 0x04 en hex)
                        console.log(`[Q0.2] -> ${!!(byteQ0 & 0x04)}`);
                    }

                    // Siempre cerrar la conexión al terminar todo
                    s7client.Disconnect();
                    console.log('\n[AZTEQ-IA] Conexión finalizada de manera segura.');
                });
            }
        });
    });
});
