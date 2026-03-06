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
    "ALTER TABLE bookings ADD COLUMN event_time TEXT",
    "ALTER TABLE bookings ADD COLUMN proposed_price DECIMAL(10,2)",
    "ALTER TABLE bookings ADD COLUMN event_type TEXT",
    "ALTER TABLE bookings ADD COLUMN estimated_duration TEXT",
    "ALTER TABLE bookings ADD COLUMN estimated_guests INTEGER",
    "ALTER TABLE bookings ADD COLUMN event_time_end TEXT",
    "ALTER TABLE bookings ADD COLUMN accepted_by_artist BOOLEAN DEFAULT 0",
    "ALTER TABLE bookings ADD COLUMN accepted_by_owner  BOOLEAN DEFAULT 0",
    "ALTER TABLE bookings ADD COLUMN last_action_by INTEGER",
  ]
  for (const sql of migrations) {
    try { await runAsync(sql, []) } catch { /* ya existe */ }
  }

  await runAsync(`
    CREATE TABLE IF NOT EXISTS booking_negotiations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      action_type TEXT NOT NULL,
      price DECIMAL(10,2),
      new_date TEXT,
      new_time TEXT,
      new_time_end TEXT,
      event_type TEXT,
      estimated_duration TEXT,
      estimated_guests INTEGER,
      additional_services TEXT,
      equipment_needed TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `, [])
  try {
    await runAsync("ALTER TABLE booking_negotiations ADD COLUMN new_time_end TEXT", [])
  } catch {}
  try {
    await runAsync("CREATE INDEX IF NOT EXISTS idx_neg_booking_id ON booking_negotiations(booking_id)", [])
  } catch {}
}

export async function GET(request: NextRequest) {
  try {
    await ensureColumns()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const status = searchParams.get("status")
    let query = "SELECT * FROM bookings WHERE 1=1"
    const params: any[] = []
    if (userId) { query += " AND (artist_id = ? OR owner_id = ?)"; params.push(userId, userId) }
    if (status) { query += " AND status = ?"; params.push(status) }
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
      bookingDate, price, senderName, senderImage, senderRole,
      eventTime, eventTimeEnd,
    } = await request.json()

    let normalizedDate: string | null = null
    if (bookingDate) {
      normalizedDate = /^\d{4}-\d{2}-\d{2}$/.test(bookingDate)
        ? bookingDate : bookingDate.substring(0, 10)
    }

    const result = await runAsync(
      `INSERT INTO bookings
        (artist_id, owner_id, event_id, title, description, booking_date, price, proposed_price,
         event_time, event_time_end, sender_name, sender_image, sender_role,
         accepted_by_artist, accepted_by_owner, last_action_by, status, commission_paid)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, 'pending', 0)`,
      [artistId, ownerId, eventId, title, description, normalizedDate, price, price,
       eventTime, eventTimeEnd ?? null, senderName, senderImage, senderRole,
       senderRole === "artist" ? artistId : ownerId],  // last_action_by = sender
    )

    // Registrar propuesta inicial en historial
    await runAsync(
      `INSERT INTO booking_negotiations
        (booking_id, user_id, action_type, price, new_date, new_time, new_time_end)
       VALUES (?, ?, 'initial_proposal', ?, ?, ?, ?)`,
      [result.id, senderRole === "artist" ? artistId : ownerId,
       price, normalizedDate, eventTime, eventTimeEnd ?? null],
    )

    const artist = await getAsync("SELECT first_name, last_name FROM users WHERE id = ?", [artistId])
    const owner  = await getAsync("SELECT first_name, last_name FROM users WHERE id = ?", [ownerId])
    const artistName = artist ? `${artist.first_name} ${artist.last_name}` : "Usuario"
    const ownerName  = owner  ? `${owner.first_name} ${owner.last_name}`   : "Usuario"
    const receiverId = senderRole === "artist" ? ownerId : artistId
    const finalSenderName = senderRole === "artist" ? (senderName || artistName) : (senderName || ownerName)

    await runAsync(
      `INSERT INTO notifications (user_id, type, title, message, related_id, related_type) VALUES (?, ?, ?, ?, ?, ?)`,
      [receiverId, "new_booking", "Nueva Propuesta de Contratación",
       `${finalSenderName} te envió una propuesta de contratación`, result.id, "booking"],
    )

    return NextResponse.json({ id: result.id, message: "Propuesta creada" }, { status: 201 })
  } catch (e: any) {
    console.error("[bookings POST]", e)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
