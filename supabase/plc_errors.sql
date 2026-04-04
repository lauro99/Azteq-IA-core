-- Tabla para registrar errores y alertas de PLCs
create table if not exists plc_errors (
  id serial primary key,
  user_id uuid references auth.users(id),
  plc_id uuid references plcs(id),
  time timestamptz default now(),
  equip text,
  code text,
  desc text,
  severity text,
  resolved boolean default false
);

-- Índice para consultas rápidas por usuario y fecha
create index if not exists idx_plc_errors_user_time on plc_errors(user_id, time desc);
