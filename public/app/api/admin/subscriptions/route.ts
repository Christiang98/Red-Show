import { allAsync } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Ensure table exists first (it might not if no one subscribed yet)
    try {
      const subscriptions = await allAsync(
        `SELECT s.*, 
          CAST((julianday(s.expires_at) - julianday('now')) AS INTEGER) as days_remaining
         FROM subscriptions s
         WHERE s.status = 'active'
         ORDER BY s.created_at DESC`,
        []
      )
      return NextResponse.json({ subscriptions })
    } catch {
      // Table doesn't exist yet
      return NextResponse.json({ subscriptions: [] })
    }
  } catch (error) {
    console.error("[admin/subscriptions] Error:", error)
    return NextResponse.json({ subscriptions: [] })
  }
}
