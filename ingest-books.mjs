import { readFileSync, readdirSync } from 'fs';
import { join, extname, basename } from 'path';
import { createWorker } from 'tesseract.js';
import { createCanvas } from 'canvas';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// Carga las variables de entorno desde .env.local
import { config } from 'dotenv';
config({ path: '.env.local' });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
// Usamos la service_role key para que el script admin pueda insertar sin restricciones de RLS
// Encuéntrala en: Supabase Dashboard → Project Settings → API → service_role
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const CARPETA_LIBROS = './libros';
const CHUNK_TAMAÑO = 800;        // caracteres por fragmento
const CHUNK_SOLAPAMIENTO = 150;  // solapamiento para no perder contexto entre fragmentos
const PAUSA_MS = 250;            // pausa entre llamadas a OpenAI (evita rate limit)
const TEXTO_MINIMO = 100;        // si el PDF tiene menos caracteres, se asume que está escaneado

// Factory necesaria para que pdfjs-dist pueda renderizar páginas en Node.js
class NodeCanvasFactory {
  create(width, height) {
    const canvas = createCanvas(width, height);
    const context = canvas.getContext('2d');
    return { canvas, context };
  }
  reset(canvasAndContext, width, height) {
    canvasAndContext.canvas.width = width;
    canvasAndContext.canvas.height = height;
  }
  destroy(canvasAndContext) {
    canvasAndContext.canvas.width = 0;
    canvasAndContext.canvas.height = 0;
  }
}

// Divide un texto largo en fragmentos con solapamiento
function dividirEnChunks(texto, tamaño, solapamiento) {
  const chunks = [];
  let inicio = 0;
  while (inicio < texto.length) {
    const chunk = texto.slice(inicio, inicio + tamaño).trim();
    if (chunk.length > 50) {
      chunks.push(chunk);
    }
    inicio += tamaño - solapamiento;
  }
  return chunks;
}

// Extrae texto de un PDF con texto seleccionable usando pdfjs-dist
async function extraerTextoNormal(pdfDoc) {
  let texto = '';
  for (let i = 1; i <= pdfDoc.numPages; i++) {
    const pagina = await pdfDoc.getPage(i);
    const contenido = await pagina.getTextContent();
    const textoPagina = contenido.items.map(item => item.str).join(' ');
    texto += textoPagina + '\n';
  }
  return texto;
}

// Renderiza una página PDF y retorna el PNG como Uint8Array en memoria
async function renderizarPaginaAPNG(pdfDoc, numeroPagina) {
  const pagina = await pdfDoc.getPage(numeroPagina);
  const escala = 2.0;
  const viewport = pagina.getViewport({ scale: escala });

  const canvas = createCanvas(viewport.width, viewport.height);
  const contexto = canvas.getContext('2d');

  await pagina.render({ canvasContext: contexto, viewport }).promise;

  // Uint8Array funciona con Tesseract.js en Node.js
  const buffer = canvas.toBuffer('image/png');
  return new Uint8Array(buffer);
}

// OCR de un PDF escaneado: convierte cada página a PNG y aplica Tesseract
async function extraerTextoConOCR(pdfDoc) {
  console.log('   🔍 PDF escaneado detectado. Aplicando OCR...');

  const totalPaginas = pdfDoc.numPages;
  console.log(`   → ${totalPaginas} página(s) para procesar con OCR`);

  const worker = await createWorker('spa+eng');
  let textoCompleto = '';

  for (let i = 1; i <= totalPaginas; i++) {
    process.stdout.write(`   🖼  Página ${i}/${totalPaginas}...\r`);
    const pngData = await renderizarPaginaAPNG(pdfDoc, i);
    const { data } = await worker.recognize(pngData);
    textoCompleto += data.text + '\n';
  }

  await worker.terminate();
  console.log(`\n   ✔ OCR completado.`);
  return textoCompleto;
}

// OCR directo para imágenes sueltas (JPG, PNG, etc.)
async function extraerTextoDeImagen(rutaArchivo) {
  console.log('   🔍 Imagen detectada. Aplicando OCR...');
  const worker = await createWorker('spa+eng');
  const { data } = await worker.recognize(rutaArchivo);
  await worker.terminate();
  return data.text;
}

