import { getAsync, initializeDatabaseIfNeeded } from "@/lib/db"
import { verifyPassword } from "@/lib/auth-server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Iniciando login...")
    await initializeDatabaseIfNeeded()

    const { email, password } = await request.json()
    console.log("[v0] Login con email:", email)

    // JOIN con profiles para obtener el teléfono (guardado en profiles al registrarse en versiones anteriores)
    // También revisamos users.phone que es donde se guarda desde ahora
    const user = await getAsync(
      `SELECT u.*, COALESCE(u.is_active, 1) as is_active, COALESCE(NULLIF(u.phone,''), p.phone, "") as phone_value
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE u.email = ?`,
      [email]
    )
    if (!user) {
      console.log("[v0] Usuario no encontrado:", email)
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 })
    }

    // Verificar si el usuario está dado de baja
    if (user.is_active === 0) {
      console.log("[v0] Usuario bloqueado intentó ingresar:", email)
      return NextResponse.json({ error: "Usuario bloqueado o dado de baja por mala conducta. Por favor contactá a soporte." }, { status: 403 })
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
          phone: user.phone_value || "",
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
