-- Tabla para agrupar PLCs por línea o grupo de producción
create table if not exists plc_groups (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Agregar columna opcional group_id a la tabla plcs para asignar cada PLC a un grupo/linea
alter table plcs add column if not exists group_id uuid references plc_groups(id);

-- Políticas de seguridad para grupos
alter table plc_groups enable row level security;
create policy "Usuarios ven sus propios grupos" on plc_groups for select using (auth.uid() = user_id);
create policy "Usuarios insertan sus propios grupos" on plc_groups for insert with check (auth.uid() = user_id);
create policy "Usuarios actualizan sus propios grupos" on plc_groups for update using (auth.uid() = user_id);
create policy "Usuarios borran sus propios grupos" on plc_groups for delete using (auth.uid() = user_id);
