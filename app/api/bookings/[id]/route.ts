import { getAsync, runAsync } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

async function ensureColumns() {
  const cols = [
    "ALTER TABLE bookings ADD COLUMN commission_paid BOOLEAN DEFAULT 0",
    "ALTER TABLE bookings ADD COLUMN confirmed_at DATETIME",
    "ALTER TABLE bookings ADD COLUMN payment_method VARCHAR(50)",
    "ALTER TABLE bookings ADD COLUMN payment_amount DECIMAL(10,2)",
    "ALTER TABLE bookings ADD COLUMN payment_date DATETIME",
    "ALTER TABLE bookings ADD COLUMN payment_reference VARCHAR(50)",
    "ALTER TABLE bookings ADD COLUMN payment_status VARCHAR(20)",
    "ALTER TABLE bookings ADD COLUMN event_time_end TEXT",
    "ALTER TABLE bookings ADD COLUMN accepted_by_artist BOOLEAN DEFAULT 0",
    "ALTER TABLE bookings ADD COLUMN accepted_by_owner  BOOLEAN DEFAULT 0",
    "ALTER TABLE bookings ADD COLUMN last_action_by INTEGER",
  ]
  for (const sql of cols) { try { await runAsync(sql, []) } catch {} }
}

function genRef() { return "PAY-" + Math.random().toString(36).substring(2, 8).toUpperCase() }

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureColumns()
    const { id: bookingId } = await params
    const body = await request.json()
    const { status, simulatePayment, paymentMethod } = body

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

    // ── Pago ────────────────────────────────────────────────────────────────
    if (simulatePayment === true) {
      if (booking.commission_paid)
        return NextResponse.json({ error: "Ya fue confirmada y pagada" }, { status: 400 })
      if (booking.status !== "matched")
        return NextResponse.json({ error: "Debe haber un acuerdo antes de pagar" }, { status: 400 })

      const ref = genRef()
      const now = new Date().toISOString()
      await runAsync(
        `UPDATE bookings SET status='confirmed', commission_paid=1, confirmed_at=?,
           payment_method=?, payment_amount=4200, payment_date=?,
           payment_reference=?, payment_status='Aprobado', updated_at=? WHERE id=?`,
        [now, paymentMethod || "tarjeta", now, ref, now, bookingId],
      )
      for (const uid of [booking.artist_id, booking.owner_id]) {
        await runAsync(
          `INSERT INTO notifications (user_id,type,title,message,related_id,related_type) VALUES (?,?,?,?,?,?)`,
          [uid, "booking_accepted", "¡Contratación Confirmada!",
           `Contratación "${booking.title}" confirmada. Ref: ${ref}. ¡Ya podés usar el chat!`,
           booking.id, "booking"],
        )
      }
      const updated = await getAsync("SELECT * FROM bookings WHERE id=?", [bookingId])
      return NextResponse.json({ ...updated, payment_reference: ref })
    }

    // ── Cambio de estado normal ──────────────────────────────────────────────
    if (!status) return NextResponse.json({ error: "Falta status o simulatePayment" }, { status: 400 })

    const valid: Record<string, string[]> = {
      pending:     ["negotiating", "matched", "rejected"],
      negotiating: ["matched", "rejected"],
      matched:     ["confirmed", "rejected"],
      confirmed:   ["completed"],
      accepted:    ["completed"],
      rejected:    [], completed: [], cancelled: [],
    }
    if (!(valid[booking.status] ?? []).includes(status))
      return NextResponse.json({ error: `Transición inválida: ${booking.status} → ${status}` }, { status: 400 })

    await runAsync("UPDATE bookings SET status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?", [status, bookingId])

    if (status === "completed") {
      for (const uid of [booking.artist_id, booking.owner_id]) {
        await runAsync(
          `INSERT INTO notifications (user_id,type,title,message,related_id,related_type) VALUES (?,?,?,?,?,?)`,
          [uid, "booking_completed", "Evento Realizado",
           `El evento "${booking.title}" fue marcado como realizado. ¡Dejá tu calificación!`, booking.id, "booking"],
        )
      }
    }
    const updated = await getAsync("SELECT * FROM bookings WHERE id=?", [bookingId])
    return NextResponse.json(updated)
  } catch (e: any) {
    console.error("[bookings PATCH]", e)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const booking = await getAsync(
      `SELECT b.*,
         a.first_name || ' ' || a.last_name AS artist_name,
         a.email AS artist_email, a.phone AS artist_phone,
         o.first_name || ' ' || o.last_name AS owner_name,
         o.email AS owner_email, o.phone AS owner_phone,
         op.business_name AS venue_name, op.address AS location
       FROM bookings b
       JOIN users a ON b.artist_id = a.id
       JOIN users o ON b.owner_id  = o.id
       LEFT JOIN owner_profiles op ON o.id = op.user_id
       WHERE b.id = ?`,
      [id],
    )
    if (!booking) return NextResponse.json({ error: "No encontrada" }, { status: 404 })
    return NextResponse.json(booking)
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
