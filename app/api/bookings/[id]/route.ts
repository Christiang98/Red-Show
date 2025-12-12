import { getAsync, runAsync } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { status } = await request.json()

    console.log("[v0] Actualizando booking:", params.id, "a estado:", status)

    // Actualizar el booking
    await runAsync("UPDATE bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [status, params.id])

    // Obtener información del booking para crear notificaciones
    const booking = await getAsync(
      `SELECT b.*, 
        artist.first_name || ' ' || artist.last_name as artist_name,
        artist.email as artist_email,
        owner.first_name || ' ' || owner.last_name as owner_name,
        owner.email as owner_email
       FROM bookings b
       JOIN users artist ON b.artist_id = artist.id
       JOIN users owner ON b.owner_id = owner.id
       WHERE b.id = ?`,
      [params.id],
    )

    if (status === "accepted") {
      // Notificar al artista que su solicitud fue aceptada
      await runAsync(
        `INSERT INTO notifications (user_id, type, title, message, related_id, related_type) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          booking.artist_id,
          "booking_accepted",
          "Solicitud Aceptada",
          `${booking.owner_name} ha aceptado tu solicitud para "${booking.title}"`,
          booking.id,
          "booking",
        ],
      )
    } else if (status === "rejected") {
      // Notificar al artista que su solicitud fue rechazada
      await runAsync(
        `INSERT INTO notifications (user_id, type, title, message, related_id, related_type) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          booking.artist_id,
          "booking_rejected",
          "Solicitud Rechazada",
          `${booking.owner_name} ha rechazado tu solicitud para "${booking.title}"`,
          booking.id,
          "booking",
        ],
      )
    } else if (status === "completed") {
      // Notificar a ambas partes que el evento fue completado
      await runAsync(
        `INSERT INTO notifications (user_id, type, title, message, related_id, related_type) 
         VALUES (?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?)`,
        [
          booking.artist_id,
          "booking_completed",
          "Evento Completado",
          `El evento "${booking.title}" ha sido marcado como completado`,
          booking.id,
          "booking",
          booking.owner_id,
          "booking_completed",
          "Evento Completado",
          `El evento "${booking.title}" ha sido marcado como completado`,
          booking.id,
          "booking",
        ],
      )
    }

    console.log("[v0] Booking actualizado y notificaciones creadas")
    return NextResponse.json(booking, { status: 200 })
  } catch (error) {
    console.error("[v0] Error actualizando booking:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

// GET - Obtener un booking específico con detalles completos
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("[v0] Obteniendo booking:", params.id)

    const booking = await getAsync(
      `SELECT b.*,
        artist.first_name || ' ' || artist.last_name as artist_name,
        artist.email as artist_email,
        owner.first_name || ' ' || owner.last_name as owner_name,
        owner.email as owner_email,
        op.business_name as venue_name,
        op.address as location
       FROM bookings b
       JOIN users artist ON b.artist_id = artist.id
       JOIN users owner ON b.owner_id = owner.id
       LEFT JOIN owner_profiles op ON owner.id = op.user_id
       WHERE b.id = ?`,
      [params.id],
    )

    if (!booking) {
      return NextResponse.json({ error: "Booking no encontrado" }, { status: 404 })
    }

    return NextResponse.json(booking)
  } catch (error) {
    console.error("[v0] Error obteniendo booking:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
