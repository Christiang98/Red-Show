import { type NextRequest, NextResponse } from "next/server"
import { allQuery, runQuery } from "@/lib/db"

// GET - Obtener notificaciones del usuario
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "userId requerido" }, { status: 400 })
    }

    const notifications = await allQuery(
      `SELECT * FROM notifications 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [userId],
    )

    return NextResponse.json({ notifications })
  } catch {
    return NextResponse.json({ error: "Error obteniendo notificaciones" }, { status: 500 })
  }
}

// POST - Crear notificación
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, type, title, message, relatedId, relatedType } = body

    const result = await runQuery(
      `INSERT INTO notifications (user_id, type, title, message, related_id, related_type, read) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, type, title, message, relatedId || null, relatedType || null, false],
    )

    return NextResponse.json({ success: true, notificationId: result.id }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Error creando notificacion" }, { status: 500 })
  }
}
