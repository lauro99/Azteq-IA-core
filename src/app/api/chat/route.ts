import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const { message, userEmail } = await request.json();

    // Validar que el mensaje no esté vacío
    if (!message) {
      return NextResponse.json({ error: 'Mensaje vacío' }, { status: 400 });
    }

    // Validar formato de email
    if (userEmail && !userEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return NextResponse.json({ error: 'Formato de email inválido' }, { status: 400 });
    }

    // Validar longitud del mensaje (max 5000 caracteres)
    if (message.length > 5000) {
      return NextResponse.json({ error: 'Mensaje demasiado largo (máximo 5000 caracteres)' }, { status: 400 });
    }

    // --- LÓGICA DE CONTROL DE MENSAJES ---
    // Exigimos correo. Extraemos lo que hay antes de la '@'.
    const username = userEmail ? userEmail.split('@')[0].toLowerCase() : '';
    
    // Si NO es un administrador (no empieza con adm), aplicamos la regla de límites
    if (!username.startsWith('adm')) {
      // 1. Obtener los mensajes enviados HOY por este usuario
      // ⚠️ IMPORTANTE: Necesitas crear una tabla 'limites_uso' en tu Supabase con:
      // id, email(text), creado_en(date default now())
      const hoy = new Date().toISOString().split('T')[0]; // "2026-04-02"
      
      const { count, error: countError } = await supabase
        .from('limites_uso')
        .select('*', { count: 'exact', head: true })
        .eq('email', userEmail)
        .gte('creado_en', `${hoy}T00:00:00.000Z`)
        .lte('creado_en', `${hoy}T23:59:59.999Z`);

      if (countError) {
        console.error("Error consultando límite:", countError);
      }
      
      const limit = 10; // límite de 10 mensajes
      if (count !== null && count >= limit) {
        return NextResponse.json({ 
          error: `Has alcanzado el límite diario de ${limit} consultas. Regresa mañana.` 
        }, { status: 403 });
      }

      // Si no ha superado el límite, guardamos el intento
      await supabase.from('limites_uso').insert([{ email: userEmail }]);
    }
    // Si ES un admin (adm, adm1, adm2, etc...), nos saltamos la regla anterior y dejamos pasar.
    // -------------------------------------

    // 1. Convertir la pregunta del usuario a vectores matemáticos
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: message,
    });
    const embedding = embeddingResponse.data[0].embedding;

    // 2. Buscar en Supabase usando la función que creamos y los vectores
    const { data: documentos, error } = await supabase.rpc('buscar_documentos', {
      query_embedding: embedding,
      match_threshold: 0.5, // Margen de similitud (aumentado de 0.3 para mejor relevancia)
      match_count: 5 // Traer los 5 párrafos más parecidos
    });

    if (error) {
      console.error("Error de Supabase:", error);
      throw error;
    }

    // 3. Juntar todos los párrafos encontrados en un solo texto
    let manualesTexto = "";
    if (documentos && documentos.length > 0) {
      manualesTexto = documentos.map((doc: any) => doc.contenido).join('\n\n');
    }

    // 4. Instrucción secreta para la IA (con la regla híbrida)
    const systemPrompt = `Eres la IA de la empresa Azteq-IA, un asistente técnico experto.
Tu tarea es responder la pregunta del usuario.

Primero, revisa si puedes responder basándote ÚNICAMENTE en la siguiente información extraída de los manuales oficiales de Azteq:
--- MANUALES OFICIALES AZTEQ ---
${manualesTexto ? manualesTexto : "(No se encontraron documentos exactos para esta consulta en la base de datos local)"}
---------------------------------

REGLA ESTRICTA DE RESPUESTA:
- Si los manuales descritos arriba SÍ contienen la información para responder la pregunta de forma clara, responde usando esa información y NO añadas ninguna nota al final.
- Si la información en los manuales NO ES SUFICIENTE O ES NULA para responder la pregunta, usa tu propio conocimiento técnico y general de internet para contestar la duda para que el usuario siempre tenga una respuesta. Sin embargo, en este caso DEBES escribir esto OBLIGATORIAMENTE al final de tu respuesta:
"(Nota: Esta información es de conocimiento general y no proviene de los manuales oficiales de Azteq)".

REGLA DE FORMATO MATEMÁTICO (USO OBLIGATORIO DE KaTeX):
Nunca uses barras invertidas y paréntesis \`\\( ... \\)\` o corchetes \`\\[ ... \\]\` para las ecuaciones o notación matemática (como raíces, fracciones, superíndices, conjuntos, etc.). 
Debes usar EXPLÍCITAMENTE signos de dólar:
- Para fórmulas en la misma línea usa un solo dólar \`$ ... $\` (Ejemplo: $\\frac{p}{q}$).
- Para fórmulas en su propia línea o bloque usa doble dólar \`$$ ... $$\` (Ejemplo: $$\\sqrt{2}$$).`;

    // 5. Enviar a ChatGPT (GPT-4o-mini) para generar la respuesta final
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
    });

    return NextResponse.json({ reply: completion.choices[0].message.content });
  } catch (error: any) {
    console.error("Error general:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}