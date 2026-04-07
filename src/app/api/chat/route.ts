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
    const { message, userEmail, userName, image, history, chatId } = await request.json();

    // Validar que el mensaje no esté vacío
    if (!message && !image) {
      return NextResponse.json({ error: 'Mensaje e imagen vacíos' }, { status: 400 });
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

// 1. Convertir la pregunta del usuario a vectores matemáticos (si existe texto)
    let embedding = null;
    if (message) {
      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: message,
      });
      embedding = embeddingResponse.data[0].embedding;
    }

    // 2. Buscar en Supabase usando la función que creamos y los vectores
    let manualesTexto = "";
    if (embedding) {
      const { data: documentos, error } = await supabase.rpc('buscar_documentos', {
        query_embedding: embedding,
        match_threshold: 0.5, // Margen de similitud (aumentado de 0.3 para mejor relevancia)
        match_count: 5 // Traer los 5 párrafos más parecidos
      });

      if (error) {
        console.error("Error de Supabase:", error);
        throw error;
      }

      // 3. Juntar todos los párrafos encontrados en un solo texto (incluyendo imágenes)
      if (documentos && documentos.length > 0) {
        manualesTexto = documentos.map((doc: { contenido: string, imagen_url?: string }) => {
          let docText = doc.contenido;
          if (doc.imagen_url) {
            docText += `\n[URL_DE_IMAGEN_REFERENCIA: ${doc.imagen_url}]`;
          }
          return docText;
        }).join('\n\n');
      }

      // === Novedad: Buscar en la memoria global de chats anteriores ===
      if (userEmail) {
        const { data: memoriaChats, error: memError } = await supabase.rpc('buscar_memoria_chat', {
          query_embedding: embedding,
          p_user_email: userEmail,
          match_threshold: 0.6, // Tiene que ser similar
          match_count: 3
        });
        
        if (!memError && memoriaChats && memoriaChats.length > 0) {
          const memoriaExtra = memoriaChats.map((m: any) => `(${m.role.toUpperCase()} dijo): ${m.content}`).join('\n');
          manualesTexto += `\n\n--- RECUERDOS DE CHATS ANTERIORES CONTIGO ---\n${memoriaExtra}`;
        }
      }
    }

    // 4. Instrucción secreta para la IA (con la regla híbrida)
    const nombreOperador = userName || 'Operador';
    
    const systemPrompt = `Eres la IA de la empresa Azteq-IA, un asistente técnico experto.
Tu tarea es responder la pregunta del usuario (su nombre actual es: ${nombreOperador}) basándote en la siguiente información extraída de los manuales oficiales de Azteq. Si la información no es suficiente, puedes completar con tu conocimiento general.

--- MANUALES OFICIALES AZTEQ ---
${manualesTexto}
---------------------------------

REGLA DE IMÁGENES:
Si el manual oficial proporciona un [URL_DE_IMAGEN_REFERENCIA: ...], tienes que mostrarle esa imagen al usuario en tu respuesta, justo en el lugar en donde estás explicando.
Para mostrar la imagen, SIEMPRE utiliza formato Markdown de imagen exacto así: ![Imagen del manual oficial](AQUÍ_PONES_EL_URL)

REGLA DE CONVERSACIÓN:
El usuario que está hablando contigo se llama ${nombreOperador}. Sé empático, amable y conversacional. Si el usuario te saluda o es la primera interacción, dirígete a él o ella por su nombre (${nombreOperador}). Cuando expliques algo técnico, mantén la claridad y ve al grano, pero sin perder la empatía ni sonar como un robot estricto. Evita muletillas molestas repetitivas como "El ejemplo que proporcionaste", pero mantén un tono amigable.

REGLAS DE DIAGRAMAS ASCII Y CÓDIGO (LADDER/ESCALERA):
1. Para diagramas COMPLETOS de múltiples líneas (ASCII art), DEBES usar un bloque de código markdown (tres comillas invertidas \`\`\`) para conservar los saltos de línea.
2. MUY IMPORTANTE: Para explicar componentes individuales, instrucciones o etiquetas sueltas (ej: I0.0, M0.1) dentro de tus párrafos, USA texto normal o SOLO UNA comilla invertida (ej: \`I0.0\`). NUNCA uses bloques de código completos (tres comillas) para palabras sueltas, ya que esto rompe la lectura y crea cajas negras innecesarias.

REGLA DE FORMATO MATEMÁTICO (USO OBLIGATORIO DE KaTeX):
Nunca uses barras invertidas y paréntesis \`\\( ... \\)\` o corchetes \`\\[ ... \\]\` para las ecuaciones o notación matemática (como raíces, fracciones, superíndices, conjuntos, etc.). 
Debes usar EXPLÍCITAMENTE signos de dólar:
- Para fórmulas en la misma línea usa un solo dólar \`$ ... $\` (Ejemplo: $\\frac{p}{q}$).
- Para fórmulas en su propia línea o bloque usa doble dólar \`$$ ... $$\` (Ejemplo: $$\\sqrt{2}$$).`;

    // 5. Enviar a ChatGPT (GPT-4o-mini) para generar la respuesta final
    type ChatMessageContent = { type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } };
    const userMessageContent: ChatMessageContent[] = [];
    if (message) {
      userMessageContent.push({ type: 'text', text: message });
    } else {
      userMessageContent.push({ type: 'text', text: "Por favor, analiza la imagen adjunta." });
    }
    
    if (image) {
      userMessageContent.push({
        type: 'image_url',
        // Aseguramos que la URL contenga el Base64 Data URI
        image_url: { url: image }
      });
    }

    // Convertir el historial al formato que OpenAI espera
    const openAIHistory = (history || []).map((msg: any) => ({
      role: msg.role === 'ai' ? 'assistant' : 'user',
      content: msg.content || ''
    }));

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...openAIHistory,
        { role: 'user', content: userMessageContent }
      ],
    });

    const reply = completion.choices[0].message.content;

    // === GUARDAR EL CHAT EN SUPABASE ===
    let activeChatId = chatId;
    if (userEmail && activeChatId) {
      // 1. Guardar mensaje del usuario (con su vector de recuerdo)
      await supabase.from('messages').insert({
        chat_id: activeChatId,
        role: 'user',
        content: message || '',
        embedding: embedding, // El vector que creamos de la pregunta
      });

      // 2. Vectorizamos la respuesta de la IA para que también la repase en el futuro
      let aiEmbedding = null;
      if (reply) {
        try {
          const aiEmbRes = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: reply.substring(0, 1000) // Vectorizamos un fragmento si es enorme
          });
          aiEmbedding = aiEmbRes.data[0].embedding;
        } catch (e) {}
      }

      // 3. Guardar la respuesta de la IA
      await supabase.from('messages').insert({
        chat_id: activeChatId,
        role: 'ai',
        content: reply,
        embedding: aiEmbedding,
      });
      // Actualizamos última fecha para reordenar en la barra lateral
      await supabase.from('chats').update({ updated_at: new Date().toISOString() }).eq('id', activeChatId);
    }

    return NextResponse.json({ reply, chatId: activeChatId });
  } catch (error: any) {
    console.error("Error general:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}