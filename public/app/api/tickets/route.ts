import { allAsync, runAsync, getAsync } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

async function ensureTicketsTable() {
  try {
    await runAsync(`CREATE TABLE IF NOT EXISTS event_tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      user_email TEXT NOT NULL,
      user_name TEXT,
      quantity INTEGER DEFAULT 1,
      unit_price DECIMAL(10,2) DEFAULT 0,
      total_price DECIMAL(10,2) DEFAULT 0,
      payment_method TEXT,
      qr_code TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    )`, [])
  } catch {}
}

function generateQRCode(ticketId: number, eventId: number, userId: number): string {
  const data = `REDSHOW-TICKET-${ticketId}-EVENT-${eventId}-USER-${userId}-${Date.now()}`
  return data
}

// GET: obtener entradas del usuario
export async function GET(request: NextRequest) {
  try {
    await ensureTicketsTable()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const eventId = searchParams.get("eventId")

    if (!userId && !eventId) {
      return NextResponse.json({ error: "userId o eventId requerido" }, { status: 400 })
    }

    let query = `
      SELECT t.*,
        e.title as event_title,
        e.event_date,
        e.event_time,
        e.event_time_end,
        e.location as event_location,
        e.category as event_category,
        e.image_url as event_image,
        COALESCE(op.business_name, ap.stage_name, u2.first_name || ' ' || u2.last_name) as organizer_name
      FROM event_tickets t
      JOIN events e ON t.event_id = e.id
      LEFT JOIN users u2 ON (COALESCE(e.user_id, e.owner_id) = u2.id)
      LEFT JOIN owner_profiles op ON u2.id = op.user_id
      LEFT JOIN artist_profiles ap ON u2.id = ap.user_id
    `
    const params: any[] = []

    if (userId) {
      query += " WHERE t.user_id = ? ORDER BY t.created_at DESC"
      params.push(userId)
    } else {
      query += " WHERE t.event_id = ? ORDER BY t.created_at DESC"
      params.push(eventId)
    }

    const tickets = await allAsync(query, params)
    return NextResponse.json(tickets, { status: 200 })
  } catch (error) {
    console.error("[tickets] GET:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

// POST: comprar entrada
export async function POST(request: NextRequest) {
  try {
    await ensureTicketsTable()
    const body = await request.json()
    const { eventId, userId, userEmail, userName, quantity = 1, paymentMethod } = body

    if (!eventId || !userId || !userEmail) {
      return NextResponse.json({ error: "eventId, userId y userEmail son requeridos" }, { status: 400 })
    }

    // Obtener datos del evento
    const event = await getAsync(
      "SELECT * FROM events WHERE id = ?",
      [eventId]
    )
    if (!event) {
      return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 })
    }

    const unitPrice = parseFloat(event.price) || 0
    const totalPrice = unitPrice * quantity
    const qrData = `REDSHOW-TICKET-PENDING-EVENT-${eventId}-USER-${userId}-${Date.now()}`

    const result = await runAsync(
      `INSERT INTO event_tickets (event_id, user_id, user_email, user_name, quantity, unit_price, total_price, payment_method, qr_code)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [eventId, userId, userEmail, userName, quantity, unitPrice, totalPrice, paymentMethod, qrData]
    )

    const ticketId = result.id
    const finalQrCode = `REDSHOW-TICKET-${ticketId}-EVENT-${eventId}-USER-${userId}`
    await runAsync("UPDATE event_tickets SET qr_code = ? WHERE id = ?", [finalQrCode, ticketId])

    return NextResponse.json({
      id: ticketId,
      qrCode: finalQrCode,
      eventTitle: event.title,
      totalPrice,
      message: "Entrada comprada exitosamente"
    }, { status: 201 })
  } catch (error) {
    console.error("[tickets] POST:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
