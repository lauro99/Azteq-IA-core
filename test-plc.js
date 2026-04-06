// Test directo de nodes7 — ejecutar con: node test-plc.js
const nodes7 = require('./node_modules/nodes7');

const IP   = '192.168.0.1';
const PORT = 102;
const RACK = 0;
const SLOT = 1;

const conn = new nodes7({ debug: true });

// PG type (0x0101) para S7-1200 — OP type (0x0201) es rechazado con error 0x8104
const params = { host: IP, port: PORT, rack: RACK, slot: SLOT, timeout: 8000,
  localTSAP: 0x0100, remoteTSAP: 0x0101 };

console.log('Conectando a', IP, '...');

conn.initiateConnection(params, (err) => {
  if (err) {
    console.error('ERROR de conexión:', err);
    process.exit(1);
  }
  console.log('Conectado OK. isoConnectionState =', conn.isoConnectionState);

  conn.setTranslationCB((tag) => {
    const map = { Motor: 'DB1,X0.0', Actuador: 'DB1,X0.1', Memoria1: 'DB1,X0.2' };
    return map[tag] || tag;
  });

  conn.addItems(['Motor', 'Actuador', 'Memoria1']);

  console.log('Leyendo variables...');
  conn.readAllItems((anErr, values) => {
    console.log('err:', anErr);
    console.log('values:', JSON.stringify(values, null, 2));
    conn.dropConnection();
    process.exit(0);
  });
});
