import { type NextRequest, NextResponse } from "next/server"
import { allQuery, runQuery } from "@/lib/db"

// GET - Obtener todos los usuarios (solo admin)
export async function GET() {
  try {
    // Asegurar columnas necesarias
    try { await runQuery("ALTER TABLE reviews ADD COLUMN is_visible BOOLEAN DEFAULT 1", []) } catch { /* ya existe */ }
    try { await runQuery("ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT 1", []) } catch { /* ya existe */ }
    try { await runQuery("ALTER TABLE users ADD COLUMN is_sanctioned BOOLEAN DEFAULT 0", []) } catch { /* ya existe */ }
    try { await runQuery("ALTER TABLE users ADD COLUMN sanction_reason TEXT", []) } catch { /* ya existe */ }
    try { await runQuery("ALTER TABLE users ADD COLUMN sanction_start DATETIME", []) } catch { /* ya existe */ }
    try { await runQuery("ALTER TABLE users ADD COLUMN sanction_end DATETIME", []) } catch { /* ya existe */ }

    const users = await allQuery(
      `SELECT 
        u.*,
        p.bio, p.location, p.rating, p.verified, p.phone as profile_phone,
        ap.stage_name as artist_name, ap.category as artist_category, ap.is_published as artist_published,
        COALESCE(ap.experience_years, ap.years_of_experience) as artist_experience_years,
        op.business_name, op.business_type, op.is_published as owner_published,
        op.address as owner_address, op.city as owner_city, op.neighborhood as owner_neighborhood,
        op.capacity as owner_capacity,
        ROUND(COALESCE(AVG(r.rating), 0), 1) as avg_rating,
        COUNT(r.id) as review_count
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      LEFT JOIN artist_profiles ap ON u.id = ap.user_id
      LEFT JOIN owner_profiles op ON u.id = op.user_id
      LEFT JOIN reviews r ON u.id = r.reviewed_user_id
      GROUP BY u.id
      ORDER BY u.created_at DESC`,
      [],
    )

    return NextResponse.json({ users })
  } catch (error) {
    console.error("[v0] Error obteniendo usuarios:", error)
    return NextResponse.json({ error: "Error obteniendo usuarios" }, { status: 500 })
  }
}

// PATCH - Actualizar usuario (solo admin)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, action } = body

    if (!userId || !action) {
      return NextResponse.json({ error: "userId y action son requeridos" }, { status: 400 })
    }

    console.log("[v0] Acción de admin en usuario:", userId, "acción:", action)

    if (action === "verify") {
      await runQuery(`UPDATE profiles SET verified = 1 WHERE user_id = ?`, [userId])
    } else if (action === "unverify") {
      await runQuery(`UPDATE profiles SET verified = 0 WHERE user_id = ?`, [userId])
    } else if (action === "disable") {
      // Deshabilitar cuenta del usuario
      await runQuery(`UPDATE users SET is_active = 0 WHERE id = ?`, [userId])
      await runQuery(`UPDATE artist_profiles SET is_published = 0 WHERE user_id = ?`, [userId])
      await runQuery(`UPDATE owner_profiles SET is_published = 0 WHERE user_id = ?`, [userId])
    } else if (action === "enable") {
      // Habilitar cuenta del usuario
      await runQuery(`UPDATE users SET is_active = 1 WHERE id = ?`, [userId])
    } else if (action === "suspend") {
      // Suspender (despublicar todos los perfiles pero mantener cuenta activa)
      await runQuery(`UPDATE artist_profiles SET is_published = 0 WHERE user_id = ?`, [userId])
      await runQuery(`UPDATE owner_profiles SET is_published = 0 WHERE user_id = ?`, [userId])
    } else if (action === "delete") {
      await runQuery(`DELETE FROM users WHERE id = ?`, [userId])
    } else if (action === "sanction") {
      // Apply sanction: mark user as sanctioned and unpublish profiles
      // Add sanction columns if missing
      try { await runQuery("ALTER TABLE users ADD COLUMN is_sanctioned BOOLEAN DEFAULT 0", []) } catch {}
      try { await runQuery("ALTER TABLE users ADD COLUMN sanction_reason TEXT", []) } catch {}
      try { await runQuery("ALTER TABLE users ADD COLUMN sanction_start DATETIME", []) } catch {}
      try { await runQuery("ALTER TABLE users ADD COLUMN sanction_end DATETIME", []) } catch {}

      const { sanctionReason, sanctionDays, sanctionEndDate } = body
      const startDate = new Date().toISOString()
      const days = sanctionDays != null ? Number(sanctionDays) : 7
      const endDate = sanctionEndDate || new Date(Date.now() + days * 86400000).toISOString()

      await runQuery(
        `UPDATE users SET is_sanctioned = 1, sanction_reason = ?, sanction_start = ?, sanction_end = ? WHERE id = ?`,
        [sanctionReason || "Incumplimiento de normas", startDate, endDate, userId],
      )
      await runQuery(`UPDATE profiles SET verified = 0 WHERE user_id = ?`, [userId])
      await runQuery(`UPDATE artist_profiles SET is_published = 0 WHERE user_id = ?`, [userId])
      await runQuery(`UPDATE owner_profiles SET is_published = 0 WHERE user_id = ?`, [userId])

      // Send notification to sanctioned user
      try {
        const endDateFormatted = new Date(endDate).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })
        await runQuery(
          `INSERT INTO notifications (user_id, type, title, message, related_type) VALUES (?, ?, ?, ?, ?)`,
          [
            userId,
            "sanction",
            "Tu cuenta ha sido sancionada",
            `Motivo: ${sanctionReason || "Incumplimiento de normas"}. Duración: ${days} día(s). Tu perfil estará desactivado hasta el ${endDateFormatted}. Si tenés dudas, contactá a soporte.`,
            "sanction",
          ],
        )
      } catch { /* notifications table might not exist yet */ }
    } else if (action === "deactivate") {
      // Deactivate user account completely
      await runQuery(`UPDATE users SET is_active = 0 WHERE id = ?`, [userId])
      await runQuery(`UPDATE artist_profiles SET is_published = 0 WHERE user_id = ?`, [userId])
      await runQuery(`UPDATE owner_profiles SET is_published = 0 WHERE user_id = ?`, [userId])
    } else if (action === "unsanction") {
      // Remove sanction from user
      try { await runQuery("ALTER TABLE users ADD COLUMN is_sanctioned BOOLEAN DEFAULT 0", []) } catch {}
      await runQuery(
        `UPDATE users SET is_sanctioned = 0, sanction_reason = NULL, sanction_start = NULL, sanction_end = NULL WHERE id = ?`,
        [userId]
      )
      // Restore profile visibility
      await runQuery(`UPDATE artist_profiles SET is_published = 1 WHERE user_id = ?`, [userId])
      await runQuery(`UPDATE owner_profiles SET is_published = 1 WHERE user_id = ?`, [userId])
      // Notify user
      try {
        await runQuery(
          `INSERT INTO notifications (user_id, type, title, message, related_type) VALUES (?, ?, ?, ?, ?)`,
          [userId, "sanction", "Tu sanción ha sido levantada", "El administrador ha levantado la sanción de tu cuenta. Ya podés acceder normalmente a la plataforma.", "sanction"]
        )
      } catch { /* notifications may not exist */ }
    }

    return NextResponse.json({ success: true, message: `Usuario ${action}` })
  } catch (error) {
    console.error("[v0] Error en acción de admin:", error)
    return NextResponse.json({ error: "Error ejecutando acción" }, { status: 500 })
  }
}
