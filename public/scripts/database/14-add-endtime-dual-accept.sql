-- Migración 14: Horario de cierre + doble aceptación
-- Correr: sqlite3 redshow.db < scripts/database/14-add-endtime-dual-accept.sql

-- Horario de cierre del evento
ALTER TABLE bookings ADD COLUMN event_time_end TEXT;

-- Doble aceptación: ambos usuarios deben aceptar antes de matched
ALTER TABLE bookings ADD COLUMN accepted_by_artist BOOLEAN DEFAULT 0;
ALTER TABLE bookings ADD COLUMN accepted_by_owner  BOOLEAN DEFAULT 0;

-- Horario de cierre también en historial
ALTER TABLE booking_negotiations ADD COLUMN new_time_end TEXT;
