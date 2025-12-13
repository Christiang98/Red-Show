import crypto from "crypto"

// Generar el hash correcto para la contraseña "Redshow"
const password = "Redshow"
const salt = "default"

const hash = crypto
  .createHash("sha256")
  .update(password + salt)
  .digest("hex")

console.log("Password:", password)
console.log("Salt:", salt)
console.log("Hash:", hash)

// Verificación
const verifyHash = crypto
  .createHash("sha256")
  .update("Redshow" + "default")
  .digest("hex")

console.log("\nVerificación:")
console.log("Hash calculado:", verifyHash)
console.log("Hashes coinciden:", hash === verifyHash)
