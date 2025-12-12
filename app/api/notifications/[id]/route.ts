import { type NextRequest, NextResponse } from "next/server"
import { runQuery } from "@/lib/db"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { read } = body

    console.log("[v0] Actualizando notificación:", params.id)

    await runQuery("UPDATE notifications SET read = ? WHERE id = ?", [read, params.id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error actualizando notificación:", error)
    return NextResponse.json({ error: "Error actualizando notificación" }, { status: 500 })
  }
}
