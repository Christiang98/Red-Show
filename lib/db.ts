import sqlite3 from "sqlite3"
import path from "path"
import fs from "fs"

const dataDir = path.join(process.cwd(), "data")
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const dbPath = path.join(dataDir, "redshow.db")

let db: sqlite3.Database | null = null
let initialized = false

// Internal promisified sqlite3 methods (require db parameter)
function _runAsync(dbInstance: sqlite3.Database, sql: string, params: any[] = []): Promise<{ id: number; changes: number }> {
  return new Promise((resolve, reject) => {
    dbInstance.run(sql, params, function (err) {
      if (err) reject(err)
      else resolve({ id: this.lastID, changes: this.changes })
    })
  })
}

function _getAsync(dbInstance: sqlite3.Database, sql: string, params: any[] = []): Promise<any> {
  return new Promise((resolve, reject) => {
    dbInstance.get(sql, params, (err, row) => {
      if (err) reject(err)
      else resolve(row)
    })
  })
}

function _allAsync(dbInstance: sqlite3.Database, sql: string, params: any[] = []): Promise<any[]> {
  return new Promise((resolve, reject) => {
    dbInstance.all(sql, params, (err, rows) => {
      if (err) reject(err)
      else resolve(rows)
    })
  })
}

function _execAsync(dbInstance: sqlite3.Database, sql: string): Promise<void> {
  return new Promise((resolve, reject) => {
    dbInstance.exec(sql, (err) => {
      if (err) reject(err)
      else resolve()
    })
  })
}

