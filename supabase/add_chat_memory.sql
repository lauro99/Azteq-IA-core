-- 1. Tabla para guardar los "Hilos de Chat" (Las conversaciones de la barra lateral)
CREATE TABLE IF NOT EXISTS chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT 'Nuevo Chat',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Tabla para guardar los Mensajes de cada chat
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'user' o 'ai'
  content TEXT,
  image_url TEXT,     -- Si el usuario subió imagen
  embedding vector(1536), -- ¡LA MENTE GLOBAL! Aquí guardaremos los vectores de los mensajes para que los recuerde
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Función para que la IA recorra "sus recuerdos" de TODOS los chats de ese usuario
DROP FUNCTION IF EXISTS buscar_memoria_chat(vector, text, double precision, integer);

CREATE OR REPLACE FUNCTION buscar_memoria_chat(
  query_embedding vector(1536),
  p_user_email text,
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  chat_id uuid,
  role text,
  content text,
  similitud float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.chat_id,
    m.role,
    m.content,
    1 - (m.embedding <=> query_embedding) AS similitud
  FROM messages m
  JOIN chats c ON m.chat_id = c.id
  WHERE c.user_email = p_user_email
    AND m.content IS NOT NULL
    AND m.content != ''
    AND 1 - (m.embedding <=> query_embedding) > match_threshold
  ORDER BY m.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;