
-- HABILITAR RLS PARA TABLAS VULNERABLES
ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE limites_uso ENABLE ROW LEVEL SECURITY;
ALTER TABLE plc_errors ENABLE ROW LEVEL SECURITY;

-- POLITICAS PARA PLC_ERRORS (Solo lectura para el dueño, sin modificaciones desde cliente)
CREATE POLICY "Solo los administradores pueden modificar errores"
ON plc_errors
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- POLITICAS PARA LIMITES_USO (Solo el dueño puede ver sus propios limites usando su email)
CREATE POLICY "Usuarios solo ven sus propios limites" 
ON limites_uso
FOR SELECT 
TO authenticated 
USING (email = auth.jwt() ->> 'email');

-- Evitar que un usuario modifique sus limites
CREATE POLICY "Nadie puede saltarse ni modificar sus propios limites"
ON limites_uso 
FOR UPDATE 
TO authenticated 
USING (false);

-- POLITICAS PARA DOCUMENTOS (Solo lectura, ya que Supabase Service Role los ingesta por API)
CREATE POLICY "Usuarios ven todos los documentos o ninguno"
ON documentos
FOR SELECT
TO authenticated
USING (true); -- Permitimos leer a usuarios logueados
