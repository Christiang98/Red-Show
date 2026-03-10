import { getAsync, allAsync, runAsync } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

// Garantiza que existan todas las columnas opcionales antes de consultarlas.
// SQLite no soporta COALESCE sobre columnas inexistentes — explotan antes de evaluarse.
async function ensureUserColumns() {
  const migrations = [
    "ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT 1",
    "ALTER TABLE users ADD COLUMN is_sanctioned BOOLEAN DEFAULT 0",
    "ALTER TABLE users ADD COLUMN sanction_reason TEXT",
    "ALTER TABLE users ADD COLUMN sanction_start DATETIME",
    "ALTER TABLE users ADD COLUMN sanction_end DATETIME",
    "ALTER TABLE artist_profiles ADD COLUMN other_category TEXT DEFAULT ''",
    "ALTER TABLE owner_profiles ADD COLUMN other_business_type TEXT DEFAULT ''",
  ]
  for (const sql of migrations) {
    try { await runAsync(sql, []) } catch { /* columna ya existe, ignorar */ }
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Next.js 15: params es una Promise, hay que await antes de usar
    const { id: userId } = await params

    // Crear columnas faltantes si no existen (sin borrar datos)
    await ensureUserColumns()

    // Ahora sí podemos consultar todas las columnas con seguridad
    const user = await getAsync(
      `SELECT 
         u.id,
         u.first_name,
         u.last_name,
         u.email,
         u.phone,
         u.role,
         COALESCE(u.is_active, 1)     AS is_active,
         COALESCE(u.is_sanctioned, 0) AS is_sanctioned,
         u.sanction_reason,
         u.sanction_start,
         u.sanction_end,
         p.bio,
         p.location,
         COALESCE(p.verified, 0) AS verified,
         p.phone AS profile_phone
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE u.id = ?`,
      [userId]
    )

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    // Reseñas recibidas con nombre del autor
    const reviews = await allAsync(
      `SELECT
         r.id,
         r.rating,
         r.comment,
         r.created_at,
         r.reviewer_id,
         (reviewer.first_name || ' ' || reviewer.last_name) AS reviewer_name,
         reviewer.email AS reviewer_email
       FROM reviews r
       LEFT JOIN users reviewer ON r.reviewer_id = reviewer.id
       WHERE r.reviewed_user_id = ?
       ORDER BY r.created_at DESC`,
      [userId]
    )

    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
        : 0

    // Perfil de artista — columnas opcionales consultadas de forma segura
    let artistProfile = null
    if (user.role === "artist") {
      // First try with other_category, fall back without it if column doesn't exist
      try {
        artistProfile = await getAsync(
          `SELECT
             stage_name,
             COALESCE(category, "") AS category,
             COALESCE(other_category, "") AS other_category,
             COALESCE(experience_years, years_of_experience, 0) AS experience_years,
             COALESCE(bio, description, "") AS bio,
             COALESCE(is_published, 0) AS is_published
           FROM artist_profiles
           WHERE user_id = ?`,
          [userId]
        )
      } catch {
        try {
          artistProfile = await getAsync(
            `SELECT
               stage_name,
               COALESCE(category, "") AS category,
               "" AS other_category,
               COALESCE(experience_years, years_of_experience, 0) AS experience_years,
               COALESCE(bio, description, "") AS bio,
               COALESCE(is_published, 0) AS is_published
             FROM artist_profiles
             WHERE user_id = ?`,
            [userId]
          )
        } catch { artistProfile = null }
      }
    }

    // Perfil de dueño de local — columnas opcionales consultadas de forma segura
    let ownerProfile = null
    if (user.role === "owner") {
      try {
        ownerProfile = await getAsync(
          `SELECT
             business_name,
             COALESCE(business_type, "") AS business_type,
             COALESCE(other_business_type, "") AS other_business_type,
             COALESCE(address, "")       AS address,
             COALESCE(city, "")          AS city,
             COALESCE(neighborhood, "")  AS neighborhood,
             COALESCE(capacity, 0)       AS capacity,
             COALESCE(description, "")   AS description,
             COALESCE(is_published, 0)   AS is_published
           FROM owner_profiles
           WHERE user_id = ?`,
          [userId]
        )
      } catch {
        try {
          ownerProfile = await getAsync(
            `SELECT
               business_name,
               COALESCE(business_type, "") AS business_type,
               "" AS other_business_type,
               COALESCE(address, "")       AS address,
               COALESCE(city, "")          AS city,
               COALESCE(neighborhood, "")  AS neighborhood,
               COALESCE(capacity, 0)       AS capacity,
               COALESCE(description, "")   AS description,
               COALESCE(is_published, 0)   AS is_published
             FROM owner_profiles
             WHERE user_id = ?`,
            [userId]
          )
        } catch { ownerProfile = null }
      }
    }

    return NextResponse.json({
      user: {
        ...user,
        average_rating: Math.round(avgRating * 10) / 10,
        review_count: reviews.length,
        reviews,
        artist_profile: artistProfile ?? null,
        owner_profile: ownerProfile ?? null,
        subscription: await (async () => {
          try {
            const { getAsync: ga } = await import("@/lib/db")
            return await ga(
              `SELECT *, CAST((julianday(expires_at) - julianday('now')) AS INTEGER) as days_remaining
               FROM subscriptions WHERE user_id = ? AND status = 'active' AND expires_at > datetime('now')
               ORDER BY expires_at DESC LIMIT 1`,
              [userId]
            ) ?? null
          } catch { return null }
        })(),
      },
    })
  } catch (error) {
    console.error("[admin users/[id] GET]", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
