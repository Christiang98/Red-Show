import { allQuery } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("query") || ""
    const location = searchParams.get("location") || ""
    const category = searchParams.get("category") || ""

    console.log("[v0] Búsqueda:", { query, location, category })

    let sql = `
      SELECT 
        u.id, u.email, u.first_name, u.last_name, u.role,
        p.bio, p.location, p.avatar_url, p.instagram, p.tiktok,
        ap.stage_name as artist_name, 
        ap.category as artist_category,
        ap.experience_years,
        ap.profile_image as artist_image,
        ap.price_range,
        ap.neighborhood as artist_neighborhood,
        ap.is_published as artist_published,
        op.business_name, 
        op.business_type,
        op.capacity,
        op.city as owner_city,
        op.neighborhood as owner_neighborhood,
        op.profile_image as owner_image,
        op.is_published as owner_published
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      LEFT JOIN artist_profiles ap ON u.id = ap.user_id
      LEFT JOIN owner_profiles op ON u.id = op.user_id
      WHERE (
        (u.role = 'artist' AND ap.is_published = 1) OR
        (u.role = 'owner' AND op.is_published = 1)
      )
    `

    const params: any[] = []

    if (query) {
      sql += ` AND (
        u.first_name LIKE ? OR 
        u.last_name LIKE ? OR 
        p.bio LIKE ? OR
        ap.stage_name LIKE ? OR
        ap.category LIKE ? OR
        op.business_name LIKE ? OR
        op.business_type LIKE ?
      )`
      const queryParam = `%${query}%`
      params.push(queryParam, queryParam, queryParam, queryParam, queryParam, queryParam, queryParam)
    }

    if (location) {
      sql += ` AND (p.location LIKE ? OR op.city LIKE ? OR ap.neighborhood LIKE ? OR op.neighborhood LIKE ?)`
      const locationParam = `%${location}%`
      params.push(locationParam, locationParam, locationParam, locationParam)
    }

    if (category) {
      if (category === "space") {
        sql += ` AND u.role = 'owner'`
      } else if (category === "artist") {
        sql += ` AND u.role = 'artist'`
      } else {
        sql += ` AND ap.category LIKE ?`
        params.push(`%${category}%`)
      }
    }

    sql += ` ORDER BY u.created_at DESC LIMIT 50`

    const results = await allQuery(sql, params)

    const transformedResults = results.map((row: any) => ({
      id: row.id,
      role: row.role,
      name:
        row.role === "owner"
          ? row.business_name || `${row.first_name} ${row.last_name}`
          : row.artist_name || `${row.first_name} ${row.last_name}`,
      category: row.role === "owner" ? row.business_type : row.artist_category,
      location:
        row.role === "owner"
          ? `${row.owner_city || row.location}${row.owner_neighborhood ? `, ${row.owner_neighborhood}` : ""}`
          : `${row.location}${row.artist_neighborhood ? `, ${row.artist_neighborhood}` : ""}`,
      bio: row.bio,
      avatar_url: row.role === "owner" ? row.owner_image || row.avatar_url : row.artist_image || row.avatar_url,
      rating: 0,
      capacity: row.capacity,
      experience_years: row.experience_years,
      price_range: row.price_range,
    }))

    return NextResponse.json(transformedResults, { status: 200 })
  } catch (error) {
    console.error("[v0] Error en búsqueda:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
