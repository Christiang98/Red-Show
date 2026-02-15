import { allAsync, runAsync, getAsync } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

async function ensureColumns() {
  const migrations = [
    "ALTER TABLE bookings ADD COLUMN sender_name TEXT",
    "ALTER TABLE bookings ADD COLUMN sender_image TEXT",
    "ALTER TABLE bookings ADD COLUMN sender_role TEXT",
    "ALTER TABLE bookings ADD COLUMN message TEXT",
    "ALTER TABLE bookings ADD COLUMN commission_paid BOOLEAN DEFAULT 0",
    "ALTER TABLE bookings ADD COLUMN confirmed_at DATETIME",
    "ALTER TABLE bookings ADD COLUMN payment_method VARCHAR(50)",
    "ALTER TABLE bookings ADD COLUMN payment_amount DECIMAL(10,2)",
    "ALTER TABLE bookings ADD COLUMN payment_date DATETIME",
    "ALTER TABLE bookings ADD COLUMN payment_reference VARCHAR(50)",
    "ALTER TABLE bookings ADD COLUMN payment_status VARCHAR(20)",
  ]
  for (const sql of migrations) {
    try { await runAsync(sql, []) } catch { /* ya existe */ }
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const status = searchParams.get("status")

    let query = "SELECT * FROM bookings WHERE 1=1"
    const params: any[] = []

    if (userId) {
      query += " AND (artist_id = ? OR owner_id = ?)"
      params.push(userId, userId)
    }
    if (status) {
      query += " AND status = ?"
      params.push(status)
    }

    query += " ORDER BY created_at DESC"
    const bookings = await allAsync(query, params)
    return NextResponse.json(bookings, { status: 200 })
  } catch {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureColumns()

    const {
      artistId, ownerId, eventId, title, description,
      bookingDate, price, senderName, senderImage, senderRole, message,
    } = await request.json()

    const result = await runAsync(
      `INSERT INTO bookings
        (artist_id, owner_id, event_id, title, description, booking_date, price,
         sender_name, sender_image, sender_role, message, status, commission_paid)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0)`,
      [artistId, ownerId, eventId, title, description, bookingDate, price,
       senderName, senderImage, senderRole, message],
    )

    const artist = await getAsync("SELECT first_name, last_name FROM users WHERE id = ?", [artistId])
    const owner  = await getAsync("SELECT first_name, last_name FROM users WHERE id = ?", [ownerId])
    const artistName = artist ? `${artist.first_name} ${artist.last_name}` : "Usuario"
    const ownerName  = owner  ? `${owner.first_name} ${owner.last_name}`   : "Usuario"

    const receiverId = senderRole === "artist" ? ownerId : artistId
    const finalSenderName = senderRole === "artist" ? (senderName || artistName) : (senderName || ownerName)

    const notifMsg = message
      ? `${finalSenderName} te envió una propuesta: "${message.substring(0, 100)}${message.length > 100 ? "..." : ""}"`
      : `${finalSenderName} te envió una propuesta de contratación`

    await runAsync(
      `INSERT INTO notifications (user_id, type, title, message, related_id, related_type) VALUES (?, ?, ?, ?, ?, ?)`,
      [receiverId, "new_booking", "Nueva Propuesta de Contratación", notifMsg, result.id, "booking"],
    )

    return NextResponse.json({ id: result.id, message: "Propuesta creada" }, { status: 201 })
  } catch (e: any) {
    console.error("[bookings POST]", e)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
