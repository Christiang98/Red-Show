-- Migración 12: Agrega campos event_time, proposed_price a bookings
-- Y asegura is_visible en reviews
-- Correr: sqlite3 redshow.db < scripts/database/12-add-booking-event-fields.sql

ALTER TABLE bookings ADD COLUMN event_time TEXT;
ALTER TABLE bookings ADD COLUMN proposed_price DECIMAL(10,2);
ALTER TABLE reviews ADD COLUMN is_visible BOOLEAN DEFAULT 1;

-- Actualizar reseñas existentes para que sean visibles
UPDATE reviews SET is_visible = 1 WHERE is_visible IS NULL;
