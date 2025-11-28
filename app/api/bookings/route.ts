import { allAsync, runAsync } from "@/lib/db"
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

    const result = await runAsync(
      "INSERT INTO bookings (artist_id, owner_id, event_id, title, description, booking_date, price) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [artistId, ownerId, eventId, title, description, bookingDate, price],
    )

    return NextResponse.json({ id: result.id, message: "Booking creado" }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creando booking:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
