import { runAsync, getAsync, initializeDatabaseIfNeeded } from "@/lib/db"
import { hashPassword } from "@/lib/auth-server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Iniciando registro...")

    await initializeDatabaseIfNeeded()

    const body = await request.json()
    console.log("[v0] Body recibido:", { ...body, password: "***" })

    const { email, password, firstName, lastName, role } = body

    if (!email || !password || !firstName || !lastName || !role) {
      console.log("[v0] Campos faltantes")
      return NextResponse.json({ error: "Campos requeridos faltantes" }, { status: 400 })
    }

    const existingUser = await getAsync("SELECT id FROM users WHERE email = ?", [email])
    if (existingUser) {
      console.log("[v0] Email ya registrado:", email)
      return NextResponse.json({ error: "Email ya registrado" }, { status: 400 })
    }

    console.log("[v0] Hasheando contraseña...")
    const hashedPassword = await hashPassword(password)
    console.log("[v0] Contraseña hasheada correctamente")

    console.log("[v0] Creando usuario en BD...")
    const result = await runAsync(
      "INSERT INTO users (email, password, first_name, last_name, role) VALUES (?, ?, ?, ?, ?)",
      [email, hashedPassword, firstName, lastName, role],
    )
    console.log("[v0] Usuario creado con ID:", result.id)

    console.log("[v0] Creando perfil...")
    await runAsync("INSERT INTO profiles (user_id) VALUES (?)", [result.id])
    console.log("[v0] Perfil creado exitosamente")

    return NextResponse.json(
      {
        message: "Usuario creado exitosamente",
        userId: result.id,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[v0] Error en registro:", error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error("[v0] Mensaje de error:", errorMessage)
    return NextResponse.json(
      { error: `Error: ${errorMessage}` },
      { status: 500 },
    )
  }
}
