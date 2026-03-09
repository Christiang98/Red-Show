import { allAsync, runAsync, getAsync } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

// Ejecutado una sola vez por proceso
let tableReady = false

async function ensureTables() {
  if (tableReady) return
  
  // ── 1. Arreglar CHECK constraint si es viejo ──────────────────────────────
  // La estrategia segura: copiar solo las columnas que SABEMOS que existen
  try {
    const tbl = await getAsync(
      `SELECT sql FROM sqlite_master WHERE type='table' AND name='bookings'`, []
    )
    if (tbl?.sql && !tbl.sql.includes("'negotiating'")) {
      console.log("[negotiations] Migrando CHECK constraint...")
      
      // Obtener columnas que realmente existen en la tabla vieja
      const cols: any[] = await allAsync(`PRAGMA table_info(bookings)`, [])
      const existingCols = cols.map((c: any) => c.name)
      console.log("[negotiations] Columnas existentes:", existingCols.join(", "))
      
      await runAsync("PRAGMA foreign_keys = OFF", [])
      
      // Renombrar tabla vieja
      await runAsync("ALTER TABLE bookings RENAME TO _bookings_old_migration", [])
      
      // Crear tabla nueva con constraint correcto y TODAS las columnas
      await runAsync(`CREATE TABLE bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        artist_id INTEGER NOT NULL,
        owner_id INTEGER NOT NULL,
        event_id INTEGER,
        title VARCHAR(255),
        description TEXT,
        booking_date DATETIME,
        event_date DATE,
        message TEXT,
        sender_name TEXT,
        sender_image TEXT,
        sender_role TEXT,
        status VARCHAR(20) CHECK (status IN (
          'pending','negotiating','matched','confirmed','accepted','rejected','completed','cancelled'
        )) DEFAULT 'pending',
        price DECIMAL(10,2),
        proposed_price DECIMAL(10,2),
        commission_paid BOOLEAN DEFAULT 0,
        confirmed_at DATETIME,
        payment_method VARCHAR(50),
        payment_amount DECIMAL(10,2),
        payment_date DATETIME,
        payment_reference VARCHAR(50),
        payment_status VARCHAR(20),
        event_time TEXT,
        event_time_end TEXT,
        event_type TEXT,
        estimated_duration TEXT,
        estimated_guests INTEGER,
        accepted_by_artist BOOLEAN DEFAULT 0,
        accepted_by_owner BOOLEAN DEFAULT 0,
        last_action_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (artist_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL
      )`, [])
      
      // Copiar solo las columnas que existen en ambas tablas
      // status: mapear 'accepted' viejo → 'matched'
      const newCols = [
        "id","artist_id","owner_id","event_id","title","description",
        "booking_date","event_date","message","sender_name","sender_image","sender_role",
        "price","proposed_price","commission_paid","confirmed_at",
        "payment_method","payment_amount","payment_date","payment_reference","payment_status",
        "event_time","event_time_end","event_type","estimated_duration","estimated_guests",
        "accepted_by_artist","accepted_by_owner","last_action_by","created_at","updated_at"
      ]
      
      // Solo incluir columnas que existen en la tabla vieja
      const safeCols = newCols.filter(col => existingCols.includes(col))
      const safeColsStr = safeCols.join(", ")
      
      // status se maneja aparte (necesita CASE)
      await runAsync(
        `INSERT INTO bookings (${safeColsStr}, status)
         SELECT ${safeColsStr},
           CASE status WHEN 'accepted' THEN 'matched' ELSE status END
         FROM _bookings_old_migration`,
        []
      )
      
      await runAsync("DROP TABLE _bookings_old_migration", [])
      await runAsync("PRAGMA foreign_keys = ON", [])
      console.log("[negotiations] ✓ CHECK constraint migrado. Filas copiadas OK.")
    }
  } catch(migErr: any) {
    console.error("[negotiations] ERROR en migración constraint:", migErr?.message || migErr)
    // Intentar restaurar si algo salió mal
    try {
      const hasTmp = await getAsync(
        `SELECT name FROM sqlite_master WHERE name='_bookings_old_migration'`, []
      )
      if (hasTmp) {
        await runAsync("DROP TABLE IF EXISTS bookings", [])
        await runAsync("ALTER TABLE _bookings_old_migration RENAME TO bookings", [])
        console.log("[negotiations] Tabla restaurada tras error de migración")
      }
    } catch {}
  }

  // ── 2. Agregar columnas nuevas si no existen ──────────────────────────────
  const bookingCols = [
    "ALTER TABLE bookings ADD COLUMN event_type TEXT",
    "ALTER TABLE bookings ADD COLUMN event_time_end TEXT",
    "ALTER TABLE bookings ADD COLUMN event_date DATE",
    "ALTER TABLE bookings ADD COLUMN estimated_duration TEXT",
    "ALTER TABLE bookings ADD COLUMN estimated_guests INTEGER",
    "ALTER TABLE bookings ADD COLUMN accepted_by_artist BOOLEAN DEFAULT 0",
    "ALTER TABLE bookings ADD COLUMN accepted_by_owner  BOOLEAN DEFAULT 0",
    "ALTER TABLE bookings ADD COLUMN last_action_by INTEGER",
    "ALTER TABLE bookings ADD COLUMN proposed_price DECIMAL(10,2)",
    "ALTER TABLE bookings ADD COLUMN sender_name TEXT",
    "ALTER TABLE bookings ADD COLUMN sender_image TEXT",
    "ALTER TABLE bookings ADD COLUMN sender_role TEXT",
  ]
  for (const sql of bookingCols) {
    try { await runAsync(sql, []) } catch {} // "already exists" es OK
  }

  // ── 3. Crear tabla de negociaciones si no existe ──────────────────────────
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

  tableReady = true
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
    const body = await request.json()
    const { bookingId, userId, actionType, price, newDate, newTime, newTimeEnd } = body

    console.log("[negotiations POST] payload:", { bookingId, userId, actionType, price, newDate, newTime, newTimeEnd })

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

    console.log("[negotiations POST] booking status:", booking.status, "current proposed_price:", booking.proposed_price)

    const actorIsArtist = Number(userId) === Number(booking.artist_id)
    const receiverId    = actorIsArtist ? booking.owner_id : booking.artist_id
    const actorName     = actorIsArtist ? booking.artist_name : booking.owner_name

    // Insertar en historial
    await runAsync(
      `INSERT INTO booking_negotiations
        (booking_id, user_id, action_type, price, new_date, new_time, new_time_end)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [bookingId, userId, actionType, price ?? null, newDate ?? null, newTime ?? null, newTimeEnd ?? null],
    )

    if (actionType === "counter") {
      let normalizedDate = newDate
      if (newDate && !/^\d{4}-\d{2}-\d{2}$/.test(newDate)) normalizedDate = newDate.substring(0, 10)

      const finalDate     = normalizedDate    ?? booking.booking_date
      const finalTime     = newTime           ?? booking.event_time
      const finalTimeEnd  = newTimeEnd        ?? booking.event_time_end
      const finalPrice    = price != null     ? price : (booking.proposed_price ?? booking.price)

      console.log("[negotiations POST] counter → updating to:", { finalDate, finalTime, finalTimeEnd, finalPrice })

      await runAsync(
        `UPDATE bookings SET
           status         = 'negotiating',
           booking_date   = ?,
           event_time     = ?,
           event_time_end = ?,
           proposed_price = ?,
           accepted_by_artist = 0,
           accepted_by_owner  = 0,
           last_action_by = ?,
           updated_at     = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [finalDate, finalTime, finalTimeEnd, finalPrice, userId, bookingId],
      )

      await runAsync(
        `INSERT INTO notifications (user_id, type, title, message, related_id, related_type)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [receiverId, "new_booking", "Nueva propuesta de condiciones",
         `${actorName} modificó la propuesta "${booking.title}". Revisá los nuevos términos.`,
         bookingId, "booking"],
      )

    } else if (actionType === "accept") {
      const acceptField = actorIsArtist ? "accepted_by_artist" : "accepted_by_owner"
      await runAsync(
        `UPDATE bookings SET ${acceptField} = 1, status = 'matched',
           last_action_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [userId, bookingId],
      )
      // Si la solicitud viene de un usuario común, quien acepta paga la comisión
      const senderIsUser = booking.sender_role === "user"
      const commissionMsg = senderIsUser
        ? `${actorName} aceptó la solicitud "${booking.title}". Como quien acepta la solicitud de un Usuario Común, deberás abonar la tarifa de gestión ($4.200) para confirmar.`
        : `${actorName} aceptó la propuesta "${booking.title}". El local puede confirmar abonando la tarifa de gestión ($4.200).`
      for (const uid of [booking.artist_id, booking.owner_id]) {
        await runAsync(
          `INSERT INTO notifications (user_id, type, title, message, related_id, related_type)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [uid, "booking_accepted", "¡Acuerdo alcanzado! — Confirmar y pagar",
           commissionMsg,
           bookingId, "booking"],
        )
      }

    } else if (actionType === "reject") {
      await runAsync(
        `UPDATE bookings SET status = 'rejected',
           accepted_by_artist = 0, accepted_by_owner = 0,
           last_action_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [userId, bookingId],
      )
      await runAsync(
        `INSERT INTO notifications (user_id, type, title, message, related_id, related_type)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [receiverId, "booking_rejected", "Propuesta rechazada",
         `${actorName} rechazó la propuesta "${booking.title}".`, bookingId, "booking"],
      )
    }

    const updated = await getAsync("SELECT * FROM bookings WHERE id = ?", [bookingId])
    console.log("[negotiations POST] updated proposed_price:", updated?.proposed_price)
    return NextResponse.json({ booking: updated }, { status: 201 })
  } catch (e: any) {
    console.error("[negotiations POST] ERROR DETALLADO:", e?.message || e, e?.code)
    return NextResponse.json({ error: e?.message || "Error interno" }, { status: 500 })
  }
}
