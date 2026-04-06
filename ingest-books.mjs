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

// Renderiza una página PDF a canvas usando pdfjs-dist + canvas (Node.js)
async function renderizarPaginaACanvas(pdfDoc, numeroPagina) {
  const pagina = await pdfDoc.getPage(numeroPagina);
  const escala = 2.0; // más escala = mejor calidad de OCR
  const viewport = pagina.getViewport({ scale: escala });

  const canvas = createCanvas(viewport.width, viewport.height);
  const contexto = canvas.getContext('2d');

  await pagina.render({
    canvasContext: contexto,
    viewport,
  }).promise;

  // Devolvemos el canvas directamente (Tesseract.js lo acepta nativo)
  return canvas;
}

// OCR de un PDF escaneado: convierte cada página a imagen y le aplica Tesseract
async function extraerTextoConOCR(pdfDoc) {
  console.log('   🔍 PDF escaneado detectado. Aplicando OCR...');

  const totalPaginas = pdfDoc.numPages;
  console.log(`   → ${totalPaginas} página(s) para procesar con OCR`);

  const worker = await createWorker('spa+eng'); // español + inglés
  let textoCompleto = '';

  for (let i = 1; i <= totalPaginas; i++) {
    process.stdout.write(`   🖼  Página ${i}/${totalPaginas}...\r`);
    const canvas = await renderizarPaginaACanvas(pdfDoc, i);
    const { data } = await worker.recognize(canvas);
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
      const pdfDoc = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;

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

  let exitosos = 0;
  let fallidos = 0;

  for (let i = 0; i < chunks.length; i++) {
    try {
      const resp = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: chunks[i],
      });
      const embedding = resp.data[0].embedding;

      const { error } = await supabase.from('documentos').insert({
        contenido: chunks[i],
        embedding: embedding,
        fuente: nombre,
      });

      if (error) {
        console.error(`\n   ❌ Error Supabase en chunk ${i + 1}: ${error.message}`);
        fallidos++;
      } else {
        exitosos++;
        process.stdout.write(`   ✅ ${exitosos}/${chunks.length} fragmentos guardados\r`);
      }
    } catch (err) {
      console.error(`\n   ❌ Error OpenAI en chunk ${i + 1}: ${err.message}`);
      fallidos++;
    }

    await new Promise(r => setTimeout(r, PAUSA_MS));
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
