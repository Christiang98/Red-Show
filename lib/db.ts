import sqlite3 from "sqlite3"
import path from "path"

const dbPath = path.join(process.cwd(), "data", "redshow.db")

// Singleton para la conexión
let db: sqlite3.Database | null = null

export function getDatabase(): sqlite3.Database {
  if (!db) {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error("[v0] Error de conexión a BD:", err)
      } else {
        console.log("[v0] Conectado a BD SQLite:", dbPath)
      }
    })
    db.configure("busyTimeout", 5000)
  }
  return db
}

export function runAsync(sql: string, params: any[] = []): Promise<any> {
  return new Promise((resolve, reject) => {
    getDatabase().run(sql, params, function (err) {
      if (err) reject(err)
      else resolve({ id: this.lastID, changes: this.changes })
    })
  })
}

export function getAsync(sql: string, params: any[] = []): Promise<any> {
  return new Promise((resolve, reject) => {
    getDatabase().get(sql, params, (err, row) => {
      if (err) reject(err)
      else resolve(row)
    })
  })
}

export function allAsync(sql: string, params: any[] = []): Promise<any[]> {
  return new Promise((resolve, reject) => {
    getDatabase().all(sql, params, (err, rows) => {
      if (err) reject(err)
      else resolve(rows || [])
    })
  })
}
