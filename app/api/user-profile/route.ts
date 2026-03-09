import { type NextRequest, NextResponse } from "next/server"
import { getAsync, runAsync, initializeDatabaseIfNeeded } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    await initializeDatabaseIfNeeded()
    const userId = request.nextUrl.searchParams.get("userId")
    if (!userId) return NextResponse.json({ error: "userId requerido" }, { status: 400 })

    const user = await getAsync(
      "SELECT id, email, first_name, last_name, phone, username, role FROM users WHERE id = ?",
      [userId]
    )
    if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })

    const profile = await getAsync("SELECT avatar_url FROM profiles WHERE user_id = ?", [userId])

    return NextResponse.json({
      user: {
        ...user,
        avatarUrl: profile?.avatar_url || null,
      }
    })
  } catch (error) {
    console.error("[user-profile GET]", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await initializeDatabaseIfNeeded()

    // Ensure username column exists
    try {
      await runAsync("ALTER TABLE users ADD COLUMN username VARCHAR(50) DEFAULT NULL", [])
    } catch { /* already exists */ }

    const body = await request.json()
    const { userId, username, phone, avatarUrl, firstName, lastName } = body

    if (!userId) return NextResponse.json({ error: "userId requerido" }, { status: 400 })

    // Validate username uniqueness if provided
    if (username) {
      // Only alphanumeric and underscores, 3-30 chars
      if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
        return NextResponse.json({
          error: "El nombre de usuario solo puede contener letras, números y guiones bajos (3-30 caracteres)"
        }, { status: 400 })
      }

      const existing = await getAsync(
        "SELECT id FROM users WHERE username = ? AND id != ?",
        [username, userId]
      )
      if (existing) {
        return NextResponse.json({ error: "Ese nombre de usuario ya está en uso" }, { status: 409 })
      }
    }

    // Update user fields
    const updates: string[] = []
    const params: any[] = []

    if (username !== undefined) { updates.push("username = ?"); params.push(username || null) }
    if (phone !== undefined)    { updates.push("phone = ?");    params.push(phone || "") }
    if (firstName !== undefined){ updates.push("first_name = ?"); params.push(firstName) }
    if (lastName !== undefined) { updates.push("last_name = ?");  params.push(lastName) }

    if (updates.length > 0) {
      updates.push("updated_at = CURRENT_TIMESTAMP")
      params.push(userId)
      await runAsync(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`, params)
    }

    // Update avatar in profiles table
    if (avatarUrl !== undefined) {
      const existingProfile = await getAsync("SELECT id FROM profiles WHERE user_id = ?", [userId])
      if (existingProfile) {
        await runAsync("UPDATE profiles SET avatar_url = ? WHERE user_id = ?", [avatarUrl, userId])
      } else {
        await runAsync("INSERT INTO profiles (user_id, avatar_url) VALUES (?, ?)", [userId, avatarUrl])
      }
    }

    // Return updated user
    const updated = await getAsync(
      "SELECT id, email, first_name, last_name, phone, username, role FROM users WHERE id = ?",
      [userId]
    )
    const profile = await getAsync("SELECT avatar_url FROM profiles WHERE user_id = ?", [userId])

    return NextResponse.json({
      success: true,
      user: { ...updated, avatarUrl: profile?.avatar_url || null }
    })
  } catch (error) {
    console.error("[user-profile PATCH]", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
