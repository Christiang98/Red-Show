-- Migración 13: Sistema de Negociación Limitada
-- Correr: sqlite3 redshow.db < scripts/database/13-add-negotiation-system.sql

-- Campos estructurados en propuestas (reemplaza mensaje libre)
ALTER TABLE bookings ADD COLUMN event_type TEXT;
ALTER TABLE bookings ADD COLUMN estimated_duration TEXT;
ALTER TABLE bookings ADD COLUMN estimated_guests INTEGER;

-- Nuevos estados de negociación
-- Los nuevos status posibles son:
-- pending, negotiating, counter_offer, info_requested,
-- matched, confirmed, rejected, completed, cancelled

-- Tabla de historial de negociación (contraofertas, solicitudes de info, etc.)
CREATE TABLE IF NOT EXISTS booking_negotiations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'initial_proposal',
    'counter_price',
    'counter_datetime',
    'info_request',
    'info_response',
    'accept',
    'reject'
  )),
  -- Datos según el tipo de acción
  price DECIMAL(10,2),
  new_date TEXT,
  new_time TEXT,
  event_type TEXT,
  estimated_duration TEXT,
  estimated_guests INTEGER,
  additional_services TEXT,
  equipment_needed TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_negotiations_booking_id ON booking_negotiations(booking_id);
CREATE INDEX IF NOT EXISTS idx_negotiations_user_id ON booking_negotiations(user_id);
