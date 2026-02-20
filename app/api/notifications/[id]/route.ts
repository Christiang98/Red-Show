import { type NextRequest, NextResponse } from "next/server"
import { runQuery } from "@/lib/db"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: notifId } = await params
    const body = await request.json()
    const { read } = body

    await runQuery("UPDATE notifications SET read = ? WHERE id = ?", [read, notifId])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error actualizando notificación:", error)
    return NextResponse.json({ error: "Error actualizando notificación" }, { status: 500 })
  }
}
