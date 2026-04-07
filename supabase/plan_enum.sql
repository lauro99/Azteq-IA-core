-- Migración para convertir la columna 'plan' de texto libre a un Desplegable (ENUM)

-- 1. Limpiamos cualquier dato existente basura en la tabla (como "EMPTY" que se ve en la captura) 
-- y lo forzamos a 'free' para que PostgreSQL pueda hacer la conversión sin errores.
UPDATE user_profiles 
SET plan = 'free' 
WHERE plan IS NULL OR plan NOT IN ('free', 'pro', 'enterprise');

-- 2. Creamos el nuevo tipo de dato Desplegable (ENUM) con las opciones exactas
CREATE TYPE user_plan_enum AS ENUM ('free', 'pro', 'enterprise');

-- 3. Cambiamos la configuración de la columna 'plan' en la tabla 'user_profiles'
-- al nuevo tipo de dato. "USING" le enseña a Postgres cómo transformar el texto actual a ENUM.
ALTER TABLE user_profiles 
  ALTER COLUMN plan TYPE user_plan_enum 
  USING plan::text::user_plan_enum;

-- 4. Fijamos 'free' como el plan obligatorio por defecto cuando alguien nuevo se registra
ALTER TABLE user_profiles 
  ALTER COLUMN plan SET DEFAULT 'free'::user_plan_enum;
