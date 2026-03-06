import { allAsync, runAsync } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    // JOIN con users y profiles para obtener nombre y avatar
    const messages = await allAsync(
      `SELECT 
        m.*,
        s.first_name as sender_first_name,
        s.last_name as sender_last_name,
        sp.avatar_url as sender_avatar,
        sop.profile_image as sender_owner_image,
        sap.profile_image as sender_artist_image,
        r.first_name as receiver_first_name,
        r.last_name as receiver_last_name,
        rp.avatar_url as receiver_avatar,
        rop.profile_image as receiver_owner_image,
        rap.profile_image as receiver_artist_image
      FROM messages m
      LEFT JOIN users s ON m.sender_id = s.id
      LEFT JOIN profiles sp ON m.sender_id = sp.user_id
      LEFT JOIN owner_profiles sop ON m.sender_id = sop.user_id
      LEFT JOIN artist_profiles sap ON m.sender_id = sap.user_id
      LEFT JOIN users r ON m.receiver_id = r.id
      LEFT JOIN profiles rp ON m.receiver_id = rp.user_id
      LEFT JOIN owner_profiles rop ON m.receiver_id = rop.user_id
      LEFT JOIN artist_profiles rap ON m.receiver_id = rap.user_id
      WHERE m.sender_id = ? OR m.receiver_id = ? 
      ORDER BY m.created_at DESC`,
      [userId, userId],
    )

    // Transformar para incluir nombre y avatar calculados
    const enrichedMessages = messages.map((msg: any) => ({
      ...msg,
      sender_name: `${msg.sender_first_name || ""} ${msg.sender_last_name || ""}`.trim() || `Usuario ${msg.sender_id}`,
      sender_avatar: msg.sender_owner_image || msg.sender_artist_image || msg.sender_avatar || null,
      receiver_name: `${msg.receiver_first_name || ""} ${msg.receiver_last_name || ""}`.trim() || `Usuario ${msg.receiver_id}`,
      receiver_avatar: msg.receiver_owner_image || msg.receiver_artist_image || msg.receiver_avatar || null,
    }))

    return NextResponse.json(enrichedMessages, { status: 200 })
  } catch {
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
  } catch {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
