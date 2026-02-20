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
  ]
  for (const sql of cols) {
    try { await runAsync(sql, []) } catch { /* ya existe */ }
  }
}

/** Genera referencia tipo PAY-XXXXXX */
function genReference() {
  return "PAY-" + Math.random().toString(36).substring(2, 8).toUpperCase()
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureColumns()
    const { id: bookingId } = await params

    const body = await request.json()
    const { status, simulatePayment, paymentMethod } = body

    const booking = await getAsync(
      `SELECT b.*,
         a.first_name || ' ' || a.last_name AS artist_name,
         a.email   AS artist_email,
         a.phone   AS artist_phone,
         o.first_name || ' ' || o.last_name AS owner_name,
         o.email   AS owner_email,
         o.phone   AS owner_phone
       FROM bookings b
       JOIN users a ON b.artist_id = a.id
       JOIN users o ON b.owner_id  = o.id
       WHERE b.id = ?`,
      [bookingId],
    )

    if (!booking) {
      return NextResponse.json({ error: "Propuesta no encontrada" }, { status: 404 })
    }

    // ── Prevenir doble pago ──────────────────────────────────────────────────
    if (simulatePayment === true && booking.commission_paid) {
      return NextResponse.json({ error: "Esta contratación ya fue confirmada y pagada" }, { status: 400 })
    }
    if (simulatePayment === true && booking.status === "confirmed") {
      return NextResponse.json({ error: "No podés pagar: la contratación ya está confirmada" }, { status: 400 })
    }
    if (simulatePayment === true && ["rejected", "cancelled"].includes(booking.status)) {
      return NextResponse.json({ error: "No se puede pagar una contratación rechazada o cancelada" }, { status: 400 })
    }

    // ── PAGO SIMULADO ────────────────────────────────────────────────────────
    if (simulatePayment === true) {
      const ref = genReference()
      const now = new Date().toISOString()

      await runAsync(
        `UPDATE bookings SET
           status            = 'confirmed',
           commission_paid   = 1,
           confirmed_at      = ?,
           payment_method    = ?,
           payment_amount    = 3,
           payment_date      = ?,
           payment_reference = ?,
           payment_status    = 'Aprobado',
           updated_at        = ?
         WHERE id = ?`,
        [now, paymentMethod || "tarjeta", now, ref, now, bookingId],
      )

      for (const uid of [booking.artist_id, booking.owner_id]) {
        await runAsync(
          `INSERT INTO notifications (user_id, type, title, message, related_id, related_type) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            uid, "booking_accepted",
            "¡Contratación Confirmada y Pagada!",
            `La contratación "${booking.title}" fue confirmada. Referencia de pago: ${ref}. ¡Los datos de contacto ya están disponibles!`,
            booking.id, "booking",
          ],
        )
      }

      const updated = await getAsync("SELECT * FROM bookings WHERE id = ?", [bookingId])
      return NextResponse.json({ ...updated, payment_reference: ref }, { status: 200 })
    }

    // ── CAMBIO DE ESTADO NORMAL ──────────────────────────────────────────────
    if (!status) {
      return NextResponse.json({ error: "Se requiere 'status' o 'simulatePayment'" }, { status: 400 })
    }

    const validTransitions: Record<string, string[]> = {
      pending:   ["matched", "rejected"],
      matched:   ["rejected"],
      confirmed: ["completed"],
      accepted:  ["completed"],
      rejected:  [],
      completed: [],
      cancelled: [],
    }

    const allowed = validTransitions[booking.status] ?? []
    if (!allowed.includes(status)) {
      return NextResponse.json(
        { error: `No se puede cambiar de "${booking.status}" a "${status}"` },
        { status: 400 },
      )
    }

    await runAsync(
      "UPDATE bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [status, bookingId],
    )

    const senderIsArtist = booking.sender_role === "artist"
    const initiatorId   = senderIsArtist ? booking.artist_id : booking.owner_id
    const responderName = senderIsArtist ? booking.owner_name : booking.artist_name

    if (status === "matched") {
      await runAsync(
        `INSERT INTO notifications (user_id, type, title, message, related_id, related_type) VALUES (?, ?, ?, ?, ?, ?)`,
        [initiatorId, "booking_accepted",
         "Propuesta Aceptada — Pendiente de Confirmación",
         `${responderName} aceptó tu propuesta "${booking.title}". El local debe abonar la tarifa de gestión (USD 3) para confirmarla definitivamente.`,
         booking.id, "booking"],
      )
      await runAsync(
        `INSERT INTO notifications (user_id, type, title, message, related_id, related_type) VALUES (?, ?, ?, ?, ?, ?)`,
        [booking.owner_id, "new_booking",
         "Acción Requerida: Confirmá la Contratación",
         `Aceptaste la propuesta "${booking.title}". Para confirmarla definitivamente, abonás la tarifa de gestión de USD 3.`,
         booking.id, "booking"],
      )
    } else if (status === "rejected") {
      await runAsync(
        `INSERT INTO notifications (user_id, type, title, message, related_id, related_type) VALUES (?, ?, ?, ?, ?, ?)`,
        [initiatorId, "booking_rejected",
         "Propuesta Rechazada",
         `${responderName} rechazó tu propuesta "${booking.title}".`,
         booking.id, "booking"],
      )
    } else if (status === "completed") {
      for (const uid of [booking.artist_id, booking.owner_id]) {
        await runAsync(
          `INSERT INTO notifications (user_id, type, title, message, related_id, related_type) VALUES (?, ?, ?, ?, ?, ?)`,
          [uid, "booking_completed",
           "Evento Realizado",
           `El evento "${booking.title}" fue marcado como realizado. ¡Podés dejar tu calificación!`,
           booking.id, "booking"],
        )
      }
    }

    const updated = await getAsync("SELECT * FROM bookings WHERE id = ?", [bookingId])
    return NextResponse.json(updated, { status: 200 })
  } catch (e: any) {
    console.error("[bookings PATCH]", e)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: bookingId } = await params
    const booking = await getAsync(
      `SELECT b.*,
         a.first_name || ' ' || a.last_name AS artist_name,
         a.email  AS artist_email,
         a.phone  AS artist_phone,
         o.first_name || ' ' || o.last_name AS owner_name,
         o.email  AS owner_email,
         o.phone  AS owner_phone,
         op.business_name AS venue_name,
         op.address        AS location
       FROM bookings b
       JOIN users a ON b.artist_id = a.id
       JOIN users o ON b.owner_id  = o.id
       LEFT JOIN owner_profiles op ON o.id = op.user_id
       WHERE b.id = ?`,
      [bookingId],
    )
    if (!booking) return NextResponse.json({ error: "Propuesta no encontrada" }, { status: 404 })
    return NextResponse.json(booking)
  } catch {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
