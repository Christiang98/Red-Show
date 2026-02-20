import { type NextRequest, NextResponse } from "next/server"
import { runQuery } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "userId requerido" }, { status: 400 })
    }

    console.log("[v0] Marcando todas las notificaciones como leídas para:", userId)

    await runQuery("UPDATE notifications SET read = true WHERE user_id = ? AND read = false", [userId])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error marcando notificaciones:", error)
    return NextResponse.json({ error: "Error marcando notificaciones" }, { status: 500 })
  }
}
