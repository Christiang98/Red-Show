import crypto from "crypto"

// Generar hash de la contraseña "Redshow"
const password = "Redshow"
const salt = process.env.SALT || "default"

const hash = crypto
  .createHash("sha256")
  .update(password + salt)
  .digest("hex")

console.log("Password:", password)
console.log("Hash SHA256:", hash)
console.log("\nCopia este hash en el script SQL para crear el usuario administrador")
