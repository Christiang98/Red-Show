import { type NextRequest, NextResponse } from "next/server"
import { allAsync, runAsync, getAsync } from "@/lib/db"

// Ensure subscriptions table exists
async function ensureTable() {
  await runAsync(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      plan_name VARCHAR(50) NOT NULL,
      plan_type VARCHAR(20) NOT NULL,
      price VARCHAR(20) NOT NULL,
      payment_method VARCHAR(50),
      payment_reference VARCHAR(100),
      status VARCHAR(20) DEFAULT 'active',
      starts_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `, [])
  try { await runAsync("CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id)", []) } catch {}
  try { await runAsync("CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status)", []) } catch {}
}

export async function GET(request: NextRequest) {
  try {
    await ensureTable()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) return NextResponse.json({ error: "userId requerido" }, { status: 400 })

    // Get active subscription with days remaining
    const subscription = await getAsync(
      `SELECT *, 
        CAST((julianday(expires_at) - julianday('now')) AS INTEGER) as days_remaining
       FROM subscriptions 
       WHERE user_id = ? AND status = 'active' AND expires_at > datetime('now')
       ORDER BY expires_at DESC LIMIT 1`,
      [userId]
    )

    return NextResponse.json({ subscription: subscription || null })
  } catch (error) {
    console.error("[subscriptions] Error GET:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureTable()
    const { userId, planName, planType, price, paymentMethod } = await request.json()

    if (!userId || !planName || !planType || !price) {
      return NextResponse.json({ error: "Datos requeridos incompletos" }, { status: 400 })
    }

    // Cancel any existing active subscriptions
    await runAsync(
      "UPDATE subscriptions SET status = 'cancelled' WHERE user_id = ? AND status = 'active'",
      [userId]
    )

    // Create subscription (1 month duration)
    const expiresAt = new Date()
    expiresAt.setMonth(expiresAt.getMonth() + 1)

    const ref = `SUB-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

    const result = await runAsync(
      `INSERT INTO subscriptions (user_id, plan_name, plan_type, price, payment_method, payment_reference, status, starts_at, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, 'active', datetime('now'), ?)`,
      [userId, planName, planType, price, paymentMethod || "Sin especificar", ref, expiresAt.toISOString()]
    )

    // Create notification
    try {
      await runAsync(
        `INSERT INTO notifications (user_id, type, title, message, related_type) VALUES (?, ?, ?, ?, ?)`,
        [userId, "subscription", "¡Suscripción activada!", 
         `Tu plan ${planName} ha sido activado. Tenés acceso completo hasta el ${expiresAt.toLocaleDateString("es-AR")}.`,
         "subscription"]
      )
    } catch {}

    return NextResponse.json({ 
      success: true, 
      subscriptionId: result.id,
      expiresAt: expiresAt.toISOString(),
      reference: ref
    })
  } catch (error) {
    console.error("[subscriptions] Error POST:", error)
    return NextResponse.json({ error: "Error al crear suscripción" }, { status: 500 })
  }
}
