'use client';

import { useState } from 'react';

export default function AdminPage() {
  const [text, setText] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setStatus('Procesando con OpenAI y guardando en Supabase...');
    
    try {
      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setStatus('✅ ' + data.message);
        setText(''); // Limpia el formulario
      } else {
        setStatus('❌ Error: ' + data.error);
      }
    } catch (error) {
      setStatus('❌ Fallo al conectar con la API.');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-20 px-4">
      <div className="w-full max-w-2xl bg-white p-8 rounded-xl shadow-md border border-gray-200 text-gray-800">
        <h1 className="text-2xl font-bold mb-2">Panel Administrativo de IA</h1>
        <p className="text-sm text-gray-500 mb-6">Pega aquí el texto de tus manuales técnicos para que la IA los memorice.</p>
        
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ej: La bomba hidráulica de agua modelo AZ-900 debe ser calibrada a una presión de 40 PSI..."
          className="w-full h-40 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none mb-4"
        />
        
        <button
          onClick={handleSave}
          disabled={loading || !text.trim()}
          className="bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {loading ? 'Vectorizando...' : 'Guardar y Enseñar a la IA'}
        </button>
        
        {status && (
          <div className="mt-4 p-3 bg-gray-100 rounded-lg text-sm text-gray-700 font-medium font-mono whitespace-pre-wrap break-words">
            {status}
          </div>
        )}
      </div>
    </div>
  );
}