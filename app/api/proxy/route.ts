import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const { endpoint, method = "POST", body } = await request.json()
  const djangoUrl = `${process.env.NEXT_PUBLIC_DJANGO_API_URL || "http://localhost:8000/api"}${endpoint}`

  const token = request.headers.get("authorization")
  const headers: any = {
    "Content-Type": "application/json",
  }

  if (token) {
    headers["Authorization"] = token
  }

  try {
    const response = await fetch(djangoUrl, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("[v0] Proxy error:", error)
    return NextResponse.json({ error: "Error al conectar con el servidor" }, { status: 500 })
  }
}
