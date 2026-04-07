-- Añadir columna de validación de soporte para planes (si no existe)
-- Esto permite el flujo de requerir validación antes de comprar un plan pro/enterprise.
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS support_validated BOOLEAN DEFAULT false;
