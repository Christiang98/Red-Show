import { type NextRequest, NextResponse } from "next/server"
import { allQuery, runQuery, initializeDatabaseIfNeeded } from "@/lib/db"

// GET - Obtener todas las reseñas (solo admin)
export async function GET() {
  try {
    await initializeDatabaseIfNeeded()

    const reviews = await allQuery(
      `SELECT 
        r.*,
        reviewer.email as reviewer_email,
        reviewer.first_name as reviewer_first_name,
        reviewer.last_name as reviewer_last_name,
        reviewed.email as reviewed_email,
        reviewed.first_name as reviewed_first_name,
        reviewed.last_name as reviewed_last_name,
        ap.stage_name as reviewed_artist_name,
        op.business_name as reviewed_business_name
      FROM reviews r
      LEFT JOIN users reviewer ON r.reviewer_id = reviewer.id
      LEFT JOIN users reviewed ON r.reviewed_user_id = reviewed.id
      LEFT JOIN artist_profiles ap ON reviewed.id = ap.user_id
      LEFT JOIN owner_profiles op ON reviewed.id = op.user_id
      ORDER BY r.created_at DESC`,
      [],
    )

    return NextResponse.json({ reviews })
  } catch (error) {
    console.error("[v0] Error obteniendo reseñas:", error)
    return NextResponse.json({ error: "Error obteniendo reseñas" }, { status: 500 })
  }
}

// PATCH - Moderar reseñas (solo admin)
export async function PATCH(request: NextRequest) {
  try {
    await initializeDatabaseIfNeeded()

    const body = await request.json()
    const { reviewId, action } = body

    if (!reviewId || !action) {
      return NextResponse.json({ error: "reviewId y action son requeridos" }, { status: 400 })
    }

    console.log("[v0] Acción de admin en reseña:", reviewId, "acción:", action)

    if (action === "hide") {
      await runQuery(`UPDATE reviews SET is_visible = 0 WHERE id = ?`, [reviewId])
    } else if (action === "show") {
      await runQuery(`UPDATE reviews SET is_visible = 1 WHERE id = ?`, [reviewId])
    } else if (action === "delete") {
      await runQuery(`DELETE FROM reviews WHERE id = ?`, [reviewId])
    }

    return NextResponse.json({ success: true, message: `Reseña ${action}` })
  } catch (error) {
    console.error("[v0] Error en acción de admin sobre reseña:", error)
    return NextResponse.json({ error: "Error ejecutando acción" }, { status: 500 })
  }
}
