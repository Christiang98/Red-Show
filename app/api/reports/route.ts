import { type NextRequest, NextResponse } from "next/server"
import { runQuery, allQuery } from "@/lib/db"

// POST - Crear nuevo reporte
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { reporterId, reportedUserId, reason, description } = body

    if (!reporterId || !reportedUserId || !reason || !description) {
      return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 })
    }

    console.log("[v0] Creando reporte de usuario:", reporterId, "contra:", reportedUserId)

    const result = await runQuery(
      `INSERT INTO reports (reporter_id, reported_user_id, reason, description, status) 
       VALUES (?, ?, ?, ?, 'pending')`,
      [reporterId, reportedUserId, reason, description],
    )

    return NextResponse.json({
      success: true,
      message: "Reporte enviado exitosamente",
      reportId: result.id,
    })
  } catch (error) {
    console.error("[v0] Error creando reporte:", error)
    return NextResponse.json({ error: "Error creando reporte" }, { status: 500 })
  }
}

// GET - Obtener reportes (solo para admin)
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId")
    const isAdmin = request.nextUrl.searchParams.get("isAdmin")

    if (isAdmin === "true") {
      // Admin: ver todos los reportes
      const reports = await allQuery(
        `SELECT 
          r.*,
          reporter.email as reporter_email,
          reporter.first_name as reporter_first_name,
          reporter.last_name as reporter_last_name,
          reported.email as reported_email,
          reported.first_name as reported_first_name,
          reported.last_name as reported_last_name
        FROM reports r
        LEFT JOIN users reporter ON r.reporter_id = reporter.id
        LEFT JOIN users reported ON r.reported_user_id = reported.id
        ORDER BY r.created_at DESC`,
        [],
      )

      return NextResponse.json({ reports })
    } else if (userId) {
      // Usuario: ver sus propios reportes
      const reports = await allQuery(
        `SELECT r.*, u.email, u.first_name, u.last_name
        FROM reports r
        LEFT JOIN users u ON r.reported_user_id = u.id
        WHERE r.reporter_id = ?
        ORDER BY r.created_at DESC`,
        [userId],
      )

      return NextResponse.json({ reports })
    }

    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 })
  } catch (error) {
    console.error("[v0] Error obteniendo reportes:", error)
    return NextResponse.json({ error: "Error obteniendo reportes" }, { status: 500 })
  }
}
