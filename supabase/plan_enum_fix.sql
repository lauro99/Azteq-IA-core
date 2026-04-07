-- 1. Primero, quitamos el valor por defecto actual que es texto normal y está causando el conflicto
ALTER TABLE user_profiles ALTER COLUMN plan DROP DEFAULT;

-- 2. Limpiamos cualquier dato existente basura
UPDATE user_profiles 
SET plan = 'free' 
WHERE plan IS NULL OR plan NOT IN ('free', 'pro', 'enterprise');

-- Nota: Si en el intento anterior lograste crear el ENUM, esta línea dará un error diciendo que ya existe. 
-- Si eso pasa, simplemente bórrala o ignórala.
-- Si no existe, creamos el ENUM:
-- CREATE TYPE user_plan_enum AS ENUM ('free', 'pro', 'enterprise');

-- 3. Ahora sí, cambiamos el tipo de la columna a menú desplegable de forma segura
ALTER TABLE user_profiles 
  ALTER COLUMN plan TYPE user_plan_enum 
  USING plan::text::user_plan_enum;

-- 4. Volvemos a definir el valor por defecto, esta vez con el tipo Desplegable (ENUM)
ALTER TABLE user_profiles 
  ALTER COLUMN plan SET DEFAULT 'free'::user_plan_enum;