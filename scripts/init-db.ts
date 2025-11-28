import fs from "fs"
import path from "path"
import sqlite3 from "sqlite3"

const dbPath = path.join(process.cwd(), "data", "redshow.db")
const sqlPath = path.join(process.cwd(), "scripts", "database", "init.sql")

// Crear carpeta data si no existe
if (!fs.existsSync(path.join(process.cwd(), "data"))) {
  fs.mkdirSync(path.join(process.cwd(), "data"), { recursive: true })
}

// Leer y ejecutar SQL
const sql = fs.readFileSync(sqlPath, "utf-8")
const db = new sqlite3.Database(dbPath)

db.exec(sql, (err) => {
  if (err) {
    console.error("Error inicializando BD:", err)
    process.exit(1)
  } else {
    console.log("Base de datos inicializada correctamente en:", dbPath)
    process.exit(0)
  }
})
