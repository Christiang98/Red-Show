import crypto from "crypto"

// Este script genera el hash correcto para el usuario administrador
// Password: Redshow
// Salt: default (valor por defecto en el sistema)

const password = "Redshow"
const salt = "default"

// Generar hash SHA256 como lo hace el sistema
const hash = crypto
  .createHash("sha256")
  .update(password + salt)
  .digest("hex")

console.log("=".repeat(60))
console.log("HASH PARA USUARIO ADMINISTRADOR")
console.log("=".repeat(60))
console.log("")
console.log("Password:", password)
console.log("Salt:", salt)
console.log("String concatenado:", password + salt)
console.log("")
console.log("Hash SHA256:", hash)
console.log("")
console.log("=".repeat(60))
console.log("Copia este hash al script SQL 09-create-admin-user-fixed.sql")
console.log("=".repeat(60))

// Verificar que el hash funciona
const testHash = crypto
  .createHash("sha256")
  .update("Redshow" + "default")
  .digest("hex")

console.log("")
console.log("Verificación (debe ser igual):", testHash === hash ? "✓ CORRECTO" : "✗ ERROR")
