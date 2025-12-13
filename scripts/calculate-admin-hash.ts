import crypto from "crypto"

// Función para calcular el hash
function hashPassword(password: string): string {
  return crypto
    .createHash("sha256")
    .update(password + "default")
    .digest("hex")
}

// Calcular el hash de "Redshow"
const password = "Redshow"
const hash = hashPassword(password)

console.log("=".repeat(60))
console.log("CALCULANDO HASH DE CONTRASEÑA DE ADMIN")
console.log("=".repeat(60))
console.log("Contraseña:", password)
console.log("Salt:", "default")
console.log("Hash SHA256:", hash)
console.log("=".repeat(60))
console.log("\nUSA ESTE HASH EN LA BASE DE DATOS:")
console.log(hash)
console.log("=".repeat(60))