export async function initializeDatabaseIfNeeded(): Promise<void> {
  if (initialized && db) return

  return new Promise((resolve, reject) => {
    try {
      console.log("[DB] Inicializando base de datos SQLite en:", dbPath)

      const newDb = new sqlite3.Database(dbPath, async (err) => {
        if (err) {
          console.error("[DB] Error abriendo base de datos:", err)
          reject(err)
          return
        }

        try {
          // Crear las tablas si no existen
          const schema = `
            CREATE TABLE IF NOT EXISTS users (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              email VARCHAR(255) UNIQUE NOT NULL,
              password VARCHAR(255) NOT NULL,
              first_name VARCHAR(100),
              last_name VARCHAR(100),
              role VARCHAR(20) CHECK (role IN ('owner', 'artist', 'organizer', 'admin')),
              phone VARCHAR(20),
              is_active BOOLEAN DEFAULT 1,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS profiles (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              user_id INTEGER NOT NULL UNIQUE,
              bio TEXT,
              location VARCHAR(255),
              avatar_url TEXT,
              phone VARCHAR(20),
              instagram VARCHAR(255),
              tiktok VARCHAR(255),
              facebook VARCHAR(255),
              other_social VARCHAR(255),
              rating DECIMAL(3,2) DEFAULT 0,
              verified BOOLEAN DEFAULT 0,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS owner_profiles (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              user_id INTEGER NOT NULL UNIQUE,
              business_name VARCHAR(255),
              business_type VARCHAR(100),
              other_business_type VARCHAR(255),
              city VARCHAR(255),
              neighborhood VARCHAR(255),
              address VARCHAR(255),
              capacity INTEGER,
              description TEXT,
              business_hours VARCHAR(255),
              business_hours_data TEXT DEFAULT '[]',
              additional_services TEXT,
              services TEXT DEFAULT '[]',
              policies TEXT,
              cuit_cuil VARCHAR(20),
              profile_image TEXT,
              featured_image TEXT,
              gallery_images TEXT DEFAULT '[]',
              is_published BOOLEAN DEFAULT 0,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS artist_profiles (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              user_id INTEGER NOT NULL UNIQUE,
              artist_name VARCHAR(255),
              stage_name VARCHAR(255),
              category VARCHAR(100),
              other_category VARCHAR(255),
              service_type VARCHAR(255),
              price_range VARCHAR(100),
              years_of_experience INTEGER,
              experience_years INTEGER DEFAULT 0,
              portfolio_url VARCHAR(255),
              description TEXT,
              bio TEXT,
              neighborhood VARCHAR(255),
              availability TEXT,
              profile_image TEXT,
              portfolio_images TEXT,
              is_published BOOLEAN DEFAULT 0,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS events (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              owner_id INTEGER NOT NULL,
              title VARCHAR(255) NOT NULL,
              description TEXT,
              category VARCHAR(100),
              location VARCHAR(255),
              event_date DATETIME,
              capacity INTEGER,
              price DECIMAL(10,2),
              image_url VARCHAR(255),
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS bookings (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              artist_id INTEGER NOT NULL,
              owner_id INTEGER NOT NULL,
              event_id INTEGER,
              title VARCHAR(255),
              description TEXT,
              booking_date DATETIME,
              event_date DATE,
              message TEXT,
              sender_name VARCHAR(255),
              sender_image TEXT,
              sender_role VARCHAR(50),
              status VARCHAR(20) CHECK (status IN ('pending', 'negotiating', 'matched', 'confirmed', 'rejected', 'completed', 'cancelled', 'accepted')) DEFAULT 'pending',
              price DECIMAL(10,2),
              commission_paid BOOLEAN DEFAULT 0,
              confirmed_at DATETIME,
              payment_method VARCHAR(50),
              payment_amount DECIMAL(10,2),
              payment_date DATETIME,
              payment_reference VARCHAR(50),
              payment_status VARCHAR(20),
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (artist_id) REFERENCES users(id) ON DELETE CASCADE,
              FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
              FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL
            );

            CREATE TABLE IF NOT EXISTS messages (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              sender_id INTEGER NOT NULL,
              receiver_id INTEGER NOT NULL,
              content TEXT NOT NULL,
              read BOOLEAN DEFAULT 0,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
              FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS reviews (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              reviewer_id INTEGER NOT NULL,
              reviewed_user_id INTEGER NOT NULL,
              booking_id INTEGER,
              rating INTEGER CHECK (rating >= 1 AND rating <= 5),
              comment TEXT,
              is_visible BOOLEAN DEFAULT 1,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
              FOREIGN KEY (reviewed_user_id) REFERENCES users(id) ON DELETE CASCADE,
              FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL
            );

            CREATE TABLE IF NOT EXISTS reports (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              reporter_id INTEGER NOT NULL,
              reported_user_id INTEGER NOT NULL,
              reason VARCHAR(100) NOT NULL,
              description TEXT NOT NULL,
              image_url TEXT,
              status VARCHAR(20) CHECK (status IN ('pending', 'under_review', 'resolved', 'dismissed')) DEFAULT 'pending',
              admin_notes TEXT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
              FOREIGN KEY (reported_user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS support_tickets (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              user_id INTEGER NOT NULL,
              subject VARCHAR(255) NOT NULL,
              category VARCHAR(100) NOT NULL,
              message TEXT NOT NULL,
              image_url TEXT,
              priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
              status VARCHAR(20) CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')) DEFAULT 'open',
              admin_response TEXT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS notifications (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              user_id INTEGER NOT NULL,
              type VARCHAR(50) NOT NULL,
              title VARCHAR(255) NOT NULL,
              message TEXT NOT NULL,
              related_id INTEGER,
              related_type VARCHAR(50),
              read BOOLEAN DEFAULT 0,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
            CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
            CREATE INDEX IF NOT EXISTS idx_profiles_user ON profiles(user_id);
            CREATE INDEX IF NOT EXISTS idx_owner_profiles_user ON owner_profiles(user_id);
            CREATE INDEX IF NOT EXISTS idx_artist_profiles_user ON artist_profiles(user_id);
            CREATE INDEX IF NOT EXISTS idx_owner_profiles_published ON owner_profiles(is_published);
            CREATE INDEX IF NOT EXISTS idx_artist_profiles_published ON artist_profiles(is_published);
            CREATE INDEX IF NOT EXISTS idx_events_owner_id ON events(owner_id);
            CREATE INDEX IF NOT EXISTS idx_bookings_artist_id ON bookings(artist_id);
            CREATE INDEX IF NOT EXISTS idx_bookings_owner_id ON bookings(owner_id);
            CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
            CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
            CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
            CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON reviews(reviewer_id);
            CREATE INDEX IF NOT EXISTS idx_reviews_reviewed_user ON reviews(reviewed_user_id);
            CREATE INDEX IF NOT EXISTS idx_reviews_visible ON reviews(is_visible);
            CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
            CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id);
            CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
            CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read);
            CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
          `

          await _execAsync(newDb, schema)

          const crypto = await import("crypto")
          const adminPasswordHash = crypto
            .createHash("sha256")
            .update("Redshow" + "default")
            .digest("hex")

          const existingAdmin = await _getAsync(newDb, "SELECT id FROM users WHERE email = ?", ["cgarcia@pioix.edu.ar"])

          if (!existingAdmin) {
            console.log("[DB] Creando usuario administrador por defecto...")

            await _runAsync(
              newDb,
              `INSERT INTO users (email, password, first_name, last_name, role, phone, is_active, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))`,
              ["cgarcia@pioix.edu.ar", adminPasswordHash, "Carlos", "Garcia", "admin", "1234567890"],
            )

            const adminUser = await _getAsync(newDb, "SELECT id FROM users WHERE email = ?", ["cgarcia@pioix.edu.ar"])

            if (adminUser) {
              await _runAsync(
                newDb,
                `INSERT INTO profiles (user_id, bio, location, verified, created_at, updated_at)
                 VALUES (?, ?, ?, 1, datetime('now'), datetime('now'))`,
                [adminUser.id, "Administrador Principal de Red Show - Sistema de Gestion", "Buenos Aires, Argentina"],
              )

              console.log("[DB] Usuario administrador creado exitosamente")
              console.log("[DB] Email: cgarcia@pioix.edu.ar")
              console.log("[DB] Contrasena: Redshow")
            }
          } else {
            console.log("[DB] Usuario administrador ya existe en la base de datos")
          }

          // ── Migraciones automáticas ──────────────────────────────────
          // Agregan columnas nuevas si no existen (seguro correr múltiples veces)
          const autoMigrations = [
            "ALTER TABLE bookings ADD COLUMN sender_name TEXT",
            "ALTER TABLE bookings ADD COLUMN sender_image TEXT",
            "ALTER TABLE bookings ADD COLUMN sender_role TEXT",
            "ALTER TABLE bookings ADD COLUMN message TEXT",
            "ALTER TABLE bookings ADD COLUMN commission_paid BOOLEAN DEFAULT 0",
            "ALTER TABLE bookings ADD COLUMN confirmed_at DATETIME",
            "ALTER TABLE bookings ADD COLUMN payment_method VARCHAR(50)",
            "ALTER TABLE bookings ADD COLUMN payment_amount DECIMAL(10,2)",
            "ALTER TABLE bookings ADD COLUMN payment_date DATETIME",
            "ALTER TABLE bookings ADD COLUMN payment_reference VARCHAR(50)",
            "ALTER TABLE bookings ADD COLUMN payment_status VARCHAR(20)",
            "ALTER TABLE bookings ADD COLUMN event_time TEXT",
            "ALTER TABLE bookings ADD COLUMN proposed_price DECIMAL(10,2)",
            "ALTER TABLE bookings ADD COLUMN event_time_end TEXT",
            "ALTER TABLE bookings ADD COLUMN event_type TEXT",
            "ALTER TABLE bookings ADD COLUMN estimated_duration TEXT",
            "ALTER TABLE bookings ADD COLUMN estimated_guests INTEGER",
            "ALTER TABLE bookings ADD COLUMN accepted_by_artist BOOLEAN DEFAULT 0",
            "ALTER TABLE bookings ADD COLUMN accepted_by_owner BOOLEAN DEFAULT 0",
            "ALTER TABLE bookings ADD COLUMN last_action_by INTEGER",
            "ALTER TABLE reviews ADD COLUMN is_visible BOOLEAN DEFAULT 1",
            "ALTER TABLE users ADD COLUMN is_sanctioned BOOLEAN DEFAULT 0",
            "ALTER TABLE users ADD COLUMN sanction_reason TEXT",
            "ALTER TABLE users ADD COLUMN sanction_start DATETIME",
            "ALTER TABLE users ADD COLUMN sanction_end DATETIME",
          ]
          for (const migSql of autoMigrations) {
            try { await _runAsync(newDb, migSql, []) } catch { /* columna ya existe, ok */ }
          }
          // ── Auto-reparar CHECK constraint si es versión vieja (sin 'negotiating') ──
          try {
            const tbl = await _getAsync(newDb, "SELECT sql FROM sqlite_master WHERE type='table' AND name='bookings'", [])
            if (tbl?.sql && !tbl.sql.includes("'negotiating'")) {
              console.log("[DB] Detectado CHECK constraint viejo — migrando tabla bookings...")
              await _runAsync(newDb, "PRAGMA foreign_keys = OFF", [])
              await _runAsync(newDb, "ALTER TABLE bookings RENAME TO bookings_old_constraint", [])
              await _execAsync(newDb, `CREATE TABLE bookings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                artist_id INTEGER NOT NULL, owner_id INTEGER NOT NULL, event_id INTEGER,
                title VARCHAR(255), description TEXT, booking_date DATETIME, event_date DATE,
                message TEXT, sender_name TEXT, sender_image TEXT, sender_role TEXT,
                status VARCHAR(20) CHECK (status IN (
                  'pending','negotiating','matched','confirmed','accepted','rejected','completed','cancelled'
                )) DEFAULT 'pending',
                price DECIMAL(10,2), proposed_price DECIMAL(10,2),
                commission_paid BOOLEAN DEFAULT 0, confirmed_at DATETIME,
                payment_method VARCHAR(50), payment_amount DECIMAL(10,2),
                payment_date DATETIME, payment_reference VARCHAR(50), payment_status VARCHAR(20),
                event_time TEXT, event_time_end TEXT, event_type TEXT,
                estimated_duration TEXT, estimated_guests INTEGER,
                accepted_by_artist BOOLEAN DEFAULT 0, accepted_by_owner BOOLEAN DEFAULT 0,
                last_action_by INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (artist_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL
              )`)
              // Copiar datos existentes — mapear 'accepted' viejo a 'matched'
              await _runAsync(newDb, `INSERT INTO bookings
                SELECT id, artist_id, owner_id, event_id, title, description,
                  booking_date, event_date, message, sender_name, sender_image, sender_role,
                  CASE status WHEN 'accepted' THEN 'matched' ELSE status END,
                  price, proposed_price, commission_paid, confirmed_at,
                  payment_method, payment_amount, payment_date, payment_reference, payment_status,
                  event_time, event_time_end, event_type, estimated_duration, estimated_guests,
                  accepted_by_artist, accepted_by_owner, last_action_by,
                  created_at, updated_at
                FROM bookings_old_constraint`, [])
              await _runAsync(newDb, "DROP TABLE bookings_old_constraint", [])
              await _runAsync(newDb, "PRAGMA foreign_keys = ON", [])
              console.log("[DB] CHECK constraint actualizado correctamente")
            }
          } catch (constraintErr) {
            console.error("[DB] Error verificando/actualizando constraint:", constraintErr)
          }
          console.log("[DB] Migraciones automáticas aplicadas")

          db = newDb
          initialized = true
          console.log("[DB] Base de datos SQLite inicializada correctamente")
          resolve()
        } catch (initError) {
          console.error("[DB] Error inicializando schema:", initError)
          reject(initError)
        }
      })
    } catch (error) {
      console.error("[DB] Error creando base de datos:", error)
      reject(error)
    }
  })
}

// Exported wrapper functions - these handle db initialization automatically
// API routes import these directly: import { runAsync, getAsync, allAsync } from "@/lib/db"

export async function runAsync(sql: string, params: any[] = []): Promise<{ id: number; changes: number }> {
  if (!db) await initializeDatabaseIfNeeded()
  if (!db) throw new Error("Database not initialized")
  return _runAsync(db, sql, params)
}

export async function getAsync(sql: string, params: any[] = []): Promise<any> {
  if (!db) await initializeDatabaseIfNeeded()
  if (!db) throw new Error("Database not initialized")
  return _getAsync(db, sql, params)
}

export async function allAsync(sql: string, params: any[] = []): Promise<any[]> {
  if (!db) await initializeDatabaseIfNeeded()
  if (!db) throw new Error("Database not initialized")
  return _allAsync(db, sql, params)
}

// Legacy aliases for backward compatibility
export const runQuery = runAsync
export const getQuery = getAsync
export const allQuery = allAsync
