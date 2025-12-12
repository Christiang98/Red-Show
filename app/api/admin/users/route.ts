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
        op.business_name, op.business_type, op.is_published as owner_published
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      LEFT JOIN artist_profiles ap ON u.id = ap.user_id
      LEFT JOIN owner_profiles op ON u.id = op.user_id
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
    } else if (action === "suspend") {
      // Despublicar todos los perfiles del usuario
      await runQuery(`UPDATE artist_profiles SET is_published = 0 WHERE user_id = ?`, [userId])
      await runQuery(`UPDATE owner_profiles SET is_published = 0 WHERE user_id = ?`, [userId])
    } else if (action === "delete") {
      await runQuery(`DELETE FROM users WHERE id = ?`, [userId])
    }

    return NextResponse.json({ success: true, message: `Usuario ${action}` })
  } catch (error) {
    console.error("[v0] Error en acción de admin:", error)
    return NextResponse.json({ error: "Error ejecutando acción" }, { status: 500 })
  }
}
