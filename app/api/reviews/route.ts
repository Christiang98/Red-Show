import { allAsync, runAsync } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    const reviews = await allAsync(
      `SELECT r.*, u.first_name, u.last_name,
        op.profile_image as reviewer_owner_image,
        ap.profile_image as reviewer_artist_image
      FROM reviews r
      LEFT JOIN users u ON r.reviewer_id = u.id
      LEFT JOIN owner_profiles op ON r.reviewer_id = op.user_id
      LEFT JOIN artist_profiles ap ON r.reviewer_id = ap.user_id
      WHERE r.reviewed_user_id = ? 
      ORDER BY r.created_at DESC`,
      [userId],
    )

    const enriched = reviews.map((r: any) => ({
      ...r,
      author: `${r.first_name || ""} ${r.last_name || ""}`.trim() || "Usuario",
      authorAvatar: r.reviewer_owner_image || r.reviewer_artist_image || null,
      date: new Date(r.created_at).toLocaleDateString("es-AR", { year: "numeric", month: "long", day: "numeric" }),
    }))

    return NextResponse.json(enriched, { status: 200 })
  } catch (error) {
    console.error("[v0] Error obteniendo reseñas:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { reviewerId, reviewedUserId, bookingId, rating, comment } = await request.json()

    if (!reviewerId || !reviewedUserId || !rating || !comment) {
      return NextResponse.json({ error: "Campos requeridos faltantes" }, { status: 400 })
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "La calificación debe ser entre 1 y 5" }, { status: 400 })
    }

    // Verificar que no haya dejado reseña previamente para este usuario
    const existing = await allAsync(
      "SELECT id FROM reviews WHERE reviewer_id = ? AND reviewed_user_id = ?",
      [reviewerId, reviewedUserId]
    )

    if (existing && existing.length > 0) {
      return NextResponse.json({ error: "Ya has dejado una reseña para este usuario" }, { status: 400 })
    }

    const result = await runAsync(
      "INSERT INTO reviews (reviewer_id, reviewed_user_id, booking_id, rating, comment) VALUES (?, ?, ?, ?, ?)",
      [reviewerId, reviewedUserId, bookingId || null, rating, comment],
    )

    return NextResponse.json({ id: result.id, message: "Reseña creada" }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creando reseña:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
