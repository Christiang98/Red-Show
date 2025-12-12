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

// Promisify sqlite3 methods for async/await support
function runAsync(db: sqlite3.Database, sql: string, params: any[] = []): Promise<{ id: number; changes: number }> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err)
      else resolve({ id: this.lastID, changes: this.changes })
    })
  })
}

function getAsync(db: sqlite3.Database, sql: string, params: any[] = []): Promise<any> {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err)
      else resolve(row)
    })
  })
}

function allAsync(db: sqlite3.Database, sql: string, params: any[] = []): Promise<any[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err)
      else resolve(rows)
    })
  })
}

function execAsync(db: sqlite3.Database, sql: string): Promise<void> {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) reject(err)
      else resolve()
    })
  })
}

export async function initializeDatabaseIfNeeded(): Promise<void> {
  if (initialized && db) return

  return new Promise((resolve, reject) => {
    try {
      console.log("[v0] Inicializando base de datos SQLite en:", dbPath)

      const newDb = new sqlite3.Database(dbPath, async (err) => {
        if (err) {
          console.error("[v0] Error abriendo base de datos:", err)
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
              business_hours_data TEXT,
              additional_services TEXT,
              services TEXT,
              policies TEXT,
              cuit_cuil VARCHAR(20),
              profile_image TEXT,
              featured_image TEXT,
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
              status VARCHAR(20) CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')) DEFAULT 'pending',
              price DECIMAL(10,2),
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
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
              FOREIGN KEY (reviewed_user_id) REFERENCES users(id) ON DELETE CASCADE,
              FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL
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
            CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read);
            CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
          `

          await execAsync(newDb, schema)

          db = newDb
          initialized = true
          console.log("[v0] Base de datos SQLite inicializada correctamente")
          console.log(
            "[v0] Tablas creadas: users, profiles, owner_profiles, artist_profiles, events, bookings, messages, reviews, notifications",
          )
          resolve()
        } catch (initError) {
          console.error("[v0] Error inicializando schema:", initError)
          reject(initError)
        }
      })
    } catch (error) {
      console.error("[v0] Error creando base de datos:", error)
      reject(error)
    }
  })
}

export async function runQuery(sql: string, params: any[] = []): Promise<{ id: number; changes: number }> {
  if (!db) await initializeDatabaseIfNeeded()
  if (!db) throw new Error("Database not initialized")

  return runAsync(db, sql, params)
}

export async function getQuery(sql: string, params: any[] = []): Promise<any> {
  if (!db) await initializeDatabaseIfNeeded()
  if (!db) throw new Error("Database not initialized")

  return getAsync(db, sql, params)
}

export async function allQuery(sql: string, params: any[] = []): Promise<any[]> {
  if (!db) await initializeDatabaseIfNeeded()
  if (!db) throw new Error("Database not initialized")

  return allAsync(db, sql, params)
}

// Export aliases to match existing API
export { runQuery as runAsync, getQuery as getAsync, allQuery as allAsync, allQuery as getAllAsync }
