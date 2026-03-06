import { type NextRequest, NextResponse } from "next/server"
import { runQuery } from "@/lib/db"

// PATCH - Actualizar ticket de soporte (solo admin)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { ticketId, status, adminResponse } = body

    if (!ticketId) {
      return NextResponse.json({ error: "ticketId es requerido" }, { status: 400 })
    }

    console.log("[v0] Actualizando ticket:", ticketId)

    await runQuery(
      `UPDATE support_tickets SET status = ?, admin_response = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [status || "in_progress", adminResponse || "", ticketId],
    )

    return NextResponse.json({ success: true, message: "Ticket actualizado" })
  } catch (error) {
    console.error("[v0] Error actualizando ticket:", error)
    return NextResponse.json({ error: "Error actualizando ticket" }, { status: 500 })
  }
}
