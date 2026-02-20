import crypto from "crypto"

export async function hashPassword(password: string): Promise<string> {
  return crypto
    .createHash("sha256")
    .update(password + (process.env.SALT || "default"))
    .digest("hex")
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const hashedPassword = crypto
    .createHash("sha256")
    .update(password + (process.env.SALT || "default"))
    .digest("hex")
  return hashedPassword === hash
}
