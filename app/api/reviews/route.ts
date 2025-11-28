import { allAsync, runAsync } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    const reviews = await allAsync("SELECT * FROM reviews WHERE reviewed_user_id = ? ORDER BY created_at DESC", [
      userId,
    ])

    return NextResponse.json(reviews, { status: 200 })
  } catch (error) {
    console.error("[v0] Error obteniendo reseñas:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { reviewerId, reviewedUserId, bookingId, rating, comment } = await request.json()

    const result = await runAsync(
      "INSERT INTO reviews (reviewer_id, reviewed_user_id, booking_id, rating, comment) VALUES (?, ?, ?, ?, ?)",
      [reviewerId, reviewedUserId, bookingId, rating, comment],
    )

    return NextResponse.json({ id: result.id, message: "Reseña creada" }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creando reseña:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
