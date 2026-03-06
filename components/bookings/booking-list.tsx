"use client"

import { useState } from "react"
import {
  Check, X, MessageSquare, Calendar, User, Loader2,
  Clock, AlertCircle, CreditCard, Star, Trophy,
  ChevronDown, ChevronUp, Lock, ShieldCheck, DollarSign,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { getCurrentUser } from "@/lib/auth"
import { PaymentModal } from "./payment-modal"
import { NegotiationPanel } from "./negotiation-panel"

interface Booking {
  id: string | number
  artist_id?: number
  owner_id?: number
  title?: string
  booking_date?: string
  date?: string
  status: string
  description?: string
  price?: number
  proposed_price?: number
  sender_name?: string
  sender_image?: string
  sender_role?: string
  commission_paid?: boolean | number
  payment_method?: string
  payment_reference?: string
  artist_name?: string
  owner_name?: string
  event_time?: string
  event_time_end?: string
  accepted_by_artist?: boolean | number
  accepted_by_owner?: boolean | number
}

interface BookingListProps {
  bookings: Booking[]
  isReceived?: boolean
  onUpdateStatus?: (bookingId: string, status: string) => void
}

const STATUS: Record<string, { label: string; pill: string; dot: string }> = {
  pending:     { label: "Pendiente",             pill: "text-yellow-300 bg-yellow-500/15 border-yellow-500/35",  dot: "bg-yellow-400" },
  negotiating: { label: "En negociación",        pill: "text-orange-300 bg-orange-500/15 border-orange-500/35", dot: "bg-orange-400" },
  matched:     { label: "Acuerdo alcanzado",     pill: "text-blue-300   bg-blue-500/15   border-blue-500/35",   dot: "bg-blue-400"   },
  confirmed:   { label: "Confirmada y pagada",   pill: "text-green-300  bg-green-500/15  border-green-500/35",  dot: "bg-green-400"  },
  accepted:    { label: "Confirmada y pagada",   pill: "text-green-300  bg-green-500/15  border-green-500/35",  dot: "bg-green-400"  },
  rejected:    { label: "Rechazada",             pill: "text-red-300    bg-red-500/15    border-red-500/35",    dot: "bg-red-400"    },
  completed:   { label: "Evento realizado",      pill: "text-purple-300 bg-purple-500/15 border-purple-500/35", dot: "bg-purple-400" },
  cancelled:   { label: "Cancelada",             pill: "text-white/40   bg-white/8       border-white/15",      dot: "bg-white/30"   },
}

function fmtDate(d: string) {
  if (!d) return ""
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
    const [y, m, day] = d.split("-").map(Number)
    return new Date(y, m - 1, day).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })
  }
  return new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })
}

