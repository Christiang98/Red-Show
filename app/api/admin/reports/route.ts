import { type NextRequest, NextResponse } from "next/server"
import { runQuery } from "@/lib/db"

// PATCH - Actualizar estado de reporte (solo admin)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { reportId, status, adminNotes } = body

    if (!reportId || !status) {
      return NextResponse.json({ error: "reportId y status son requeridos" }, { status: 400 })
    }

    console.log("[v0] Actualizando reporte:", reportId, "nuevo estado:", status)

    await runQuery(`UPDATE reports SET status = ?, admin_notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [
      status,
      adminNotes || "",
      reportId,
    ])

    return NextResponse.json({ success: true, message: "Reporte actualizado" })
  } catch (error) {
    console.error("[v0] Error actualizando reporte:", error)
    return NextResponse.json({ error: "Error actualizando reporte" }, { status: 500 })
  }
}
