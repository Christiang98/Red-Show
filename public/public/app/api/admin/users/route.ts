import { type NextRequest, NextResponse } from "next/server"
import { allQuery, runQuery } from "@/lib/db"

// GET - Obtener todos los usuarios (solo admin)
export async function GET() {
  try {
    const users = await allQuery(
      `SELECT 
        u.*,
        p.bio, p.location, p.rating, p.verified,
        ap.stage_name as artist_name, ap.category as artist_category, ap.is_published as artist_published,
        op.business_name, op.business_type, op.is_published as owner_published,
        ROUND(COALESCE(AVG(r.rating), 0), 1) as avg_rating,
        COUNT(r.id) as review_count
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      LEFT JOIN artist_profiles ap ON u.id = ap.user_id
      LEFT JOIN owner_profiles op ON u.id = op.user_id
      LEFT JOIN reviews r ON u.id = r.reviewed_user_id AND r.is_visible = 1
      GROUP BY u.id
      ORDER BY u.created_at DESC`,
      [],
    )

    return NextResponse.json({ users })
  } catch (error) {
    console.error("[v0] Error obteniendo usuarios:", error)
    return NextResponse.json({ error: "Error obteniendo usuarios" }, { status: 500 })
  }
}

// PATCH - Actualizar usuario (solo admin)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, action } = body

    if (!userId || !action) {
      return NextResponse.json({ error: "userId y action son requeridos" }, { status: 400 })
    }

    console.log("[v0] Acción de admin en usuario:", userId, "acción:", action)

    if (action === "verify") {
      await runQuery(`UPDATE profiles SET verified = 1 WHERE user_id = ?`, [userId])
    } else if (action === "unverify") {
      await runQuery(`UPDATE profiles SET verified = 0 WHERE user_id = ?`, [userId])
    } else if (action === "disable") {
      // Deshabilitar cuenta del usuario
      await runQuery(`UPDATE users SET is_active = 0 WHERE id = ?`, [userId])
      await runQuery(`UPDATE artist_profiles SET is_published = 0 WHERE user_id = ?`, [userId])
      await runQuery(`UPDATE owner_profiles SET is_published = 0 WHERE user_id = ?`, [userId])
    } else if (action === "enable") {
      // Habilitar cuenta del usuario
      await runQuery(`UPDATE users SET is_active = 1 WHERE id = ?`, [userId])
    } else if (action === "suspend") {
      // Suspender (despublicar todos los perfiles pero mantener cuenta activa)
      await runQuery(`UPDATE artist_profiles SET is_published = 0 WHERE user_id = ?`, [userId])
      await runQuery(`UPDATE owner_profiles SET is_published = 0 WHERE user_id = ?`, [userId])
    } else if (action === "delete") {
      await runQuery(`DELETE FROM users WHERE id = ?`, [userId])
    } else if (action === "sanction") {
      // Apply sanction: add a note (using verified=0 as flag and suspend profiles)
      await runQuery(`UPDATE profiles SET verified = 0 WHERE user_id = ?`, [userId])
      await runQuery(`UPDATE artist_profiles SET is_published = 0 WHERE user_id = ?`, [userId])
      await runQuery(`UPDATE owner_profiles SET is_published = 0 WHERE user_id = ?`, [userId])
    }

    return NextResponse.json({ success: true, message: `Usuario ${action}` })
  } catch (error) {
    console.error("[v0] Error en acción de admin:", error)
    return NextResponse.json({ error: "Error ejecutando acción" }, { status: 500 })
  }
}
