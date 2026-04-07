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
    // Verificar token del administrador
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    const correctToken = process.env.ADMIN_SECRET_KEY || 'azteq-super-secret-123';
    
    if (token !== correctToken) {
      return NextResponse.json({ error: 'No autorizado. Token de administrador inválido' }, { status: 401 });
    }

    const body = await request.json();
    let text = body.text;
    const { image } = body;
    let imageUrl = null; // <= DECLARADO AQUÍ

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
              { type: "text", text: "Extrae todo el texto útil o información técnica de esta imagen. Si la imagen contiene esquemas ASCII, diagramas de escalera (Ladder logic) o código estructurado con símbolos ([, ], -, |), consérvalos EXACTAMENTE con los mismos espacios, alineaciones y saltos de línea originales. No asumas que es texto corrido. Devuelve únicamente el texto extraído, sin comentarios adicionales ni introducciones." },
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
      
      // Subir la imagen original a Supabase Storage
      try {
        const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, 'base64');
        const fileName = `manual_${Date.now()}.png`;

        const { data, error: uploadError } = await supabase
          .storage
          .from('imagenes_manuales')
          .upload(fileName, buffer, {
            contentType: 'image/png',
            upsert: false
          });

        if (uploadError) {
          console.error("Error subiendo imagen a Storage:", uploadError);
        } else if (data) {
          const { data: publicData } = supabase.storage.from('imagenes_manuales').getPublicUrl(fileName);
          imageUrl = publicData.publicUrl;
        }
      } catch (e) {
         console.error("Error procesando base64 a Buffer:", e);
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

    // 2. Guardar el texto original y su versión en vectores en Supabase (y la imagen)
    const { error } = await supabase
      .from('documentos')
      .insert({
        contenido: text,
        embedding: embedding,
        imagen_url: imageUrl // <--- VARIABLE imageUrl DE LA LÍNEA 50, se asume let imageUrl = null fuera del if si es necesario.
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