import { allAsync, runAsync, initializeDatabaseIfNeeded } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    await initializeDatabaseIfNeeded()

    const { searchParams } = new URL(request.url)
    const isAdmin = searchParams.get("isAdmin")

    if (!isAdmin) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
    }

    // Asegurar columnas nuevas
    const migrations = [
      "ALTER TABLE bookings ADD COLUMN event_time TEXT",
      "ALTER TABLE bookings ADD COLUMN event_time_end TEXT",
      "ALTER TABLE bookings ADD COLUMN proposed_price DECIMAL(10,2)",
      "ALTER TABLE bookings ADD COLUMN sender_role TEXT",
      "ALTER TABLE bookings ADD COLUMN last_action_by INTEGER",
      "ALTER TABLE bookings ADD COLUMN accepted_by_artist BOOLEAN DEFAULT 0",
      "ALTER TABLE bookings ADD COLUMN accepted_by_owner BOOLEAN DEFAULT 0",
    ]
    for (const sql of migrations) {
      try { await runAsync(sql, []) } catch { /* ya existe */ }
    }

    const bookings = await allAsync(
      `SELECT
        b.id,
        b.status,
        b.title,
        b.description,
        b.message,
        b.sender_role,
        b.last_action_by,
        b.booking_date,
        b.event_time,
        b.event_time_end,
        b.price,
        -- Usar el precio negociado más reciente, fallback al precio original
        COALESCE(b.proposed_price, b.price) AS proposed_price,
        b.commission_paid,
        b.confirmed_at,
        b.payment_reference,
        b.created_at,
        b.updated_at,
        b.artist_id,
        b.owner_id,
        -- Datos del artista
        u_artist.first_name  AS artist_first_name,
        u_artist.last_name   AS artist_last_name,
        u_artist.email       AS artist_email,
        ap.stage_name        AS artist_stage_name,
        -- Datos del dueño
        u_owner.first_name   AS owner_first_name,
        u_owner.last_name    AS owner_last_name,
        u_owner.email        AS owner_email,
        op.business_name     AS owner_business_name,
        -- Última negociación: tomar los datos más recientes del historial
        (SELECT price     FROM booking_negotiations WHERE booking_id = b.id AND action_type = 'counter' ORDER BY created_at DESC LIMIT 1) AS last_negotiated_price,
        (SELECT new_date  FROM booking_negotiations WHERE booking_id = b.id AND action_type = 'counter' ORDER BY created_at DESC LIMIT 1) AS last_negotiated_date,
        (SELECT new_time  FROM booking_negotiations WHERE booking_id = b.id AND action_type = 'counter' ORDER BY created_at DESC LIMIT 1) AS last_negotiated_time,
        (SELECT new_time_end FROM booking_negotiations WHERE booking_id = b.id AND action_type = 'counter' ORDER BY created_at DESC LIMIT 1) AS last_negotiated_time_end,
        (SELECT COUNT(*) FROM booking_negotiations WHERE booking_id = b.id) AS negotiation_count
      FROM bookings b
      LEFT JOIN users u_artist        ON b.artist_id = u_artist.id
      LEFT JOIN users u_owner         ON b.owner_id  = u_owner.id
      LEFT JOIN artist_profiles ap    ON u_artist.id = ap.user_id
      LEFT JOIN owner_profiles  op    ON u_owner.id  = op.user_id
      ORDER BY b.updated_at DESC`,
      [],
    )

    // Post-procesar: si hay datos de última negociación, usarlos como datos vigentes
    const processed = bookings.map((b: any) => ({
      ...b,
      // El precio vigente es el último negociado si existe, sino el propuesto, sino el original
      proposed_price: b.last_negotiated_price ?? b.proposed_price ?? b.price,
      // La fecha vigente es la última negociada si existe, sino la del booking
      booking_date:   b.last_negotiated_date ?? b.booking_date,
      event_time:     b.last_negotiated_time ?? b.event_time,
      event_time_end: b.last_negotiated_time_end ?? b.event_time_end,
    }))

    return NextResponse.json({ bookings: processed }, { status: 200 })
  } catch (error) {
    console.error("[admin/bookings GET] Error:", error)
    return NextResponse.json(
      { error: `Error interno: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await initializeDatabaseIfNeeded()

    const { bookingId, action } = await request.json()

    if (!bookingId || !action) {
      return NextResponse.json({ error: "bookingId y action son requeridos" }, { status: 400 })
    }

    let newStatus = ""
    switch (action) {
      case "cancel":   newStatus = "cancelled"; break
      case "complete": newStatus = "completed"; break
      default:
        return NextResponse.json({ error: "Acción no válida" }, { status: 400 })
    }

    await runAsync(
      "UPDATE bookings SET status = ?, updated_at = datetime('now') WHERE id = ?",
      [newStatus, bookingId]
    )

    return NextResponse.json({ success: true, message: "Contratación actualizada" }, { status: 200 })
  } catch (error) {
    console.error("[admin/bookings PATCH] Error:", error)
    return NextResponse.json(
      { error: `Error interno: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 },
    )
  }
}
