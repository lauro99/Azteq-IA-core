import React from 'react';
import Link from 'next/link';

export default function PoliticaPrivacidad() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 font-sans transition-colors duration-200">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-blue-600 dark:bg-blue-800 px-8 py-10 text-white">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Política de Privacidad</h1>
          <p className="mt-2 text-blue-100 flex items-center">
            <span className="bg-blue-500 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider mr-3">Última actualización: Abril 2026</span>
          </p>
        </div>
        
        <div className="px-8 py-10 text-gray-700 dark:text-gray-300 space-y-8">
          <section className="prose dark:prose-invert max-w-none">
            <p className="text-lg leading-relaxed">
              En <strong>Azteq-IA</strong>, valoramos profundamente su privacidad y estamos comprometidos a proteger sus datos personales. Esta Política de Privacidad describe cómo recopilamos, usamos, procesamos y compartimos su información cuando utiliza nuestros servicios de inteligencia artificial y control industrial.
            </p>
          </section>

          <div className="space-y-6">
            <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <svg className="w-6 h-6 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                1. Información que Recopilamos
              </h2>
              <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
                <li><strong>Información de contacto:</strong> Nombre, dirección de correo electrónico, nombre de la empresa y número de teléfono.</li>
                <li><strong>Datos de la plataforma:</strong> Telemetría de PLCs, configuraciones de equipos industriales, logs de operaciones y datos procesados por nuestros modelos de IA.</li>
                <li><strong>Datos de uso:</strong> Direcciones IP, tipo de navegador, sistema operativo y comportamiento de navegación dentro de nuestra plataforma.</li>
              </ul>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <svg className="w-6 h-6 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                2. Uso de la Información
              </h2>
              <p className="mb-2">Utilizamos la información recopilada para:</p>
              <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
                <li>Proporcionar, operar y mantener nuestros servicios de inteligencia artificial industrial.</li>
                <li>Mejorar y personalizar la experiencia del usuario.</li>
                <li>Entrenar y optimizar nuestros modelos de IA (utilizando datos anonimizados, a menos que se acuerde expresamente lo contrario).</li>
                <li>Garantizar la seguridad y protección de nuestras plataformas e infraestructura de los clientes.</li>
                <li>Cumplir con obligaciones legales y normativas aplicables.</li>
              </ul>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <svg className="w-6 h-6 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                3. Seguridad de los Datos e Inteligencia Artificial
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                Implementamos medidas de seguridad técnicas e institucionales de nivel industrial (incluyendo encriptación end-to-end, RLS en bases de datos y auditorías regulares) para proteger sus datos. En el contexto de la IA, Azteq-IA garantiza que los datos sensibles de su planta no se utilizarán para entrenar modelos públicos sin su consentimiento explícito. Sus configuraciones de PLC y telemetría permanecen estrictamente confidenciales.
              </p>
            </div>
          </div>

          <div className="pt-8 mt-8 border-t border-gray-200 dark:border-gray-700 text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">Si tiene alguna pregunta sobre esta política, por favor contáctenos.</p>
            <div className="flex justify-center space-x-4">
              <Link href="/" className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                Volver al Inicio
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
