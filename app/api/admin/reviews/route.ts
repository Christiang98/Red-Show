import { type NextRequest, NextResponse } from "next/server"
import { allQuery, runQuery, initializeDatabaseIfNeeded } from "@/lib/db"

// GET - Obtener todas las reseñas (solo admin)
export async function GET() {
  try {
    await initializeDatabaseIfNeeded()

    // Asegurar que is_visible exista
    try { await runQuery("ALTER TABLE reviews ADD COLUMN is_visible BOOLEAN DEFAULT 1", []) } catch { /* ya existe */ }

    const reviews = await allQuery(
      `SELECT 
        r.id, r.reviewer_id, r.reviewed_user_id, r.booking_id,
        r.rating, r.comment, r.is_visible, r.created_at,
        reviewer.first_name || ' ' || reviewer.last_name as reviewer_name,
        reviewed.first_name || ' ' || reviewed.last_name as reviewed_name
      FROM reviews r
      LEFT JOIN users reviewer ON r.reviewer_id = reviewer.id
      LEFT JOIN users reviewed ON r.reviewed_user_id = reviewed.id
      ORDER BY r.created_at DESC`,
      [],
    )

    return NextResponse.json({ reviews })
  } catch (error) {
    console.error("[admin reviews GET]", error)
    return NextResponse.json({ error: "Error obteniendo reseñas" }, { status: 500 })
  }
}

// PATCH - Moderar reseñas (solo admin)
export async function PATCH(request: NextRequest) {
  try {
    await initializeDatabaseIfNeeded()

    const body = await request.json()
    const { reviewId, isVisible, action } = body

    if (!reviewId) {
      return NextResponse.json({ error: "reviewId es requerido" }, { status: 400 })
    }

    // Support both action-based (from management page) and isVisible-based patterns
    if (action === "delete") {
      await runQuery(`DELETE FROM reviews WHERE id = ?`, [reviewId])
      return NextResponse.json({ success: true, message: "Reseña eliminada" })
    } else if (action === "hide") {
      await runQuery(`UPDATE reviews SET is_visible = 0 WHERE id = ?`, [reviewId])
    } else if (action === "show") {
      await runQuery(`UPDATE reviews SET is_visible = 1 WHERE id = ?`, [reviewId])
    } else if (isVisible !== undefined) {
      await runQuery(`UPDATE reviews SET is_visible = ? WHERE id = ?`, [isVisible ? 1 : 0, reviewId])
    } else {
      return NextResponse.json({ error: "Se requiere action o isVisible" }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[admin reviews PATCH]", error)
    return NextResponse.json({ error: "Error actualizando reseña" }, { status: 500 })
  }
}

// DELETE - Eliminar reseña (solo admin)
export async function DELETE(request: NextRequest) {
  try {
    await initializeDatabaseIfNeeded()

    const body = await request.json()
    const { reviewId } = body

    if (!reviewId) {
      return NextResponse.json({ error: "reviewId es requerido" }, { status: 400 })
    }

    await runQuery(`DELETE FROM reviews WHERE id = ?`, [reviewId])
    return NextResponse.json({ success: true, message: "Reseña eliminada" })
  } catch (error) {
    console.error("[admin reviews DELETE]", error)
    return NextResponse.json({ error: "Error eliminando reseña" }, { status: 500 })
  }
}
