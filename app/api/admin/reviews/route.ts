import { allAsync, runAsync, initializeDatabaseIfNeeded } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

// GET - Obtener todas las reseñas (solo admin)
export async function GET() {
  try {
    await initializeDatabaseIfNeeded()

    const reviews = await allAsync(
      `
      SELECT 
        r.*,
        u_reviewer.first_name as reviewer_first_name,
        u_reviewer.last_name as reviewer_last_name,
        u_reviewer.email as reviewer_email,
        u_reviewed.first_name as reviewed_first_name,
        u_reviewed.last_name as reviewed_last_name,
        u_reviewed.email as reviewed_email,
        ap.stage_name as reviewed_artist_name,
        op.business_name as reviewed_business_name
      FROM reviews r
      LEFT JOIN users u_reviewer ON r.reviewer_id = u_reviewer.id
      LEFT JOIN users u_reviewed ON r.reviewed_user_id = u_reviewed.id
      LEFT JOIN artist_profiles ap ON u_reviewed.id = ap.user_id
      LEFT JOIN owner_profiles op ON u_reviewed.id = op.user_id
      ORDER BY r.created_at DESC
      `,
      [],
    )

    return NextResponse.json({ reviews }, { status: 200 })
  } catch (error) {
    console.error("[v0] Error obteniendo reseñas:", error)
    return NextResponse.json(
      { error: `Error interno: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 },
    )
  }
}

// DELETE - Eliminar reseña (solo admin)
export async function DELETE(request: NextRequest) {
  try {
    await initializeDatabaseIfNeeded()

    const { searchParams } = new URL(request.url)
    const reviewId = searchParams.get("reviewId")

    if (!reviewId) {
      return NextResponse.json({ error: "reviewId es requerido" }, { status: 400 })
    }

    await runAsync("DELETE FROM reviews WHERE id = ?", [Number.parseInt(reviewId)])

    return NextResponse.json({ success: true, message: "Reseña eliminada" }, { status: 200 })
  } catch (error) {
    console.error("[v0] Error eliminando reseña:", error)
    return NextResponse.json(
      { error: `Error interno: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 },
    )
  }
}
