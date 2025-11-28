import { getAsync, runAsync } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { status } = await request.json()

    await runAsync("UPDATE bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [status, params.id])

    const booking = await getAsync("SELECT * FROM bookings WHERE id = ?", [params.id])
    return NextResponse.json(booking, { status: 200 })
  } catch (error) {
    console.error("[v0] Error actualizando booking:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
