import { allAsync, runAsync } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    const messages = await allAsync(
      "SELECT * FROM messages WHERE sender_id = ? OR receiver_id = ? ORDER BY created_at DESC",
      [userId, userId],
    )

    return NextResponse.json(messages, { status: 200 })
  } catch (error) {
    console.error("[v0] Error obteniendo mensajes:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { senderId, receiverId, content } = await request.json()

    const result = await runAsync("INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)", [
      senderId,
      receiverId,
      content,
    ])

    return NextResponse.json({ id: result.id, message: "Mensaje enviado" }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error enviando mensaje:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
