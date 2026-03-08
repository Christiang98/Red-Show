"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { AppNavbar } from "@/components/navigation/app-navbar"
import { useToast } from "@/hooks/use-toast"
import { Ticket, Calendar, Clock, MapPin, Loader2, QrCode, Shield } from "lucide-react"

function QRDisplay({ qrCode, size = 180 }: { qrCode: string; size?: number }) {
  const hash = qrCode.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const cells = 25
  const grid: boolean[][] = []
  for (let r = 0; r < cells; r++) {
    grid[r] = []
    for (let c = 0; c < cells; c++) {
      const inFinderTL = r < 8 && c < 8
      const inFinderTR = r < 8 && c >= cells - 8
      const inFinderBL = r >= cells - 8 && c < 8
      if (inFinderTL || inFinderTR || inFinderBL) {
        const dr = inFinderTL ? r : inFinderTR ? r : r - (cells - 8)
        const dc = inFinderTL ? c : inFinderTR ? c - (cells - 8) : c
        const inBorder = dr === 0 || dr === 6 || dc === 0 || dc === 6
        const inInner = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4
        grid[r][c] = inBorder || inInner
      } else {
        const seed = (r * cells + c + hash) % 7
        grid[r][c] = seed < 3
      }
    }
  }
  const cellSize = Math.floor(size / cells)
  const actualSize = cellSize * cells
  return (
    <div style={{ width: actualSize, height: actualSize, background: "white", padding: 10, borderRadius: 16, display: "inline-block", boxShadow: "0 8px 32px rgba(183,68,184,0.25), 0 2px 8px rgba(0,0,0,0.3)" }}>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cells}, ${cellSize}px)`, gap: 0, borderRadius: 4, overflow: "hidden" }}>
        {grid.flat().map((filled, i) => {
          const row = Math.floor(i / cells); const col = i % cells
          const inFinderTL = row < 8 && col < 8; const inFinderTR = row < 8 && col >= cells - 8; const inFinderBL = row >= cells - 8 && col < 8
          const isFinderZone = inFinderTL || inFinderTR || inFinderBL
          return <div key={i} style={{ width: cellSize, height: cellSize, background: filled ? (isFinderZone ? "#B744B8" : "#1a0a2e") : "#fff", borderRadius: filled && isFinderZone ? 1 : 0 }} />
        })}
      </div>
    </div>
  )
}

function TicketCard({ ticket }: { ticket: any }) {
  const [showQR, setShowQR] = useState(false)

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "Fecha a confirmar"
    try {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const [y, m, d] = dateStr.split("-").map(Number)
        return new Date(y, m - 1, d).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })
      }
      return new Date(dateStr).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })
    } catch { return dateStr }
  }
  const formatTime = (t: string) => t ? t.substring(0, 5) : null
  const formatPrice = (price: number) => (!price || price === 0) ? "Gratis" : `$${price.toLocaleString("es-AR")}`
  const timeDisplay = ticket.event_time ? `${formatTime(ticket.event_time)}${ticket.event_time_end ? ` - ${formatTime(ticket.event_time_end)}` : ""}` : null

  return (
    <div className="relative overflow-hidden rounded-3xl"
      style={{ background: "linear-gradient(160deg, #1a0a2e 0%, #0d0520 50%, #080b14 100%)", border: "1px solid rgba(183,68,184,0.35)", boxShadow: "0 0 40px rgba(183,68,184,0.1), inset 0 1px 0 rgba(255,255,255,0.06)" }}>

      {/* Glow top */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-20 opacity-25 pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(183,68,184,0.8) 0%, transparent 70%)" }} />

      {/* Header */}
      <div className="relative px-5 pt-5 pb-4 flex items-start justify-between gap-3"
        style={{ borderBottom: "1px dashed rgba(255,255,255,0.12)" }}>
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ background: "linear-gradient(135deg, #B744B8, #7a1a8a)" }}>
            <Ticket className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0">
            {ticket.event_category && (
              <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold text-white mb-1"
                style={{ background: "linear-gradient(135deg, #B744B8, #7a1a8a)" }}>
                {ticket.event_category}
              </span>
            )}
            <h3 className="font-black text-white text-base leading-tight line-clamp-2">{ticket.event_title}</h3>
            {ticket.organizer_name && <p className="text-white/35 text-xs mt-0.5">por {ticket.organizer_name}</p>}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-white/30 text-xs">#{ticket.id}</p>
          <p className="font-black text-sm mt-0.5" style={{ background: "linear-gradient(135deg, #fff, #B744B8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            {formatPrice(ticket.unit_price)}
          </p>
        </div>
      </div>

      {/* Info evento */}
      <div className="px-5 py-4 space-y-2">
        {ticket.event_date && (
          <div className="flex items-center gap-2 text-white/55 text-sm">
            <Calendar className="h-3.5 w-3.5 text-purple-400 flex-shrink-0" />
            <span>{formatDate(ticket.event_date)}</span>
          </div>
        )}
        {timeDisplay && (
          <div className="flex items-center gap-2 text-white/55 text-sm">
            <Clock className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />
            <span>{timeDisplay}</span>
          </div>
        )}
        {ticket.event_location && (
          <div className="flex items-center gap-2 text-white/55 text-sm">
            <MapPin className="h-3.5 w-3.5 text-green-400 flex-shrink-0" />
            <span className="line-clamp-1">{ticket.event_location}</span>
          </div>
        )}
      </div>

      {/* Separador tipo ticket */}
      <div className="relative flex items-center" style={{ borderTop: "1px dashed rgba(255,255,255,0.12)" }}>
        <div className="absolute -left-3 w-6 h-6 rounded-full" style={{ background: "linear-gradient(160deg, #080b14, #0d0817)" }} />
        <div className="absolute -right-3 w-6 h-6 rounded-full" style={{ background: "linear-gradient(160deg, #080b14, #0d0817)" }} />
      </div>

      {/* QR section */}
      <div className="px-5 py-4">
        <button onClick={() => setShowQR(!showQR)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{ background: showQR ? "rgba(183,68,184,0.15)" : "rgba(255,255,255,0.05)", border: `1px solid ${showQR ? "rgba(183,68,184,0.4)" : "rgba(255,255,255,0.1)"}`, color: showQR ? "#B744B8" : "rgba(255,255,255,0.5)" }}>
          <QrCode className="h-4 w-4" />
          {showQR ? "Ocultar QR" : "Mostrar código QR"}
        </button>

        {showQR && (
          <div className="mt-5 flex flex-col items-center gap-4">
            {/* Marco QR */}
            <div className="relative p-1 rounded-2xl" style={{ background: "linear-gradient(135deg, #B744B8, #001C55, #B744B8)" }}>
              <div className="p-2 rounded-xl" style={{ background: "#fff" }}>
                <QRDisplay qrCode={ticket.qr_code} size={180} />
              </div>
              <div className="absolute -top-1 -left-1 w-4 h-4 rounded-tl-lg border-t-2 border-l-2 border-purple-400" />
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-tr-lg border-t-2 border-r-2 border-purple-400" />
              <div className="absolute -bottom-1 -left-1 w-4 h-4 rounded-bl-lg border-b-2 border-l-2 border-purple-400" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-br-lg border-b-2 border-r-2 border-purple-400" />
            </div>
            <div className="px-4 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-white/40 font-mono text-xs tracking-widest">{ticket.qr_code}</p>
            </div>
            <p className="text-white/35 text-xs text-center">Presentá este código en la entrada del evento</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 flex items-center justify-between" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <p className="text-white/25 text-xs">Entrada válida · Red Show</p>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-green-400 text-xs font-semibold">Válida</span>
        </div>
      </div>
    </div>
  )
}

export default function TicketsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) { router.push("/login"); return }
    setUser(currentUser)
  }, [router])

  const loadTickets = async () => {
    if (!user) return
    setLoading(true)
    try {
      const res = await fetch(`/api/tickets?userId=${user.id}`)
      const data = await res.json()
      setTickets(Array.isArray(data) ? data : [])
    } catch {
      toast({ title: "Error al cargar entradas", variant: "destructive" })
    }
    setLoading(false)
  }

  useEffect(() => { if (user) loadTickets() }, [user])

  if (!user) return <div className="flex items-center justify-center min-h-screen text-white">Cargando...</div>

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #050914 0%, #0a0f1e 50%, #080b18 100%)" }}>
      <AppNavbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #B744B8, #7a1a8a)" }}>
              <Ticket className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-3xl font-black text-white">Mis Entradas</h1>
          </div>
          <p className="text-white/50 text-sm ml-13">Todas tus entradas compradas en Red Show</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-purple-400 animate-spin" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: "rgba(183,68,184,0.1)", border: "1px solid rgba(183,68,184,0.2)" }}>
              <Ticket className="h-10 w-10 text-purple-400/40" />
            </div>
            <p className="text-white/40 text-lg font-semibold">No tenés entradas todavía</p>
            <p className="text-white/25 text-sm mt-1">Comprá entradas para los eventos de la comunidad</p>
            <button
              onClick={() => router.push("/events")}
              className="mt-6 px-6 py-3 rounded-xl font-bold text-white transition-all"
              style={{ background: "linear-gradient(135deg, #001C55, #B744B8)" }}>
              Ver eventos
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tickets.map(ticket => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
