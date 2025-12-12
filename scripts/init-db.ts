import fs from "fs"
import path from "path"
import { initializeDatabaseIfNeeded } from "../lib/db"

async function main() {
  try {
    console.log("Inicializando base de datos...")
    await initializeDatabaseIfNeeded()
    console.log("Base de datos inicializada correctamente")
    process.exit(0)
  } catch (error) {
    console.error("Error inicializando BD:", error)
    process.exit(1)
  }
}

main()
