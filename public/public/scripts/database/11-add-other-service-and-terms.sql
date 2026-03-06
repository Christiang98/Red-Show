-- Migration: 11-add-other-service-and-terms.sql
-- Agregar columna other_service a owner_profiles
ALTER TABLE owner_profiles ADD COLUMN IF NOT EXISTS other_service TEXT DEFAULT '';

-- Agregar columna terms_accepted_at a la tabla users (para T&C)
-- SQLite no soporta IF NOT EXISTS en ALTER TABLE, 
-- el código lo maneja via try/catch en la API

-- Nota: Las siguientes migraciones se ejecutan automáticamente via API al guardar perfiles:
-- owner_profiles.other_service (TEXT DEFAULT '')
-- profiles.phone ya existe y se guarda en el registro