async function procesarArchivo(rutaArchivo) {
  const nombre = basename(rutaArchivo);
  const ext = extname(rutaArchivo).toLowerCase();
  console.log(`\n📖 Procesando: ${nombre}`);

  let texto = '';
  try {
    if (ext === '.pdf') {
      const buffer = readFileSync(rutaArchivo);
      const pdfDoc = await pdfjsLib.getDocument({
        data: new Uint8Array(buffer),
        canvasFactory: new NodeCanvasFactory(),
      }).promise;

      // Intentar extracción de texto normal
      texto = await extraerTextoNormal(pdfDoc);

      // Si el texto es muy corto, asumir que es PDF escaneado y usar OCR
      if (!texto || texto.trim().length < TEXTO_MINIMO) {
        texto = await extraerTextoConOCR(pdfDoc);
      } else {
        console.log('   ✅ PDF con texto seleccionable. Extracción directa.');
      }
    } else if (['.jpg', '.jpeg', '.png', '.tiff', '.tif'].includes(ext)) {
      texto = await extraerTextoDeImagen(rutaArchivo);
    } else {
      texto = readFileSync(rutaArchivo, 'utf-8');
    }
  } catch (err) {
    console.error(`   ❌ No se pudo procesar el archivo: ${err.message}`);
    return;
  }

  if (!texto || !texto.trim()) {
    console.warn('   ⚠️  No se pudo extraer texto del archivo.');
    return;
  }

  const chunks = dividirEnChunks(texto, CHUNK_TAMAÑO, CHUNK_SOLAPAMIENTO);
  console.log(`   → ${chunks.length} fragmentos a ingestar...`);

  const BATCH_OPENAI = 20;   // embeddings por llamada a OpenAI
  const BATCH_SUPABASE = 50; // filas por insert a Supabase
  let exitosos = 0;
  let fallidos = 0;
  const pendientesSupabase = [];

  // 1. Generar todos los embeddings en lotes
  for (let i = 0; i < chunks.length; i += BATCH_OPENAI) {
    const lote = chunks.slice(i, i + BATCH_OPENAI);
    try {
      const resp = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: lote,
      });
      for (let j = 0; j < lote.length; j++) {
        pendientesSupabase.push({
          contenido: lote[j],
          embedding: resp.data[j].embedding,
          fuente: nombre,
        });
      }
      process.stdout.write(`   🔄 Embeddings: ${Math.min(i + BATCH_OPENAI, chunks.length)}/${chunks.length}\r`);
    } catch (err) {
      console.error(`\n   ❌ Error OpenAI en lote ${i}: ${err.message}`);
      fallidos += lote.length;
    }
    await new Promise(r => setTimeout(r, PAUSA_MS));
  }

  console.log(`\n   → Guardando ${pendientesSupabase.length} fragmentos en Supabase...`);

  // 2. Insertar en Supabase en lotes
  for (let i = 0; i < pendientesSupabase.length; i += BATCH_SUPABASE) {
    const lote = pendientesSupabase.slice(i, i + BATCH_SUPABASE);
    const { error } = await supabase.from('documentos').insert(lote);
    if (error) {
      console.error(`\n   ❌ Error Supabase en lote ${i}: ${error.message}`);
      fallidos += lote.length;
    } else {
      exitosos += lote.length;
      process.stdout.write(`   ✅ ${exitosos}/${pendientesSupabase.length} guardados\r`);
    }
  }

  console.log(`\n   ✔ Completado: ${exitosos} guardados, ${fallidos} fallidos.`);
}

// ---- EJECUCIÓN PRINCIPAL ----
console.log('🚀 Iniciando ingestión de libros...');
console.log(`   Carpeta: ${CARPETA_LIBROS}\n`);

const EXTENSIONES = ['.pdf', '.txt', '.jpg', '.jpeg', '.png', '.tiff', '.tif'];

let archivos;
try {
  archivos = readdirSync(CARPETA_LIBROS).filter(f =>
    EXTENSIONES.includes(extname(f).toLowerCase())
  );
} catch {
  console.error(`❌ No se encontró la carpeta "${CARPETA_LIBROS}". Créala y pon tus archivos ahí.`);
  process.exit(1);
}

if (archivos.length === 0) {
  console.warn('⚠️  No se encontraron archivos en la carpeta "libros/".');
  console.warn(`   Formatos soportados: ${EXTENSIONES.join(', ')}`);
  process.exit(0);
}

console.log(`📚 ${archivos.length} archivo(s) encontrado(s): ${archivos.join(', ')}`);

for (const archivo of archivos) {
  await procesarArchivo(join(CARPETA_LIBROS, archivo));
}

console.log('\n🎉 ¡Ingestión completa! La IA ya puede usar los libros en sus respuestas.');
