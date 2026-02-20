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
      "ALTER TABLE bookings ADD COLUMN proposed_price DECIMAL(10,2)",
    ]
    for (const sql of migrations) {
      try { await runAsync(sql, []) } catch { /* ya existe */ }
    }

    const bookings = await allAsync(
      `
      SELECT 
        b.id, b.status, b.title, b.description, b.message,
        b.booking_date, b.event_time, b.price,
        COALESCE(b.proposed_price, b.price) as proposed_price,
        b.commission_paid, b.confirmed_at,
        b.payment_reference, b.created_at, b.updated_at,
        b.artist_id, b.owner_id,
        u_artist.first_name as artist_first_name,
        u_artist.last_name as artist_last_name,
        u_artist.email as artist_email,
        u_owner.first_name as owner_first_name,
        u_owner.last_name as owner_last_name,
        u_owner.email as owner_email,
        ap.stage_name as artist_stage_name,
        op.business_name as owner_business_name
      FROM bookings b
      LEFT JOIN users u_artist ON b.artist_id = u_artist.id
      LEFT JOIN users u_owner ON b.owner_id = u_owner.id
      LEFT JOIN artist_profiles ap ON u_artist.id = ap.user_id
      LEFT JOIN owner_profiles op ON u_owner.id = op.user_id
      ORDER BY b.created_at DESC
      `,
      [],
    )

    return NextResponse.json({ bookings }, { status: 200 })
  } catch (error) {
    console.error("[v0] Error obteniendo contrataciones:", error)
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
      case "cancel":
        newStatus = "cancelled"
        break
      case "complete":
        newStatus = "completed"
        break
      default:
        return NextResponse.json({ error: "Acción no válida" }, { status: 400 })
    }

    await runAsync("UPDATE bookings SET status = ?, updated_at = datetime('now') WHERE id = ?", [newStatus, bookingId])

    return NextResponse.json({ success: true, message: "Contratación actualizada" }, { status: 200 })
  } catch (error) {
    console.error("[v0] Error actualizando contratación:", error)
    return NextResponse.json(
      { error: `Error interno: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 },
    )
  }
}