export function BookingList({ bookings, isReceived = false, onUpdateStatus }: BookingListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [loadingId,  setLoadingId]  = useState<string | null>(null)
  const [payingId,   setPayingId]   = useState<string | null>(null)
  // localOverrides: mapa de bookingId → datos actualizados localmente (sin esperar poll)
  const [localOverrides, setLocalOverrides] = useState<Record<string, Booking>>({})
  const router    = useRouter()
  const { toast } = useToast()
  const me        = getCurrentUser()
  const amIOwner  = me?.role === "owner"
  const myId      = me?.id ? Number(me.id) : 0

  // Merge local overrides con los bookings del padre
  const mergedBookings = bookings.map((b) => {
    const id = b.id.toString()
    return localOverrides[id] ? { ...b, ...localOverrides[id] } : b
  })

  const otherUserId = (b: Booking) => {
    if (isReceived) return b.sender_role === "artist" ? b.artist_id : b.owner_id
    return b.sender_role === "artist" ? b.owner_id : b.artist_id
  }

  const patchBooking = async (id: string, payload: object, msg: string) => {
    setLoadingId(id)
    try {
      const res  = await fetch(`/api/bookings/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error")
      onUpdateStatus?.(id, data.status || "")
      toast({ title: msg })
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" })
    } finally {
      setLoadingId(null)
    }
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-14 rounded-2xl"
           style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
        <Calendar className="w-9 h-9 mx-auto mb-3" style={{ color: "rgba(255,255,255,0.2)" }} />
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
          {isReceived ? "Todavía no recibiste propuestas" : "Todavía no enviaste propuestas"}
        </p>
      </div>
    )
  }

  return (
    <>
      {payingId && (() => {
        const b = bookings.find((x) => x.id.toString() === payingId)!
        return (
          <PaymentModal
            bookingId={payingId}
            bookingTitle={b.title || "Contratación"}
            artistName={b.artist_name || b.sender_name || "Artista"}
            bookingDate={b.booking_date || b.date}
            onSuccess={() => { onUpdateStatus?.(payingId, "confirmed"); setPayingId(null) }}
            onClose={() => setPayingId(null)}
          />
        )
      })()}

      <div className="space-y-3">
        {mergedBookings.map((booking) => {
          const id       = booking.id.toString()
          const expanded = expandedId === id
          const loading  = loadingId  === id
          const cfg      = STATUS[booking.status] ?? STATUS.pending
          const displayDate = booking.booking_date || booking.date
          const isArtistInBooking = Number(booking.artist_id) === myId

          // ¿Está en proceso de negociación?
          const isNegotiating = ["pending", "negotiating"].includes(booking.status)

          return (
            <div key={id} className="rounded-2xl overflow-hidden"
                 style={{
                   background: "linear-gradient(135deg,rgba(255,255,255,0.08) 0%,rgba(255,255,255,0.04) 100%)",
                   backdropFilter: "blur(12px)",
                   border: "1px solid rgba(255,255,255,0.12)",
                   boxShadow: "0 4px 24px rgba(0,0,0,0.25)",
                 }}>

              {/* ── Cabecera ──────────────────────────────────────── */}
              <div className="flex items-start justify-between gap-4 p-5">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h4 className="font-bold text-white truncate">{booking.title || "Sin título"}</h4>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${cfg.pill}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {displayDate && (
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />{fmtDate(displayDate)}
                      </span>
                    )}
                    {booking.event_time && (
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {booking.event_time.substring(0, 5)}
                        {booking.event_time_end ? ` → ${booking.event_time_end.substring(0, 5)}` : ""} hs
                      </span>
                    )}
                    {booking.sender_name && (
                      <span className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5" />{booking.sender_name}
                      </span>
                    )}
                    {booking.payment_reference && (
                      <span className="flex items-center gap-1.5 text-green-400/70">
                        <ShieldCheck className="h-3.5 w-3.5" />{booking.payment_reference}
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={() => setExpandedId(expanded ? null : id)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold flex-shrink-0 transition-all"
                  style={{ color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)" }}>
                  {expanded ? <><ChevronUp size={13} />Menos</> : <><ChevronDown size={13} />Ver más</>}
                </button>
              </div>

              {/* ── Expandido ─────────────────────────────────────── */}
              {expanded && (
                <div className="px-5 pb-5 space-y-4" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="pt-3" />

                  {/* Info remitente */}
                  {booking.sender_name && (
                    <div className="flex items-center justify-between p-3 rounded-xl"
                         style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}>
                      <div className="flex items-center gap-3">
                        {booking.sender_image ? (
                          <img src={booking.sender_image} alt={booking.sender_name}
                               className="w-10 h-10 rounded-full object-cover" style={{ border: "2px solid rgba(255,255,255,0.18)" }} />
                        ) : (
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                               style={{ background: "linear-gradient(135deg,#001C55,#B744B8)" }}>
                            {booking.sender_name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="text-xs" style={{ color: "rgba(255,255,255,0.38)" }}>Propuesta de:</p>
                          <p className="font-semibold text-white text-sm">{booking.sender_name}</p>
                          <p className="text-xs" style={{ color: "rgba(255,255,255,0.38)" }}>
                            {booking.sender_role === "artist" ? "Artista / Emprendedor" : "Dueño de Local"}
                          </p>
                        </div>
                      </div>
                      <button onClick={() => router.push(`/profile/${otherUserId(booking)}`)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                        style={{ color: "#c084fc", border: "1px solid rgba(183,68,184,0.3)", background: "rgba(183,68,184,0.08)" }}>
                        Ver perfil
                      </button>
                    </div>
                  )}

                  {/* ━━━ EN NEGOCIACIÓN: panel de acciones ━━━━━━━━━━━━━ */}
                  {isNegotiating && (
                    <NegotiationPanel
                      booking={booking}
                      currentUserId={myId}
                      isArtist={isArtistInBooking}
                      onUpdate={(updatedBooking) => {
                        if (updatedBooking) {
                          setLocalOverrides(prev => ({ ...prev, [id]: updatedBooking }))
                        }
                        onUpdateStatus?.(id, updatedBooking?.status || booking.status)
                      }}
                    />
                  )}

                  {/* Cancelar: solo quien envió la propuesta inicial (cuando es su turno de espera) */}
                  {!isReceived && isNegotiating && (() => {
                    const lastActionBy = booking.last_action_by ? Number(booking.last_action_by) : null
                    const senderIsArtist = booking.sender_role === "artist"
                    const senderUserId = senderIsArtist ? Number(booking.artist_id) : Number(booking.owner_id)
                    // Solo mostrar cancelar si soy el que envió la propuesta inicial y ya actué (no tengo turno)
                    const iWasSender = myId === senderUserId
                    const myLastAction = lastActionBy === myId
                    const showCancel = iWasSender && (lastActionBy === null || myLastAction)
                    return showCancel ? (
                      <div className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                        <p className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.35)" }}>
                          Esperando respuesta del receptor.
                        </p>
                        <Button onClick={() => patchBooking(id, { status: "rejected" }, "Propuesta cancelada")}
                          disabled={loading} variant="outline" size="sm" className="w-full bg-transparent"
                          style={{ border: "1px solid rgba(239,68,68,0.28)", color: "#f87171" }}>
                          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <X className="h-3.5 w-3.5 mr-1.5" />}
                          Cancelar propuesta
                        </Button>
                      </div>
                    ) : null
                  })()}

                  {/* ━━━ MATCHED: acuerdo alcanzado, dueño paga ━━━━━━━ */}
                  {booking.status === "matched" && (
                    <div className="space-y-3">
                      <div className="p-4 rounded-xl"
                           style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.25)" }}>
                        <div className="flex items-start gap-2 mb-2">
                          <AlertCircle className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-blue-300 font-semibold text-sm">Acuerdo alcanzado — acción requerida</p>
                            <p className="text-xs mt-1" style={{ color: "rgba(147,197,253,0.65)" }}>
                              Se llegó a un acuerdo. Para confirmar la contratación y bloquear la fecha, el local debe abonar la tarifa de gestión de{" "}
                              <strong className="text-blue-300">$4.200</strong>.
                            </p>
                          </div>
                        </div>
                        <div className="pt-2 mt-1 text-xs flex items-center gap-1.5"
                             style={{ borderTop: "1px solid rgba(59,130,246,0.15)", color: "rgba(255,255,255,0.3)" }}>
                          <Lock className="h-3 w-3" />
                          Los datos de contacto se revelan una vez confirmada la contratación.
                        </div>
                      </div>

                      {/* Condiciones finales */}
                      <div className="p-3 rounded-xl space-y-1.5"
                           style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                        <p className="text-xs font-bold uppercase tracking-wider mb-2"
                           style={{ color: "rgba(255,255,255,0.35)" }}>✅ Condiciones acordadas</p>
                        {displayDate && (
                          <div className="flex justify-between text-xs">
                            <span style={{ color: "rgba(255,255,255,0.4)" }}>Fecha</span>
                            <span className="font-semibold text-white/70">{fmtDate(displayDate)}</span>
                          </div>
                        )}
                        {booking.event_time && (
                          <div className="flex justify-between text-xs">
                            <span style={{ color: "rgba(255,255,255,0.4)" }}>Horario</span>
                            <span className="font-semibold text-white/70">
                              {booking.event_time.substring(0, 5)} hs
                              {booking.event_time_end ? ` → ${booking.event_time_end.substring(0, 5)} hs` : ""}
                            </span>
                          </div>
                        )}
                        {(booking.proposed_price || booking.price) && (
                          <div className="flex justify-between text-xs">
                            <span style={{ color: "rgba(255,255,255,0.4)" }}>Precio acordado</span>
                            <span className="font-bold text-green-300">
                              ${Number(booking.proposed_price || booking.price).toLocaleString("es-AR")}
                            </span>
                          </div>
                        )}
                      </div>

                      {amIOwner ? (
                        <Button onClick={() => setPayingId(id)}
                          className="w-full h-12 font-bold border-0"
                          style={{ background: "linear-gradient(135deg,#B744B8,#7a1a8a)", boxShadow: "0 4px 20px rgba(183,68,184,0.35)" }}>
                          <CreditCard className="h-4 w-4 mr-2" />
                          Confirmar contratación y pagar $4.200
                        </Button>
                      ) : (
                        <div className="p-3 rounded-xl text-center"
                             style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                            Esperando que el local confirme y abone la tarifa de gestión.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ━━━ CONFIRMED ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                  {(booking.status === "confirmed" || booking.status === "accepted") && (
                    <div className="space-y-3">
                      <div className="p-4 rounded-xl"
                           style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)" }}>
                        <div className="flex items-center gap-2 mb-1">
                          <ShieldCheck className="h-4 w-4 text-green-400" />
                          <p className="text-green-300 font-semibold text-sm">Contratación confirmada y pagada</p>
                        </div>
                        <p className="text-xs" style={{ color: "rgba(134,239,172,0.65)" }}>
                          La fecha está bloqueada. El chat y los datos de contacto están completamente habilitados.
                        </p>
                        {booking.payment_method && (
                          <p className="text-xs mt-1.5" style={{ color: "rgba(134,239,172,0.5)" }}>
                            {booking.payment_method} · Ref: {booking.payment_reference}
                          </p>
                        )}
                      </div>
                      <Button onClick={() => router.push(`/messaging?userId=${otherUserId(booking)}`)}
                        className="w-full h-11 font-bold border-0"
                        style={{ background: "linear-gradient(135deg,#001C55,#B744B8)" }}>
                        <MessageSquare className="h-4 w-4 mr-2" />Abrir chat completo
                      </Button>
                      <Button onClick={() => patchBooking(id, { status: "completed" }, "Evento marcado como realizado ✓")}
                        disabled={loading} variant="outline" className="w-full bg-transparent text-sm"
                        style={{ border: "1px solid rgba(168,85,247,0.35)", color: "#c084fc" }}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trophy className="h-4 w-4 mr-2" />}
                        Marcar como evento realizado
                      </Button>
                    </div>
                  )}

                  {/* ━━━ COMPLETED ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                  {booking.status === "completed" && (
                    <div className="p-4 rounded-xl"
                         style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.25)" }}>
                      <div className="flex items-center gap-2 mb-1">
                        <Trophy className="h-4 w-4 text-purple-400" />
                        <p className="text-purple-300 font-semibold text-sm">Evento realizado</p>
                      </div>
                      <p className="text-xs mb-3" style={{ color: "rgba(216,180,254,0.6)" }}>
                        ¡El evento fue completado! Podés dejar tu calificación.
                      </p>
                      <div className="flex gap-2">
                        <Button onClick={() => router.push(`/messaging?userId=${otherUserId(booking)}`)}
                          variant="outline" size="sm" className="flex-1 bg-transparent"
                          style={{ border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.6)" }}>
                          <MessageSquare className="h-3.5 w-3.5 mr-1.5" />Chat
                        </Button>
                        <Button onClick={() => router.push(`/profile/${otherUserId(booking)}`)} size="sm"
                          className="flex-1 border-0" style={{ background: "linear-gradient(135deg,#B744B8,#7a1a8a)" }}>
                          <Star className="h-3.5 w-3.5 mr-1.5" />Calificar
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* ━━━ REJECTED ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                  {booking.status === "rejected" && (
                    <div className="p-3 rounded-xl"
                         style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.22)" }}>
                      <div className="flex items-center gap-2" style={{ color: "#f87171" }}>
                        <X className="h-4 w-4" /><span className="font-semibold text-sm">Propuesta rechazada</span>
                      </div>
                      <p className="text-xs mt-1" style={{ color: "rgba(252,165,165,0.5)" }}>
                        Esta propuesta no pudo concretarse.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}
