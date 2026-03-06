"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { AppNavbar } from "@/components/navigation/app-navbar"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Ticket, Calendar, Clock, MapPin, Loader2, QrCode, Music, Download } from "lucide-react"

function QRDisplay({ qrCode, size = 120 }: { qrCode: string; size?: number }) {
  // Generamos un QR visual usando módulos CSS (sin librería externa)
  // Convertimos el string en un hash para un patrón determinístico
  const hash = qrCode.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const cells = 21
  const grid: boolean[][] = []

  for (let r = 0; r < cells; r++) {
    grid[r] = []
    for (let c = 0; c < cells; c++) {
      // Patrón de finder corners (esquinas del QR)
      const inFinderTL = r < 8 && c < 8
      const inFinderTR = r < 8 && c >= cells - 8
      const inFinderBL = r >= cells - 8 && c < 8

      if (inFinderTL || inFinderTR || inFinderBL) {
        // Patrón de finder squares
        const dr = inFinderTL ? r : inFinderTR ? r : r - (cells - 8)
        const dc = inFinderTL ? c : inFinderTR ? c - (cells - 8) : c
        const inBorder = dr === 0 || dr === 6 || dc === 0 || dc === 6
        const inInner = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4
        grid[r][c] = inBorder || inInner
      } else {
        // Datos "simulados" pero determinísticos al qrCode
        const seed = (r * cells + c + hash) % 7
        grid[r][c] = seed < 3
      }
    }
  }

  const cellSize = size / cells

  return (
    <div style={{ width: size, height: size, background: "white", padding: 4, borderRadius: 8, display: "inline-block" }}>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cells}, ${cellSize}px)`, gap: 0 }}>
        {grid.flat().map((filled, i) => (
          <div key={i} style={{
            width: cellSize, height: cellSize,
            background: filled ? "#000" : "#fff"
          }} />
        ))}
      </div>
    </div>
  )
}

function TicketCard({ ticket }: { ticket: any }) {
  const [showQR, setShowQR] = useState(false)

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "Fecha a confirmar"
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    } catch { return dateStr }
  }

  const formatTime = (timeStr: string) => {
    if (!timeStr) return null
    return timeStr.substring(0, 5)
  }

  const formatPrice = (price: number) => {
    if (!price || price === 0) return "Gratis"
    return `$${price.toLocaleString("es-AR")}`
  }

  return (
    <Card className="overflow-hidden border-0"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
      {/* Header degradado */}
      <div className="p-4 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1a0a2e 0%, #0d1022 100%)", borderBottom: "1px solid rgba(183,68,184,0.3)" }}>
        <div className="absolute inset-0 opacity-30"
          style={{ backgroundImage: "radial-gradient(circle at 80% 50%, rgba(183,68,184,0.4) 0%, transparent 60%)" }} />
        <div className="relative flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
                style={{ background: "linear-gradient(135deg, #B744B8, #7a1a8a)" }}>
                {ticket.event_category || "Evento"}
              </span>
            </div>
            <h3 className="font-black text-white text-base leading-tight line-clamp-2">{ticket.event_title}</h3>
            {ticket.organizer_name && (
              <p className="text-white/40 text-xs mt-1">por {ticket.organizer_name}</p>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-white/40 text-xs">Entrada #{ticket.id}</p>
            <p className="font-bold text-purple-400 text-sm mt-0.5">
              {ticket.quantity > 1 ? `${ticket.quantity}x ` : ""}{formatPrice(ticket.unit_price)}
            </p>
          </div>
        </div>
      </div>

      {/* Detalles */}
      <div className="p-4 space-y-2">
        {ticket.event_date && (
          <div className="flex items-center gap-2 text-white/60 text-sm">
            <Calendar className="h-4 w-4 text-purple-400 flex-shrink-0" />
            <span>{formatDate(ticket.event_date)}</span>
          </div>
        )}
        {(ticket.event_time || ticket.event_time_end) && (
          <div className="flex items-center gap-2 text-white/60 text-sm">
            <Clock className="h-4 w-4 text-blue-400 flex-shrink-0" />
            <span>
              {formatTime(ticket.event_time)}
              {ticket.event_time_end ? ` - ${formatTime(ticket.event_time_end)}` : ""}
            </span>
          </div>
        )}
        {ticket.event_location && (
          <div className="flex items-center gap-2 text-white/60 text-sm">
            <MapPin className="h-4 w-4 text-green-400 flex-shrink-0" />
            <span className="line-clamp-1">{ticket.event_location}</span>
          </div>
        )}
        {ticket.quantity > 1 && (
          <div className="flex items-center gap-2 text-white/60 text-sm">
            <Ticket className="h-4 w-4 text-orange-400 flex-shrink-0" />
            <span>{ticket.quantity} entradas · Total: {formatPrice(ticket.total_price)}</span>
          </div>
        )}
      </div>

      {/* Línea divisoria tipo entrada */}
      <div className="relative mx-4">
        <div style={{ borderTop: "2px dashed rgba(255,255,255,0.1)" }} />
        <div className="absolute left-[-16px] top-[-8px] w-4 h-4 rounded-full" style={{ background: "linear-gradient(135deg, #050914 0%, #0a0f1e 50%)" }} />
        <div className="absolute right-[-16px] top-[-8px] w-4 h-4 rounded-full" style={{ background: "linear-gradient(135deg, #050914 0%, #0a0f1e 50%)" }} />
      </div>

      {/* QR Section */}
      <div className="p-4">
        <button
          onClick={() => setShowQR(!showQR)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all"
          style={{
            background: showQR ? "rgba(183,68,184,0.15)" : "rgba(255,255,255,0.06)",
            border: `1px solid ${showQR ? "rgba(183,68,184,0.4)" : "rgba(255,255,255,0.1)"}`,
            color: showQR ? "#B744B8" : "rgba(255,255,255,0.6)"
          }}>
          <QrCode className="h-4 w-4" />
          {showQR ? "Ocultar código QR" : "Mostrar código QR"}
        </button>

        {showQR && (
          <div className="mt-4 flex flex-col items-center gap-3">
            <div className="p-3 rounded-2xl" style={{ background: "rgba(255,255,255,0.95)" }}>
              <QRDisplay qrCode={ticket.qr_code} size={160} />
            </div>
            <p className="text-white/30 text-xs text-center font-mono">{ticket.qr_code}</p>
            <p className="text-white/40 text-xs text-center">Presentá este código en la entrada del evento</p>
          </div>
        )}
      </div>
    </Card>
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
