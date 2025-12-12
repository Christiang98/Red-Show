import { getAsync, initializeDatabaseIfNeeded } from "@/lib/db"
import { verifyPassword } from "@/lib/auth-server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Iniciando login...")
    await initializeDatabaseIfNeeded()

    const { email, password } = await request.json()
    console.log("[v0] Login con email:", email)

    const user = await getAsync("SELECT * FROM users WHERE email = ?", [email])
    if (!user) {
      console.log("[v0] Usuario no encontrado:", email)
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 })
    }

    const isValid = await verifyPassword(password, user.password)
    if (!isValid) {
      console.log("[v0] Contraseña incorrecta para:", email)
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 })
    }

    const token = Buffer.from(`${user.id}:${user.email}`).toString("base64")
    console.log("[v0] Login exitoso para:", email)

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
        },
        token,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("[v0] Error en login:", error)
    return NextResponse.json(
      { error: `Error interno del servidor: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 },
    )
  }
}
