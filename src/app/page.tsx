import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4">
      {/* Cabecera / Navegación */}
      <header className="max-w-6xl mx-auto flex justify-between items-center mb-16 pb-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Image src="/azteq-IA.png" alt="Azteq-IA Logo" width={48} height={48} className="rounded-lg shadow-md object-cover" />
          <h1 className="text-2xl font-bold tracking-tight text-gray-800">Azteq-<span className="text-blue-600">IA</span></h1>
        </div>
        <nav className="text-sm font-medium text-gray-500">
          Sistema Operativo de Planta
        </nav>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-6xl mx-auto">
        <div className="mb-12 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex-1">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Bienvenido a la Planta del Futuro</h2>
            <p className="text-lg text-gray-600 max-w-2xl">
              Selecciona uno de los módulos de Inteligencia Artificial para comenzar. Analiza datos de sensores en tiempo real de tus máquinas o consulta tus manuales técnicos con la superinteligencia.
            </p>
          </div>
          <div className="hidden md:block">
            <Image src="/azteq-IA.png" alt="Ilustración Azteq" width={250} height={250} className="opacity-80 rounded-2xl shadow-xl hover:opacity-100 transition-opacity duration-300" />
          </div>
        </div>

        {/* Tarjetas de Módulos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Módulo 1: Chat Experto (Listo) */}
          <Link href="/chat" className="group rounded-2xl bg-white border border-gray-200 p-8 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all cursor-pointer flex flex-col items-start h-full relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">Activo</span>
            </div>
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
              📚
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">IA Experta (Manuales)</h3>
            <p className="text-gray-600 mb-6 flex-1 text-sm leading-relaxed">
              Asistente de Superinteligencia basado en los manuales oficiales de tu empresa. Resuelve dudas operativas en base a conocimiento guardado.
            </p>
            <div className="text-blue-600 font-semibold text-sm flex items-center gap-2 group-hover:translate-x-1 transition-transform">
              Abrir Chat <span aria-hidden="true">&rarr;</span>
            </div>
          </Link>

          {/* Módulo 2: Panel de Administración (Listo) */}
          <Link href="/admin" className="group rounded-2xl bg-white border border-gray-200 p-8 shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all cursor-pointer flex flex-col items-start h-full relative overflow-hidden">
            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
              ⚙️
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Subir Conocimiento</h3>
            <p className="text-gray-600 mb-6 flex-1 text-sm leading-relaxed">
              Enseña a tu IA Experta subiendo nuevos manuales, procedimientos de calibración y reglas operativas. Lo que subas aquí será memorizado en Supabase.
            </p>
            <div className="text-indigo-600 font-semibold text-sm flex items-center gap-2 group-hover:translate-x-1 transition-transform">
              Acceder al Panel <span aria-hidden="true">&rarr;</span>
            </div>
          </Link>

          {/* Módulo 3: IA Planta (Próximamente) */}
          <div className="rounded-2xl bg-gray-50 border border-gray-200 border-dashed p-8 flex flex-col items-start h-full relative overflow-hidden opacity-75">
            <div className="absolute top-0 right-0 p-4">
              <span className="bg-gray-200 text-gray-600 text-xs font-bold px-3 py-1 rounded-full">Próximamente</span>
            </div>
            <div className="w-14 h-14 bg-gray-200 text-gray-500 rounded-xl flex items-center justify-center text-3xl mb-6">
              🏭
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">IA Planta (Conexión PLC)</h3>
            <p className="text-gray-600 mb-6 flex-1 text-sm leading-relaxed">
              Monitoreo analítico predictivo en tiempo real conectado a sensores. Detecta posibles fallas y anomalías en las máquinas de forma autónoma.
            </p>
            <div className="text-gray-400 font-semibold text-sm flex items-center gap-2">
              En desarrollo...
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto mt-20 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
        <p>&copy; 2026 Azteq-IA. Sistema Operacional de Nueva Generación.</p>
      </footer>
    </div>
  );
}
