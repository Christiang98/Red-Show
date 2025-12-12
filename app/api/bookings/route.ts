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
  } catch (error) {
    console.error("[v0] Error obteniendo bookings:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { artistId, ownerId, eventId, title, description, bookingDate, price } = await request.json()

    console.log("[v0] Creando nuevo booking:", { artistId, ownerId, title })

    const result = await runAsync(
      "INSERT INTO bookings (artist_id, owner_id, event_id, title, description, booking_date, price) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [artistId, ownerId, eventId, title, description, bookingDate, price],
    )

    const artist = await getAsync("SELECT first_name, last_name FROM users WHERE id = ?", [artistId])
    const owner = await getAsync("SELECT first_name, last_name FROM users WHERE id = ?", [ownerId])

    const artistName = `${artist.first_name} ${artist.last_name}`
    const ownerName = `${owner.first_name} ${owner.last_name}`

    // Si quien crea es el artista, notificar al owner. Si quien crea es el owner, notificar al artista.
    const receiverId = ownerId // Por defecto asumimos que el artista crea la solicitud
    const senderName = artistName

    await runAsync(
      `INSERT INTO notifications (user_id, type, title, message, related_id, related_type) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        receiverId,
        "new_booking",
        "Nueva Solicitud de Contratación",
        `${senderName} te ha enviado una solicitud para "${title}"`,
        result.id,
        "booking",
      ],
    )

    console.log("[v0] Booking creado exitosamente con ID:", result.id)
    return NextResponse.json({ id: result.id, message: "Booking creado" }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creando booking:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
