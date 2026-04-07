// Test directo de nodes7 — ejecutar con: node test-plc.mjs
import nodes7 from 'nodes7';

const IP   = '192.168.0.100';
const PORT = 102;
const RACK = 0;
const SLOT = 1;

const conn = new nodes7({ debug: true });

const params = { host: IP, port: PORT, rack: RACK, slot: SLOT, timeout: 8000 };

console.log('Conectando a', IP, '...');

conn.initiateConnection(params, (err) => {
  if (err) {
    console.error('ERROR de conexión:', err);
    process.exit(1);
  }
  console.log('Conectado OK. isoConnectionState =', conn.isoConnectionState);

  conn.setTranslationCB((tag) => {
    const map = { Motor: 'Q0.2', Actuador: 'Q0.3', Memoria1: 'M0.4' };
    return map[tag] || tag;
  });

  conn.addItems(['Motor', 'Actuador', 'Memoria1']);

  console.log('Leyendo variables...');
  conn.readAllItems((anErr, values) => {
    console.log('err:', anErr);
    console.log('values:', values);
    conn.dropConnection();
    process.exit(0);
  });
});
