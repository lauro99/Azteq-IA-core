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

-- 4. Crear tabla para almacenar las máquinas físicas (Reliquias/PLCs) de forma segura por usuario
create table if not exists plcs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  brand text not null,
  ip text not null,
  port integer default 102,
  rack integer default 0,
  slot integer default 1,
  is_cloud boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar seguridad a nivel de filas (RLS) para que un usuario no vea los PLCs de otro
alter table plcs enable row level security;

-- Política: Los usuarios solo pueden ver sus propios PLCs
create policy "Usuarios ven sus propios PLCs"
  on plcs for select
  using (auth.uid() = user_id);

-- Política: Los usuarios solo pueden crear PLCs asignados a ellos mismos
create policy "Usuarios insertan sus propios PLCs"
  on plcs for insert
  with check (auth.uid() = user_id);

-- Política: Los usuarios solo actualizan sus propios PLCs
create policy "Usuarios actualizan sus propios PLCs"
  on plcs for update
  using (auth.uid() = user_id);

-- Política: Los usuarios solo borran sus propios PLCs
create policy "Usuarios borran sus propios PLCs"
  on plcs for delete
  using (auth.uid() = user_id);