import { getAsync, runAsync } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { status } = await request.json()

    

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

    // Determinar quien envio la solicitud original y quien la esta respondiendo
    // El que recibe la notificacion es el que ENVIO la solicitud original
    let notifyUserId: number
    let responderName: string
    
    if (booking.sender_role === "artist") {
      // El artista envio, el owner responde -> notificar al artista
      notifyUserId = booking.artist_id
      responderName = booking.owner_name
    } else {
      // El owner envio, el artista responde -> notificar al owner
      notifyUserId = booking.owner_id
      responderName = booking.artist_name
    }

    if (status === "accepted") {
      await runAsync(
        `INSERT INTO notifications (user_id, type, title, message, related_id, related_type) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          notifyUserId,
          "booking_accepted",
          "Solicitud Aceptada",
          `${responderName} ha aceptado tu solicitud para "${booking.title}". Ya pueden comenzar a chatear.`,
          booking.id,
          "booking",
        ],
      )
    } else if (status === "rejected") {
      await runAsync(
        `INSERT INTO notifications (user_id, type, title, message, related_id, related_type) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          notifyUserId,
          "booking_rejected",
          "Solicitud Rechazada",
          `${responderName} ha rechazado tu solicitud para "${booking.title}"`,
          booking.id,
          "booking",
        ],
      )
    } else if (status === "completed") {
      // Notificar a ambas partes
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

    return NextResponse.json(booking, { status: 200 })
  } catch {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

// GET - Obtener un booking específico con detalles completos
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
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
  } catch {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
