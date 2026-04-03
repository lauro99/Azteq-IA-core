'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AyudaConexionPlanta() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'general' | 'siemens' | 'ab' | 'delta'>('general');

  const tabClasses = (tab: string) => `
    px-4 py-2 border-b-2 font-medium text-sm transition-colors
    ${activeTab === tab 
      ? 'border-[#E8C673] text-[#E8C673]' 
      : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600'}
  `;

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-[#1A1A1A] rounded-lg transition-colors border border-gray-800"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-3xl font-bold">Guía Completa de Conexión</h1>
            <p className="text-gray-400 mt-2">Instrucciones para enlazar equipos industriales a Azteq IA.</p>
          </div>
        </div>

        {/* Notificación Importante */}
        <div className="bg-[#1A1A1A] border-l-4 border-[#E8C673] p-4 mb-8 rounded-r-lg">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-[#E8C673] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-semibold text-[#E8C673]">El Enlace Ritual</h3>
              <p className="text-gray-400 text-sm mt-1">
                Recuerda que para establecer la conexión, tu equipo debe estar configurado para permitir el acceso externo (PUT/GET en Siemens, Node-RED, Kepware, etc.) y Azteq IA debe tener visibilidad de red hacia la IP de tu PLC.
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-800 mb-8">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            <button onClick={() => setActiveTab('general')} className={tabClasses('general')}>Conceptos Generales</button>
            <button onClick={() => setActiveTab('siemens')} className={tabClasses('siemens')}>Siemens (S7)</button>
            <button onClick={() => setActiveTab('ab')} className={tabClasses('ab')}>Allen-Bradley</button>
            <button onClick={() => setActiveTab('delta')} className={tabClasses('delta')}>Delta / Modbus</button>
          </nav>
        </div>

        {/* Contenido General */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            <section className="bg-[#111] border border-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4 text-[#E8C673]">Entendiendo el Mapeo (I/O)</h2>
              <p className="text-gray-300 mb-4">
                En Azteq IA, no solo conectas el PLC, sino que "despiertas" sus memorias para que la IA pueda leerlas e interpretarlas en contexto. Para esto, necesitas definir 3 cosas por cada variable:
              </p>
              <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4">
                <li><strong className="text-white">ID Memoria (Address):</strong> La dirección física en el PLC (ej. DB1,X0.0 o 40001).</li>
                <li><strong className="text-white">Tipo de Dato:</strong> Si es un Bit (ON/OFF), un Entero (número), etc.</li>
                <li><strong className="text-white">Descripción Semántica:</strong> Esto es <span className="text-[#E8C673] font-semibold">crucial</span>. La IA no sabe qué es "M0.0". Debes decirle: <em>"Bomba Principal de Enfriamiento"</em>.</li>
              </ul>
            </section>
            
            <section className="bg-[#111] border border-gray-800 rounded-lg p-6 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-[#1A1A1A] rounded-full flex items-center justify-center mb-4 border border-gray-800">
                    <svg className="w-8 h-8 text-[#E8C673]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                </div>
                <h3 className="font-bold text-lg mb-2">Estados de la Memoria (Tags)</h3>
                <p className="text-gray-400 text-sm max-w-md">
                    Al mapear, verás un estado: <strong>"Leyendo..."</strong> significa que el sistema está intentando conectar. <strong>"Activo" (verde)</strong> indica que la variable se está refrescando en tiempo real.
                </p>
            </section>
          </div>
        )}

        {/* Contenido Siemens */}
        {activeTab === 'siemens' && (
          <div className="space-y-6">
             <section className="bg-[#111] border border-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4 text-[#E8C673]">Conexión Siemens S7 (S7-1200, S7-1500, S7-300)</h2>
              <p className="text-gray-300 mb-4">
                Para que Azteq IA pueda leer las variables de tu PLC Siemens, debes habilitar el acceso PUT/GET en el TIA Portal.
              </p>
              
              <div className="bg-[#1A1A1A] p-4 rounded-md mb-6 relative">
                <span className="absolute top-2 left-2 text-xs font-bold text-gray-500 uppercase">TIA PORTAL SETUP</span>
                <ol className="list-decimal list-inside text-gray-400 space-y-3 mt-4">
                  <li>Ve a las Propiedades de la CPU.</li>
                  <li>Navega a: <span className="text-white">Protection & Security {'>'} Connection mechanisms</span>.</li>
                  <li>Marca la casilla: <strong className="text-[#E8C673]">Permit access with PUT/GET communication from remote partner</strong>.</li>
                  <li><strong className="text-white">Importante:</strong> Si usas Data Blocks (DBs), ve a las propiedades del DB y <strong>DESMARCA</strong> la opción "Optimized block access" (debe ser Standard).</li>
                </ol>
              </div>

              <h3 className="font-bold text-lg mb-3">Sintaxis de Memorias (Ejemplos)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-300">
                  <thead className="bg-[#1A1A1A] text-gray-400 uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-lg">Tipo</th>
                      <th className="px-4 py-3">ID Memoria (Sintaxis)</th>
                      <th className="px-4 py-3 rounded-tr-lg">Descripción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    <tr>
                      <td className="px-4 py-3">Marcas (Merker)</td>
                      <td className="px-4 py-3 font-mono text-[#E8C673]">M0.0, M1.5</td>
                      <td className="px-4 py-3">Bits internos estándar.</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">Data Block (Bit)</td>
                      <td className="px-4 py-3 font-mono text-[#E8C673]">DB1,X2.0</td>
                      <td className="px-4 py-3">Bit en el Byte 2 del DB1.</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">Data Block (Entero)</td>
                      <td className="px-4 py-3 font-mono text-[#E8C673]">DB5,INT10</td>
                      <td className="px-4 py-3">Entero (16bits) en el Byte 10 del DB5.</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">Data Block (Real)</td>
                      <td className="px-4 py-3 font-mono text-[#E8C673]">DB2,REAL4</td>
                      <td className="px-4 py-3">Flotante (32bits) en el Byte 4 del DB2.</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">Inputs / Outputs</td>
                      <td className="px-4 py-3 font-mono text-[#E8C673]">I0.1 / Q0.2</td>
                      <td className="px-4 py-3">Entradas y salidas físicas.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* Contenido Allen-Bradley */}
        {activeTab === 'ab' && (
          <div className="space-y-6">
             <section className="bg-[#111] border border-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4 text-[#E8C673]">Conexión Allen-Bradley (ControlLogix, CompactLogix)</h2>
              <p className="text-gray-300 mb-4">
                Azteq IA lee directamente los "Tags" (nombres simbólicos) de los PLCs Allen-Bradley mediante Ethernet/IP. No necesitas direcciones de memoria físicas, sólo los nombres exactos definidos en Studio 5000.
              </p>

              <h3 className="font-bold text-lg mb-3">Sintaxis de Memorias (Ejemplos)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-300">
                  <thead className="bg-[#1A1A1A] text-gray-400 uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-lg">Tipo</th>
                      <th className="px-4 py-3">ID Memoria (Tag Name)</th>
                      <th className="px-4 py-3 rounded-tr-lg">Notas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    <tr>
                      <td className="px-4 py-3">Tag Global</td>
                      <td className="px-4 py-3 font-mono text-[#E8C673]">Start_Button</td>
                      <td className="px-4 py-3">Un Tag global a nivel del controlador.</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">Miembro de una Estructura (UDT)</td>
                      <td className="px-4 py-3 font-mono text-[#E8C673]">Motor_1.Running</td>
                      <td className="px-4 py-3">Usa un punto `.` para acceder a miembros.</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">Arreglos (Arrays)</td>
                      <td className="px-4 py-3 font-mono text-[#E8C673]">Temperatures[5]</td>
                      <td className="px-4 py-3">Usa corchetes `[]` para los índices.</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">Tag de Programa (Program Tags)</td>
                      <td className="px-4 py-3 font-mono text-[#E8C673]">Program:MainProgram.MyTag</td>
                      <td className="px-4 py-3">Prefijo `Program:NombrePrograma.` (Raramente usado si todo es global).</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* Contenido Delta / Modbus */}
        {activeTab === 'delta' && (
          <div className="space-y-6">
            <section className="bg-[#111] border border-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4 text-[#E8C673]">Conexión Modbus TCP (Delta, Schneider, y otros)</h2>
              <p className="text-gray-300 mb-4">
                Para PLCs Delta o cualquier equipo que soporte Modbus TCP, debes especificar la dirección del registro. Azteq IA soporta la nomenclatura tradicional de 5 o 6 dígitos.
              </p>

              <div className="bg-[#1A1A1A] p-4 rounded-md mb-6">
                <p className="text-sm text-gray-400">
                  Asegúrate de configurar el PLC con una IP fija, habilitar el servidor Modbus TCP (normalmente puerto 502) y conocer el <strong>ID de Unidad (Slave ID)</strong>, que usualmente es 1.
                </p>
              </div>

              <h3 className="font-bold text-lg mb-3">Sintaxis de Registros (Ejemplos)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-300">
                  <thead className="bg-[#1A1A1A] text-gray-400 uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-lg">Tipo Modbus</th>
                      <th className="px-4 py-3">ID Memoria (Sintaxis)</th>
                      <th className="px-4 py-3 rounded-tr-lg">Acceso</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    <tr>
                      <td className="px-4 py-3">Coils (0xxxx)</td>
                      <td className="px-4 py-3 font-mono text-[#E8C673]">00001 / 00010</td>
                      <td className="px-4 py-3">Lectura/Escritura (Bits)</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">Discrete Inputs (1xxxx)</td>
                      <td className="px-4 py-3 font-mono text-[#E8C673]">10001 / 10020</td>
                      <td className="px-4 py-3">Sólo Lectura (Bits)</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">Input Registers (3xxxx)</td>
                      <td className="px-4 py-3 font-mono text-[#E8C673]">30001 / 30100</td>
                      <td className="px-4 py-3">Sólo Lectura (Palabras de 16-bits)</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">Holding Registers (4xxxx)</td>
                      <td className="px-4 py-3 font-mono text-[#E8C673]">40001 / 40150</td>
                      <td className="px-4 py-3">Lectura/Escritura (Palabras de 16-bits)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}