import { allAsync, runAsync } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

async function ensureEventColumns() {
  const migrations = [
    "ALTER TABLE events ADD COLUMN user_id INTEGER",
    "ALTER TABLE events ADD COLUMN event_time TEXT",
    "ALTER TABLE events ADD COLUMN event_time_end TEXT",
    "ALTER TABLE events ADD COLUMN is_free BOOLEAN DEFAULT 1",
    "ALTER TABLE events ADD COLUMN images TEXT DEFAULT '[]'",
    "ALTER TABLE events ADD COLUMN is_published BOOLEAN DEFAULT 1",
    "ALTER TABLE events ADD COLUMN created_by_admin BOOLEAN DEFAULT 0",
    `CREATE TABLE IF NOT EXISTS event_tickets (
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
    )`,
  ]
  for (const sql of migrations) {
    try { await runAsync(sql, []) } catch {}
  }
}

const BASE_QUERY = `
  SELECT e.*,
    u.first_name, u.last_name, u.role, u.email as creator_email,
    COALESCE(op.business_name, ap.stage_name, u.first_name || ' ' || u.last_name) as creator_name,
    op.profile_image as owner_avatar,
    ap.profile_image as artist_avatar
  FROM events e
  LEFT JOIN users u ON (COALESCE(e.user_id, e.owner_id) = u.id)
  LEFT JOIN owner_profiles op ON u.id = op.user_id
  LEFT JOIN artist_profiles ap ON u.id = ap.user_id
`

export async function GET(request: NextRequest) {
  try {
    await ensureEventColumns()
    const { searchParams } = new URL(request.url)
    const category  = searchParams.get("category")
    const location  = searchParams.get("location")
    const userId    = searchParams.get("userId")
    const adminMode = searchParams.get("admin") === "true"   // admin ve todos, incluso ocultos

    let where = adminMode ? "WHERE 1=1" : "WHERE e.is_published = 1"
    const params: any[] = []

    if (userId && !adminMode) {
      where = "WHERE (e.user_id = ? OR e.owner_id = ?)"
      params.push(userId, userId)
    }
    if (category) { where += " AND e.category LIKE ?"; params.push(`%${category}%`) }
    if (location) { where += " AND e.location LIKE ?"; params.push(`%${location}%`) }

    const events = await allAsync(
      `${BASE_QUERY} ${where} ORDER BY e.event_date ASC, e.created_at DESC LIMIT 200`,
      params
    )
    return NextResponse.json(events, { status: 200 })
  } catch (error) {
    console.error("[events] GET:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureEventColumns()
    const body = await request.json()
    const { userId, ownerId, title, description, category, location,
            eventDate, eventTime, eventTimeEnd, capacity, price, isFree, images, createdByAdmin } = body

    const creatorId = userId || ownerId
    if (!creatorId || !title) {
      return NextResponse.json({ error: "userId y title son requeridos" }, { status: 400 })
    }

    const imagesStr  = JSON.stringify(images || [])
    const firstImage = images?.length > 0 ? images[0] : null
    const finalPrice = isFree ? 0 : (price || 0)

    const result = await runAsync(
      `INSERT INTO events (owner_id, user_id, title, description, category, location,
        event_date, event_time, event_time_end, capacity, price, is_free, image_url, images, is_published, created_by_admin)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      [creatorId, creatorId, title, description, category, location,
       eventDate, eventTime, eventTimeEnd, capacity, finalPrice, isFree ? 1 : 0, firstImage, imagesStr, createdByAdmin ? 1 : 0]
    )

    return NextResponse.json({ id: result.id, message: "Evento creado" }, { status: 201 })
  } catch (error) {
    console.error("[events] POST:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

// PATCH — toggle visibilidad (admin)
export async function PATCH(request: NextRequest) {
  try {
    await ensureEventColumns()
    const { id, is_published } = await request.json()
    if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 })

    await runAsync("UPDATE events SET is_published = ? WHERE id = ?", [is_published ? 1 : 0, id])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[events] PATCH:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 })

    await runAsync("DELETE FROM events WHERE id = ?", [id])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[events] DELETE:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
