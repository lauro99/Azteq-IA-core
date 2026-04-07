-- 1. Añadir la columna de imagen a la tabla documentos
ALTER TABLE documentos ADD COLUMN imagen_url TEXT;

-- 2. Actualizar la función buscar_documentos para que devuelva la URL de la imagen
-- (IMPORTANTE: Es necesario borrar la funcion anterior y crearla de nuevo con el nuevo tipo de retorno)
DROP FUNCTION IF EXISTS buscar_documentos(vector, double precision, integer);

CREATE OR REPLACE FUNCTION buscar_documentos(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id bigint,
  contenido text,
  imagen_url text, -- <--- NUEVA COLUMNA DEVUELTA
  similitud float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    documentos.id,
    documentos.contenido,
    documentos.imagen_url, -- <--- NUEVA COLUMNA SELECCIONADA
    1 - (documentos.embedding <=> query_embedding) AS similitud
  FROM documentos
  WHERE 1 - (documentos.embedding <=> query_embedding) > match_threshold
  ORDER BY documentos.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
