// Test con node-snap7 — ejecutar: node test-snap7.js
const snap7 = require('node-snap7');

const client = new snap7.S7Client();
const IP   = '192.168.0.1';
const RACK = 0;
const SLOT = 1;

console.log('Conectando a', IP, '...');

client.ConnectTo(IP, RACK, SLOT, (err) => {
  if (err) {
    console.error('ERROR de conexión:', client.ErrorText(err));
    process.exit(1);
  }
  console.log('Conectado OK');

  // Leer byte Q0 (outputs) — Motor=bit2, Actuador=bit3, ActuadorDB1=bit5, MotorDB1=bit6
  client.ABRead(0, 1, (errQ, bufQ) => {
    if (errQ) {
      console.error('ERROR leyendo Q:', client.ErrorText(errQ));
    } else {
      const q = bufQ[0];
      console.log('Q byte0 raw:', q.toString(2).padStart(8, '0'));
      console.log('Motor      Q0.2:', !!(q & 0x04));
      console.log('Actuador   Q0.3:', !!(q & 0x08));
      console.log('ActuadorDB1Q0.5:', !!(q & 0x20));
      console.log('MotorDB1   Q0.6:', !!(q & 0x40));
    }

    // Leer byte M0 (memory) — Memoria1=bit4
    client.MBRead(0, 1, (errM, bufM) => {
      if (errM) {
        console.error('ERROR leyendo M:', client.ErrorText(errM));
      } else {
        const m = bufM[0];
        console.log('M byte0 raw:', m.toString(2).padStart(8, '0'));
        console.log('Memoria1   M0.4:', !!(m & 0x10));
      }

      client.Disconnect();
      process.exit(0);
    });
  });
});
