import { allAsync, runAsync } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const location = searchParams.get("location")

    let query = "SELECT * FROM events WHERE 1=1"
    const params: any[] = []

    if (category) {
      query += " AND category LIKE ?"
      params.push(`%${category}%`)
    }

    if (location) {
      query += " AND location LIKE ?"
      params.push(`%${location}%`)
    }

    query += " ORDER BY created_at DESC LIMIT 50"

    const events = await allAsync(query, params)
    return NextResponse.json(events, { status: 200 })
  } catch (error) {
    console.error("[v0] Error obteniendo eventos:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { ownerId, title, description, category, location, eventDate, capacity, price } = await request.json()

    const result = await runAsync(
      "INSERT INTO events (owner_id, title, description, category, location, event_date, capacity, price) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [ownerId, title, description, category, location, eventDate, capacity, price],
    )

    return NextResponse.json({ id: result.id, message: "Evento creado" }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creando evento:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
