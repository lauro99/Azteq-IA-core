import React from 'react';
import Link from 'next/link';

export default function PoliticaCookies() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 font-sans transition-colors duration-200">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-teal-600 dark:bg-teal-800 px-8 py-10 text-white">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Política de Cookies</h1>
          <p className="mt-2 text-teal-100 flex items-center">
            <span className="bg-teal-500 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider mr-3">Gestión de Sesiones y Rastreo</span>
          </p>
        </div>
        
        <div className="px-8 py-10 text-gray-700 dark:text-gray-300 space-y-8">
          <section className="prose dark:prose-invert max-w-none">
            <p className="text-lg leading-relaxed">
              Esta Política de Cookies explica cómo <strong>Azteq-IA</strong> utiliza cookies y tecnologías similares para reconocerle cuando visita nuestra plataforma. Explica qué son estas tecnologías, por qué las usamos y sus derechos para controlar nuestro uso de ellas.
            </p>
          </section>

          <div className="space-y-6">
            <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">¿Qué son las cookies?</h2>
              <p>
                Las cookies son pequeños archivos de datos que se colocan en su computadora o dispositivo móvil cuando visita un sitio web o aplicación web. Las utilizamos principalmente para mantener su sesión activa de manera segura y para guardar sus preferencias de la interfaz (como el tema oscuro/claro y el idioma).
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Tipos de cookies que utilizamos</h2>
              <ul className="list-disc pl-5 space-y-4">
                <li>
                  <strong>Cookies Estrictamente Necesarias:</strong> Estas cookies son esenciales para el funcionamiento de la plataforma. Incluyen, por ejemplo, los tokens de autenticación de Supabase que le permiten iniciar sesión en áreas seguras y acceder a los dashboards de su planta. <em>No pueden ser desactivadas.</em>
                </li>
                <li>
                  <strong>Cookies de Preferencias:</strong> Permiten que nuestra plataforma recuerde información que cambia la forma en que se comporta o se ve el sitio, como su idioma preferido (inglés/español) o la región en la que se encuentra.
                </li>
                <li>
                  <strong>Cookies de Rendimiento y Análisis:</strong> Nos ayudan a comprender cómo interactúan los usuarios con nuestra plataforma (por ejemplo, qué páginas de configuración de PLC se visitan con más frecuencia), recogiendo y aportando información de forma anónima.
                </li>
              </ul>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Cómo controlar las cookies</h2>
              <p>
                Usted tiene el derecho de decidir si acepta o rechaza las cookies que no son estrictamente necesarias. Puede configurar o modificar los controles de su navegador web para aceptar o rechazar las cookies. Si elige rechazar las cookies, podrá seguir utilizando nuestra plataforma, aunque su acceso a algunas funciones (como el recordatorio de idioma) podría verse restringido.
              </p>
            </div>
          </div>

          <div className="pt-8 mt-8 border-t border-gray-200 dark:border-gray-700 text-center">
            <Link href="/" className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors inline-block">
              Entendido
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
