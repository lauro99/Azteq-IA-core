import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
// Usamos la Service Role Key para tener permisos de escritura y saltar el RLS.
// Si no existe, cae en la llave anónima (pero dará error de RLS).
const supabaseAdminKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAdminKey);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let text = body.text;
    const { image } = body;

    if (!text && !image) {
      return NextResponse.json({ error: 'Falta proveer el texto o una imagen' }, { status: 400 });
    }

    // Si se envía una imagen, extraemos el texto con OpenAI Vision
    if (image) {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Extrae todo el texto útil o información técnica de esta imagen. Devuelve únicamente el texto extraído, sin comentarios adicionales." },
              {
                type: "image_url",
                image_url: {
                  url: image,
                },
              },
            ],
          },
        ],
      });
      const ocrText = response.choices[0].message.content || "";
      if (!ocrText) {
        return NextResponse.json({ error: 'No se pudo extraer texto de la imagen' }, { status: 400 });
      }
      
      // Combinar texto manual (si lo hay) y texto de la imagen (OCR)
      text = text ? `${text}\n\n[📝 TEXTO DE IMAGEN EXTRAÍDO]:\n${ocrText}` : ocrText;
    }

    // 1. Enviar el texto a OpenAI para convertirlo en vectores
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });

    const embedding = embeddingResponse.data[0].embedding;

    // 2. Guardar el texto original y su versión en vectores en Supabase
    const { error } = await supabase
      .from('documentos')
      .insert({
        contenido: text,
        embedding: embedding,
      });

    if (error) {
      console.error("Error de Supabase:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: '¡Texto guardado y vectorizado correctamente!' });
  } catch (error: any) {
    console.error("Error general:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}