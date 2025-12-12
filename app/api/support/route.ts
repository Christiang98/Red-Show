import { type NextRequest, NextResponse } from "next/server"
import { runQuery, allQuery, initializeDatabaseIfNeeded } from "@/lib/db"

// POST - Crear ticket de soporte
export async function POST(request: NextRequest) {
  try {
    await initializeDatabaseIfNeeded()

    const body = await request.json()
    const { userId, subject, category, message, priority } = body

    console.log("[v0] Datos recibidos para ticket:", { userId, subject, category, message, priority })

    if (!userId || !subject || !category || !message) {
      console.log("[v0] Error: Campos faltantes")
      return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 })
    }

    console.log("[v0] Creando ticket de soporte para usuario:", userId)

    const result = await runQuery(
      `INSERT INTO support_tickets (user_id, subject, category, message, priority, status, created_at) 
       VALUES (?, ?, ?, ?, ?, 'open', datetime('now'))`,
      [userId, subject, category, message, priority || "medium"],
    )

    console.log("[v0] Ticket creado con éxito, ID:", result.id)

    return NextResponse.json({
      success: true,
      message: "Ticket de soporte creado exitosamente",
      ticketId: result.id,
    })
  } catch (error) {
    console.error("[v0] Error creando ticket de soporte:", error)
    return NextResponse.json(
      {
        error: "Error creando ticket de soporte",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

// GET - Obtener tickets de soporte
export async function GET(request: NextRequest) {
  try {
    await initializeDatabaseIfNeeded()

    const userId = request.nextUrl.searchParams.get("userId")
    const isAdmin = request.nextUrl.searchParams.get("isAdmin")

    if (isAdmin === "true") {
      // Admin: ver todos los tickets
      const tickets = await allQuery(
        `SELECT 
          t.*,
          u.email, u.first_name, u.last_name, u.phone
        FROM support_tickets t
        LEFT JOIN users u ON t.user_id = u.id
        ORDER BY 
          CASE 
            WHEN t.priority = 'urgent' THEN 1
            WHEN t.priority = 'high' THEN 2
            WHEN t.priority = 'medium' THEN 3
            ELSE 4
          END,
          t.created_at DESC`,
        [],
      )

      return NextResponse.json({ tickets })
    } else if (userId) {
      // Usuario: ver sus propios tickets
      const tickets = await allQuery(
        `SELECT * FROM support_tickets 
        WHERE user_id = ?
        ORDER BY created_at DESC`,
        [userId],
      )

      return NextResponse.json({ tickets })
    }

    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 })
  } catch (error) {
    console.error("[v0] Error obteniendo tickets:", error)
    return NextResponse.json(
      {
        error: "Error obteniendo tickets",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
