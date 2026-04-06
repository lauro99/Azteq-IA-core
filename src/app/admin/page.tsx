'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function AdminPage() {
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const handleImageUpload = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      // No borramos el texto para permitir combinación de imagen y notas
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovering(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImageUpload(file);
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSave = async () => {
    if (!text.trim() && !imagePreview) return;
    setLoading(true);
    setStatus('Procesando con OpenAI y guardando en Supabase...');
    
    try {
      const payload = { text, image: imagePreview };

      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setStatus('✅ ' + data.message + (imagePreview ? ' (Texto extraído por OCR)' : ''));
        setText('');
        clearImage();
      } else {
        setStatus('❌ Error: ' + data.error);
      }
    } catch (error) {
      setStatus('❌ Fallo al conectar con la API.');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-20 px-4 bg-[#111] bg-no-repeat bg-center bg-[url('/panel_adm_azteq_phone.png')] md:bg-[url('/panel_adm_azteq_web.png')] bg-[length:100%_100%] bg-fixed relative overflow-hidden">
      <div className="absolute inset-0 bg-black/60 pointer-events-none z-0"></div>
      
      {/* Botón de retorno */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-50">
        <Link href="/" className="group flex items-center gap-3 bg-black/60 backdrop-blur-md border border-[#0D9488]/30 px-5 py-2.5 shadow-[0_4px_20px_rgba(0,0,0,0.6)] hover:bg-[#0D9488]/10 hover:border-[#D4AF37]/50 hover:shadow-[0_0_15px_rgba(212,175,55,0.3)] transition-all overflow-hidden rounded-xl">
          <div className="w-5 h-5 text-[#0D9488] group-hover:text-[#D4AF37] group-hover:-translate-x-1 drop-shadow-[0_0_5px_currentColor] transition-all">    
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">       
              <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="1.5" d="M11 20L3 12l8-8" />
              <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="1.5" d="M18 16l-4-4 4-4" />
              <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="1.5" d="M4 12h14" />
            </svg>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#E0F2F1] group-hover:text-[#D4AF37] transition-colors">
            VOLVER
          </span>
        </Link>
      </div>

      <div className="w-full max-w-2xl bg-black/40 backdrop-blur-md p-8 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.5)] border border-[#D4AF37]/30 text-white relative z-10 mt-10">
        <div className="flex items-center gap-3 mb-2">
           <svg className="w-8 h-8 text-[#D4AF37] drop-shadow-[0_0_8px_rgba(212,175,55,0.6)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4v16m8-8H4" />
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 12l4-4m-4 4l4 4m12-4l-4-4m4 4l-4 4" />
           </svg>
           <h1 className="text-2xl font-bold tracking-wide text-[#E0F2F1]">Panel Administrativo de IA</h1>
        </div>
        <p className="text-xs text-white/60 mb-6 font-light uppercase tracking-wider">Pega aquí el texto de tus manuales técnicos para que la IA los memorice.</p>
        
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onPaste={(e) => {
            const items = e.clipboardData?.items;
            if (!items) return;
            for (let i = 0; i < items.length; i++) {
              if (items[i].type.indexOf('image') !== -1) {
                const file = items[i].getAsFile();
                if (file) {
                  e.preventDefault();
                  handleImageUpload(file);
                  break;
                }
              }
            }
          }}
          placeholder="Ej: La bomba hidráulica de agua modelo AZ-900 debe ser calibrada..."
          className="w-full h-40 p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#0D9488]/70 focus:bg-white/10 transition-all font-light resize-none mb-6 shadow-inner"
        />

        {/* Sección Image Upload o DND */}
        <div 
          onDragOver={(e) => { e.preventDefault(); setIsHovering(true); }}
          onDragLeave={(e) => { e.preventDefault(); setIsHovering(false); }}
          onDrop={handleDrop}
          className={`w-full p-4 mb-6 border-2 border-dashed rounded-xl transition-all ${
            isHovering ? 'border-[#D4AF37] bg-black/40' : 'border-[#0D9488]/50 bg-white/5'
          } ${imagePreview ? 'hidden' : 'flex flex-col items-center justify-center cursor-pointer hover:bg-white/10'}`}
        >
          <label className="cursor-pointer flex flex-col items-center gap-2 text-white/70 hover:text-white transition-colors">
            <svg className="w-8 h-8 text-[#0D9488]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span className="text-sm font-medium">Sube una imagen o arrástrala aquí</span>
            <span className="text-xs text-white/40">OpenAI lo leerá y extraerá el texto (OCR)</span>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])} />
          </label>
        </div>

        {/* Image Preview */}
        {imagePreview && (
          <div className="w-full mb-6 relative group border border-white/10 rounded-xl overflow-hidden bg-black/20 flex justify-center p-2">
            <img src={imagePreview} alt="Preview" className="max-h-48 object-contain rounded" />
            <button 
              onClick={clearImage}
              className="absolute top-2 right-2 bg-red-600/80 hover:bg-red-500 text-white rounded-full p-1.5 transition-colors opacity-0 group-hover:opacity-100 shadow-lg"
              title="Quitar imagen"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="absolute bottom-2 left-2 bg-black/80 px-2 py-1 text-xs text-green-300 rounded shadow-sm">
              Imagen lista para procesar con OCR
            </div>
          </div>
        )}
        
        <button
          onClick={handleSave}
          disabled={loading || (!text.trim() && !imagePreview)}
          className="w-full sm:w-auto bg-[#D4AF37] hover:bg-[#E5C158] disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-3 px-8 rounded-xl text-xs uppercase tracking-[0.15em] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_15px_rgba(212,175,55,0.2)] hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]"
        >
          {loading ? 'Procesando Documentos...' : 'Guardar y Enseñar a la IA'}
        </button>
        
        {status && (
          <div className="mt-6 p-4 bg-[#0D9488]/10 border border-[#0D9488]/30 rounded-xl text-xs text-[#E0F2F1] font-medium font-mono whitespace-pre-wrap break-words shadow-inner">
            {status}
          </div>
        )}
      </div>
    </div>
  );
}