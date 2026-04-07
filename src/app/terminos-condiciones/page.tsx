import React from 'react';
import Link from 'next/link';

export default function TerminosCondiciones() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 font-sans transition-colors duration-200">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-indigo-600 dark:bg-indigo-800 px-8 py-10 text-white">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Términos y Condiciones</h1>
          <p className="mt-2 text-indigo-100 flex items-center">
            <span className="bg-indigo-500 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider mr-3">Vigente desde: Abril 2026</span>
          </p>
        </div>
        
        <div className="px-8 py-10 text-gray-700 dark:text-gray-300 space-y-8">
          <section className="prose dark:prose-invert max-w-none">
            <p className="text-lg leading-relaxed">
              Bienvenido a <strong>Azteq-IA</strong>. Estos Términos y Condiciones regulan el acceso y uso de nuestra plataforma, APIs, interfaces de usuario y servicios de monitoreo de PLCs e inteligencia artificial. Al acceder a nuestros servicios, usted (el "Cliente" o "Usuario") acepta estar sujeto a estos términos.
            </p>
          </section>

          <div className="space-y-6">
            <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">1. Licencia de Uso</h2>
              <p>
                Azteq-IA otorga al Cliente una licencia limitada, no exclusiva, intransferible y revocable para acceder y utilizar nuestra plataforma con fines comerciales internos. Queda estrictamente prohibida la ingeniería inversa, reventa o cualquier uso que comprometa la integridad de nuestros sistemas de IA o algoritmos propietarios.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">2. Responsabilidad de Infraestructura Industrial</h2>
              <p>
                El Usuario comprende que Azteq-IA interactúa con dispositivos de hardware físicos (PLCs) y procesos industriales. Si bien nuestra IA está diseñada para optimizar y sugerir parámetros operativos, <strong>el Cliente es el único responsable final de la seguridad física de su planta, maquinaria y personal</strong>. Azteq-IA no se hace responsable por daños a la maquinaria, lucro cesante o accidentes derivados de la implementación automatizada de parámetros generados por la plataforma sin supervisión humana adecuada.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">3. Nivel de Servicio (SLA) y Disponibilidad</h2>
              <p>
                Nos esforzamos por mantener una disponibilidad del 99.9% en nuestros servicios en la nube. Sin embargo, las interrupciones debidas a mantenimiento programado, fallos de proveedores de red de terceros o causas de fuerza mayor no se considerarán incumplimiento de estos términos. El monitoreo local ("edge computing") continuará operando sujeto a las capacidades de hardware del Cliente.
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">4. Propiedad Intelectual</h2>
              <p>
                Todo el código, algoritmos de IA, interfaces, logotipos y documentación de Azteq-IA son propiedad exclusiva de Azteq-IA. Los datos industriales generados por el Cliente pertenecen al Cliente, pero éste otorga a Azteq-IA una licencia para procesarlos con el fin de prestar el servicio.
              </p>
            </div>
          </div>

          <div className="pt-8 mt-8 border-t border-gray-200 dark:border-gray-700 text-center">
            <Link href="/" className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors inline-block">
              Acepto y Entiendo - Volver
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
