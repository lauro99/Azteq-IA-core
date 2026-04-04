'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AyudaConexionPlanta() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'general' | 'siemens' | 'ab' | 'delta'>('general');

  const tabClasses = (tab: string) => `
    px-4 py-2 border-b-2 font-medium text-sm transition-colors cursor-pointer whitespace-nowrap
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
            <h1 className="text-3xl font-bold text-[#E8C673]">Guía Completa de Conexión Universal</h1>
            <p className="text-gray-400 mt-2">Instrucciones para enlazar flotas enteras y equipos industriales a Azteq IA.</p>
          </div>
        </div>

        {/* Notificación Importante */}
        <div className="bg-[#1A1A1A] border-l-4 border-[#E8C673] p-4 mb-8 rounded-r-lg">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-[#E8C673] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-semibold text-[#E8C673]">Habilitación de Protocolos Externos</h3>
              <p className="text-gray-400 text-sm mt-1">
                Recuerda que para establecer cualquier conexión mediante el Driver Agnóstico, el equipo debe tener habilitado el acceso remoto (PUT/GET para Siemens, Ethernet/IP nativo para AB o Modbus-TCP activado). Azteq IA requiere visibilidad de red hacia la IP/Puerto del PLC desde su servidor nodal.
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-800 mb-8 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-700">
          <nav className="-mb-px flex space-x-6">
            <button onClick={() => setActiveTab('general')} className={tabClasses('general')}>Conceptos Generales (Universal)</button>
            <button onClick={() => setActiveTab('siemens')} className={tabClasses('siemens')}>Siemens (S7)</button>
            <button onClick={() => setActiveTab('ab')} className={tabClasses('ab')}>Allen-Bradley</button>
            <button onClick={() => setActiveTab('delta')} className={tabClasses('delta')}>Delta / Omron / Keyence / Modbus</button>
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
                <li><strong className="text-white">Tipo de Dato y Unidad:</strong> Si es un Bit (ON/OFF), un Entero (número), etc. Para números, ingresa su unidad de medida (ej. °C, PSI, bar). Para la casilla de Unidad en tipos booleanos (Bits), puedes usar textos que representen sus estados como "(ON/OFF)", "Abierto/Cerrado" o dejarlo en blanco.</li>
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
            {/* Tabla de Errores Comunes */}
            <section className="bg-[#1A1A1A] border border-red-900/40 rounded-lg p-6 mt-8">
              <h2 className="text-xl font-bold mb-4 text-red-400 flex items-center gap-2">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                Todos los Errores y Soluciones
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left">
                  <thead className="bg-[#1A2624] text-red-300 uppercase text-xs border-b border-red-900/30">
                    <tr>
                      <th className="py-3 px-4 font-bold">Código/Error</th>
                      <th className="py-3 px-4 font-bold">Descripción</th>
                      <th className="py-3 px-4 font-bold">Solución</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-l-4 border-red-400 bg-red-950/10">
                      <td className="py-2 px-4 font-mono">ERR-NOIP</td>
                      <td className="py-2 px-4">Falta la dirección IP del PLC</td>
                      <td className="py-2 px-4">Verifica que hayas ingresado la IP correcta en el formulario de conexión.</td>
                    </tr>
                    <tr className="border-l-4 border-red-400 bg-red-950/10">
                      <td className="py-2 px-4 font-mono">ERR-CONN</td>
                      <td className="py-2 px-4">Error de conexión en puerto industrial</td>
                      <td className="py-2 px-4">Revisa que el PLC esté encendido, conectado a la red y que el puerto esté abierto (ej. 102 para Siemens, 502 para Modbus).</td>
                    </tr>
                    <tr className="border-l-4 border-red-400 bg-red-950/10">
                      <td className="py-2 px-4 font-mono">ERR-READ</td>
                      <td className="py-2 px-4">Error leyendo bus de datos</td>
                      <td className="py-2 px-4">Verifica que la dirección de memoria/tag exista y que el PLC esté respondiendo correctamente.</td>
                    </tr>
                    <tr className="border-l-4 border-red-400 bg-red-950/10">
                      <td className="py-2 px-4 font-mono">ERR-TIMEOUT</td>
                      <td className="py-2 px-4">Tiempo de espera agotado al intentar conectar con el PLC</td>
                      <td className="py-2 px-4">Verifica la conexión de red y que el PLC esté accesible. Aumenta el tiempo de espera si es necesario.</td>
                    </tr>
                    <tr className="border-l-4 border-red-400 bg-red-950/10">
                      <td className="py-2 px-4 font-mono">ERR-AUTH</td>
                      <td className="py-2 px-4">Error de autenticación o acceso denegado</td>
                      <td className="py-2 px-4">Revisa las credenciales y permisos de acceso al PLC.</td>
                    </tr>
                    <tr className="border-l-4 border-red-400 bg-red-950/10">
                      <td className="py-2 px-4 font-mono">ERR-TAG</td>
                      <td className="py-2 px-4">Tag o dirección de memoria no encontrada</td>
                      <td className="py-2 px-4">Verifica que el nombre del tag o la dirección sean correctos y existan en el PLC.</td>
                    </tr>
                    <tr className="border-l-4 border-red-400 bg-red-950/10">
                      <td className="py-2 px-4 font-mono">ERR-PARSE</td>
                      <td className="py-2 px-4">Error al interpretar la respuesta del PLC</td>
                      <td className="py-2 px-4">Asegúrate de que el PLC esté enviando datos en el formato esperado.</td>
                    </tr>
                    <tr className="border-l-4 border-yellow-400 bg-yellow-900/10">
                      <td className="py-2 px-4 font-mono">WARN-201</td>
                      <td className="py-2 px-4">Latencia elevada en red EtherNet/IP</td>
                      <td className="py-2 px-4">Revisa el cableado, switches y la calidad de la red industrial.</td>
                    </tr>
                    <tr className="border-l-4 border-yellow-400 bg-yellow-900/10">
                      <td className="py-2 px-4 font-mono">WARN-PLC-REBOOT</td>
                      <td className="py-2 px-4">El PLC fue reiniciado inesperadamente</td>
                      <td className="py-2 px-4">Verifica la causa del reinicio y revisa el historial de eventos del PLC.</td>
                    </tr>
                    <tr className="border-l-4 border-green-400 bg-green-900/10">
                      <td className="py-2 px-4 font-mono">RES-102</td>
                      <td className="py-2 px-4">Sensor de límite restablecido</td>
                      <td className="py-2 px-4">No requiere acción. El sistema detectó que el error fue resuelto.</td>
                    </tr>
                    <tr className="border-l-4 border-red-400 bg-red-950/10">
                      <td className="py-2 px-4 font-mono">ERR-UNSUPPORTED</td>
                      <td className="py-2 px-4">Protocolo o modelo de PLC no soportado</td>
                      <td className="py-2 px-4">Consulta la documentación para ver los modelos soportados o contacta a soporte técnico.</td>
                    </tr>
                    <tr className="border-l-4 border-red-400 bg-red-950/10">
                      <td className="py-2 px-4 font-mono">ERR-EXC</td>
                      <td className="py-2 px-4">Excepción de Servidor</td>
                      <td className="py-2 px-4">Contacta a soporte técnico. Puede ser un error interno inesperado.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
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

              <h3 className="font-bold text-lg mb-3">Pasos de Conexión (Paso a paso)</h3>
              <div className="bg-[#1A1A1A] p-4 rounded-md mb-6 relative">
                <span className="absolute top-2 left-2 text-xs font-bold text-gray-500 uppercase">CONFIGURACIÓN EN STUDIO 5000</span>
                <ol className="list-decimal list-inside text-gray-400 space-y-4 mt-4">
                  <li>
                    <strong>Abre tu proyecto</strong> en el software <em>Studio 5000 Logix Designer</em> en tu computadora.
                  </li>
                  <li>
                    <strong>Verifica los permisos de tus Variables (Tags):</strong> Ve a la tabla de 'Controller Tags'. Busca la columna llamada <em>"External Access"</em>. Asegúrate de que las variables que quieres leer con la Inteligencia Artificial digan <strong>"Read/Write"</strong> o <strong>"Read Only"</strong>. Si dicen "None", Azteq IA no podrá verlas.
                  </li>
                  <li>
                    <strong>Anota la Dirección IP:</strong> Identifica qué IP tiene asignada la tarjeta de red de tu PLC (por ejemplo, 192.168.1.50). Esta es la "dirección de casa" a la que Azteq IA irá a recopilar los datos.
                  </li>
                  <li>
                    <strong>Identifica el Slot del CPU:</strong> En los chasis de Allen-Bradley, los módulos se conectan en ranuras (slots) numeradas. El CPU casi siempre está en el <strong>Slot 0</strong>, pero verifica de forma física o en el software en qué número de ranura está.
                  </li>
                  <li>
                    <strong>¡Conecta en Azteq IA!:</strong> Ve a la página de conexión en nuestra plataforma, selecciona 'Allen-Bradley', ingresa la IP y el Slot que obtuviste. ¡Y listo! El sistema hará toda la magia de extracción automáticamente.
                  </li>
                </ol>
              </div>

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
              <h2 className="text-xl font-bold mb-4 text-[#E8C673]">Conexión Modbus TCP (Delta, Keyence, Omron, Mitsubishi, Fanuc)</h2>
              <p className="text-gray-300 mb-4">
                El protocolo universal Modbus-TCP es el estándar industrial usado por la extensa mayoría de las marcas orientales (Mitsubishi, Keyence, Fanuc, Omron y Delta). Para configurar la telemetría, el equipo debe exponerse como Servidor/Esclavo Modbus (normalmente en el puerto TCP 502).
              </p>

              <div className="bg-[#1A1A1A] p-4 rounded-md mb-6 relative">
                <span className="absolute top-2 left-2 text-xs font-bold text-gray-500 uppercase">PASOS DE CONEXIÓN Y PRERREQUISITOS</span>
                <ol className="list-decimal list-inside text-gray-400 space-y-4 mt-4">
                  <li>
                    <strong>Entiende el concepto Modbus:</strong> Imagina que tu PLC es un <em>"Servidor"</em>. Él tiene la información. Azteq IA será el <em>"Cliente"</em> que va a ir a pedirle esa información a través de la red (LAN/WiFi).
                  </li>
                  <li>
                    <strong>Habilita el Servidor Modbus (Depende de tu marca):</strong> Tú tienes que abrir la puerta en el software de la computadora para que Azteq IA pueda entrar.
                    <ul className="list-disc list-inside ml-6 mt-2 space-y-2 text-sm">
                      <li><strong>Mitsubishi / Keyence:</strong> En el software, ve a los parámetros de red (Network Params) del canal Ethernet y enciende la casilla de <em>Modbus TCP Server</em>.</li>
                      <li><strong>Fanuc:</strong> Necesitas activar la función <em>Modbus/TCP Client/Server</em> dentro de las opciones del robot, o tener la licencia requerida (SNPX).</li>
                      <li><strong>Delta / Omron:</strong> Usa su software base, ponle una IP fija al PLC y busca un botón o configuración para aceptar peticiones Modbus TCP.</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Identifica el Puerto de Red:</strong> Modbus TCP usa un "túnel" digital que se llama puerto. Casi en todo el mundo, la puerta para entrar en Modbus es siempre el número <strong>502</strong>.
                  </li>
                  <li>
                    <strong>Conoce el "Esclavo" (Slave ID):</strong> En Modbus, de nuevo, a los equipos a veces se les llama "esclavo". Y cada esclavo tiene un número. Por defecto, cuando habilitas la red en el paso dos, ese número será <strong>1</strong>.
                  </li>
                  <li>
                    <strong>¡Conecta en Azteq IA!:</strong> En la plataforma, añade la Dirección IP asignada, marca el Puerto 502, y asegura que el ID de Esclavo (Slave ID) sea 1. ¡Apaga y vámonos! Estarás viendo datos en tiempo real.
                  </li>
                </ol>
              </div>

              <h3 className="font-bold text-lg mb-3">Mapeo Hexadecimal / Sintaxis de Registros</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-300">
                  <thead className="bg-[#1A1A1A] text-gray-400 uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-lg">Tipo Modbus</th>
                      <th className="px-4 py-3">Dirección Base (Sintaxis)</th>
                      <th className="px-4 py-3 rounded-tr-lg">Acceso</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    <tr>
                      <td className="px-4 py-3">Bobinas (Coils - R/W)</td>
                      <td className="px-4 py-3 font-mono text-[#E8C673]">00001 / 0xxxx</td>
                      <td className="px-4 py-3">Lectura/Escritura (Bits)</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">Entradas Discretas (Discrete Inputs - R)</td>
                      <td className="px-4 py-3 font-mono text-[#E8C673]">10001 / 1xxxx</td>
                      <td className="px-4 py-3">Sólo Lectura (Bits)</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">Registro de Entrada (Input Reg - R)</td>
                      <td className="px-4 py-3 font-mono text-[#E8C673]">30001 / 3xxxx</td>
                      <td className="px-4 py-3">Lectura (Words) ej. Sensores</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">Registro de Retención (Holding - R/W)</td>
                      <td className="px-4 py-3 font-mono text-[#E8C673]">40001 / 4xxxx</td>
                      <td className="px-4 py-3">Lectura/Escritura (Words) ej. SetPoints</td>
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