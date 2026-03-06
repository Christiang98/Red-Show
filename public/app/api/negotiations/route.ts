import { allAsync, runAsync, getAsync } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

async function ensureTables() {
  const bookingCols = [
    "ALTER TABLE bookings ADD COLUMN event_type TEXT",
    "ALTER TABLE bookings ADD COLUMN event_time_end TEXT",
    "ALTER TABLE bookings ADD COLUMN estimated_duration TEXT",
    "ALTER TABLE bookings ADD COLUMN estimated_guests INTEGER",
    "ALTER TABLE bookings ADD COLUMN accepted_by_artist BOOLEAN DEFAULT 0",
    "ALTER TABLE bookings ADD COLUMN accepted_by_owner  BOOLEAN DEFAULT 0",
  ]
  for (const sql of bookingCols) {
    try { await runAsync(sql, []) } catch {}
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
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `, [])
  try { await runAsync("ALTER TABLE booking_negotiations ADD COLUMN new_time_end TEXT", []) } catch {}
  try { await runAsync("CREATE INDEX IF NOT EXISTS idx_neg_booking ON booking_negotiations(booking_id)", []) } catch {}
}

// GET → historial
export async function GET(request: NextRequest) {
  try {
    await ensureTables()
    const bookingId = new URL(request.url).searchParams.get("bookingId")
    if (!bookingId) return NextResponse.json({ error: "Se requiere bookingId" }, { status: 400 })

    const rows = await allAsync(
      `SELECT n.*, u.first_name || ' ' || u.last_name AS user_name, u.role AS user_role
       FROM booking_negotiations n
       JOIN users u ON n.user_id = u.id
       WHERE n.booking_id = ?
       ORDER BY n.created_at ASC`,
      [bookingId],
    )
    return NextResponse.json(rows)
  } catch (e: any) {
    console.error("[negotiations GET]", e)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

// POST → registrar acción
export async function POST(request: NextRequest) {
  try {
    await ensureTables()
    const { bookingId, userId, actionType, price, newDate, newTime, newTimeEnd } = await request.json()

    if (!bookingId || !userId || !actionType) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    const booking = await getAsync(
      `SELECT b.*,
         a.first_name || ' ' || a.last_name AS artist_name,
         o.first_name || ' ' || o.last_name AS owner_name
       FROM bookings b
       JOIN users a ON b.artist_id = a.id
       JOIN users o ON b.owner_id  = o.id
       WHERE b.id = ?`,
      [bookingId],
    )
    if (!booking) return NextResponse.json({ error: "Propuesta no encontrada" }, { status: 404 })

    const actorIsArtist = Number(userId) === Number(booking.artist_id)
    const receiverId    = actorIsArtist ? booking.owner_id : booking.artist_id
    const actorName     = actorIsArtist ? booking.artist_name : booking.owner_name

    // Guardar en historial
    await runAsync(
      `INSERT INTO booking_negotiations
        (booking_id, user_id, action_type, price, new_date, new_time, new_time_end)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [bookingId, userId, actionType, price ?? null, newDate ?? null, newTime ?? null, newTimeEnd ?? null],
    )

    // ── Lógica de transición ────────────────────────────────────────────────
    if (actionType === "counter") {
      // Edición/contraoferta: sobrescribe datos en booking, resetea aceptaciones
      let normalizedDate = newDate
      if (newDate && !/^\d{4}-\d{2}-\d{2}$/.test(newDate)) normalizedDate = newDate.substring(0, 10)

      await runAsync(
        `UPDATE bookings SET
           status = 'negotiating',
           booking_date = COALESCE(?, booking_date),
           event_time = COALESCE(?, event_time),
           event_time_end = COALESCE(?, event_time_end),
           proposed_price = COALESCE(?, proposed_price),
           accepted_by_artist = 0,
           accepted_by_owner  = 0,
           updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [normalizedDate ?? null, newTime ?? null, newTimeEnd ?? null, price ?? null, bookingId],
      )

      await runAsync(
        `INSERT INTO notifications (user_id, type, title, message, related_id, related_type) VALUES (?, ?, ?, ?, ?, ?)`,
        [receiverId, "new_booking", "Nueva propuesta de condiciones",
         `${actorName} modificó la propuesta "${booking.title}". Revisá los nuevos términos.`,
         bookingId, "booking"],
      )

    } else if (actionType === "accept") {
      // Marcar aceptación del actor
      const acceptField = actorIsArtist ? "accepted_by_artist" : "accepted_by_owner"
      await runAsync(
        `UPDATE bookings SET ${acceptField} = 1, status = 'matched', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [bookingId],
      )

      // Notificar a ambos
      for (const uid of [booking.artist_id, booking.owner_id]) {
        await runAsync(
          `INSERT INTO notifications (user_id, type, title, message, related_id, related_type) VALUES (?, ?, ?, ?, ?, ?)`,
          [uid, "booking_accepted",
           "¡Acuerdo alcanzado! — Confirmar y pagar",
           `${actorName} aceptó la propuesta "${booking.title}". El local puede confirmar abonando la tarifa de gestión ($4.200).`,
           bookingId, "booking"],
        )
      }

    } else if (actionType === "reject") {
      await runAsync(
        `UPDATE bookings SET status = 'rejected', accepted_by_artist = 0, accepted_by_owner = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [bookingId],
      )
      await runAsync(
        `INSERT INTO notifications (user_id, type, title, message, related_id, related_type) VALUES (?, ?, ?, ?, ?, ?)`,
        [receiverId, "booking_rejected", "Propuesta rechazada",
         `${actorName} rechazó la propuesta "${booking.title}".`, bookingId, "booking"],
      )
    }

    const updated = await getAsync("SELECT * FROM bookings WHERE id = ?", [bookingId])
    return NextResponse.json({ booking: updated }, { status: 201 })
  } catch (e: any) {
    console.error("[negotiations POST]", e)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
