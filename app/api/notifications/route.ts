import { type NextRequest, NextResponse } from "next/server"
import { allQuery, runQuery } from "@/lib/db"

// GET - Obtener notificaciones del usuario
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "userId requerido" }, { status: 400 })
    }

    console.log("[v0] Obteniendo notificaciones para usuario:", userId)

    const notifications = await allQuery(
      `SELECT * FROM notifications 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [userId],
    )

    return NextResponse.json({ notifications })
  } catch (error) {
    console.error("[v0] Error obteniendo notificaciones:", error)
    return NextResponse.json({ error: "Error obteniendo notificaciones" }, { status: 500 })
  }
}

// POST - Crear notificación
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, type, title, message, relatedId, relatedType } = body

    console.log("[v0] Creando notificación para usuario:", userId)

    const result = await runQuery(
      `INSERT INTO notifications (user_id, type, title, message, related_id, related_type, read) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, type, title, message, relatedId || null, relatedType || null, false],
    )

    return NextResponse.json({ success: true, notificationId: result.id }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creando notificación:", error)
    return NextResponse.json({ error: "Error creando notificación" }, { status: 500 })
  }
}
