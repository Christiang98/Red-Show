import { runAsync, getAsync } from "@/lib/db"
import { hashPassword } from "@/lib/auth-server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName, role } = await request.json()

    // Validar que no exista el email
    const existingUser = await getAsync("SELECT id FROM users WHERE email = ?", [email])
    if (existingUser) {
      return NextResponse.json({ error: "Email ya registrado" }, { status: 400 })
    }

    // Hashear contraseña
    const hashedPassword = await hashPassword(password)

    // Crear usuario
    const result = await runAsync(
      "INSERT INTO users (email, password, first_name, last_name, role) VALUES (?, ?, ?, ?, ?)",
      [email, hashedPassword, firstName, lastName, role],
    )

    // Crear perfil vacío
    await runAsync("INSERT INTO profiles (user_id) VALUES (?)", [result.id])

    return NextResponse.json(
      {
        message: "Usuario creado exitosamente",
        userId: result.id,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[v0] Error en registro:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
