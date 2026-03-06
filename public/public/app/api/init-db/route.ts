import { initializeDatabaseIfNeeded } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    await initializeDatabaseIfNeeded()
    return NextResponse.json({ message: "Base de datos inicializada correctamente" }, { status: 200 })
  } catch (error) {
    console.error("[v0] Error inicializando BD:", error)
    return NextResponse.json({ error: "Error inicializando BD" }, { status: 500 })
  }
}
