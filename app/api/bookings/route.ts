import { allAsync, runAsync, getAsync } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

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
    const { 
      artistId, 
      ownerId, 
      eventId, 
      title, 
      description, 
      bookingDate, 
      price,
      senderName,
      senderImage,
      senderRole,
      message 
    } = await request.json()

    // Agregar columnas nuevas si no existen
    try {
      await runAsync("ALTER TABLE bookings ADD COLUMN sender_name TEXT", [])
    } catch { /* columna ya existe */ }
    try {
      await runAsync("ALTER TABLE bookings ADD COLUMN sender_image TEXT", [])
    } catch { /* columna ya existe */ }
    try {
      await runAsync("ALTER TABLE bookings ADD COLUMN sender_role TEXT", [])
    } catch { /* columna ya existe */ }
    try {
      await runAsync("ALTER TABLE bookings ADD COLUMN message TEXT", [])
    } catch { /* columna ya existe */ }

    const result = await runAsync(
      `INSERT INTO bookings (artist_id, owner_id, event_id, title, description, booking_date, price, sender_name, sender_image, sender_role, message) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [artistId, ownerId, eventId, title, description, bookingDate, price, senderName, senderImage, senderRole, message],
    )

    const artist = await getAsync("SELECT first_name, last_name FROM users WHERE id = ?", [artistId])
    const owner = await getAsync("SELECT first_name, last_name FROM users WHERE id = ?", [ownerId])

    const artistName = artist ? `${artist.first_name} ${artist.last_name}` : "Usuario"
    const ownerName = owner ? `${owner.first_name} ${owner.last_name}` : "Usuario"

    // Determinar quien recibe la notificacion: el otro usuario (no el que envio)
    // El receiverId es el opuesto al senderId
    let receiverId: number
    let finalSenderName: string
    
    // Comparamos los IDs para determinar quien envio
    // Si el sender es el artistId, notificamos al owner y viceversa
    if (senderRole === "artist") {
      receiverId = ownerId
      finalSenderName = senderName || artistName
    } else {
      receiverId = artistId
      finalSenderName = senderName || ownerName
    }

    const notificationMessage = message 
      ? `${finalSenderName} te ha enviado una solicitud: "${message.substring(0, 100)}${message.length > 100 ? '...' : ''}"`
      : `${finalSenderName} te ha enviado una solicitud de contratacion`

    await runAsync(
      `INSERT INTO notifications (user_id, type, title, message, related_id, related_type) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        receiverId,
        "new_booking",
        "Nueva Solicitud de Contratacion",
        notificationMessage,
        result.id,
        "booking",
      ],
    )

    return NextResponse.json({ id: result.id, message: "Booking creado" }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
