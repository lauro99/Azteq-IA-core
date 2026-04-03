-- 1. Habilitar la extensión matemática para IA
create extension if not exists vector;

-- 2. Crear la tabla para guardar nuestros párrafos de los libros
create table if not exists documentos (
  id bigserial primary key,
  contenido text,
  embedding vector(1536) -- 1536 es el tamaño del modelo de embeddings de OpenAI
);

-- 3. Crear la función de búsqueda de similitud (La magia de la IA experta)
create or replace function buscar_documentos (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id bigint,
  contenido text,
  similitud float
)
language sql stable
as $$
  select
    documentos.id,
    documentos.contenido,
    1 - (documentos.embedding <=> query_embedding) as similitud
  from documentos
  where 1 - (documentos.embedding <=> query_embedding) > match_threshold
  order by (documentos.embedding <=> query_embedding) asc
  limit match_count;
$$;