"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Check, X, MessageSquare, Calendar, User, Loader2,
  Clock, AlertCircle, CreditCard, Star, Trophy,
  ChevronDown, ChevronUp, Lock, Unlock, ShieldCheck,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { getCurrentUser } from "@/lib/auth"
import { PaymentModal } from "./payment-modal"

// ── Tipos ────────────────────────────────────────────────────────────────────
interface Booking {
  id: string | number
  artist_id?: number
  owner_id?: number
  title?: string
  booking_date?: string
  date?: string
  status: string
  description?: string
  message?: string
  price?: number
  sender_name?: string
  sender_image?: string
  sender_role?: string
  commission_paid?: boolean | number
  confirmed_at?: string
  payment_method?: string
  payment_reference?: string
  artist_name?: string
  owner_name?: string
}

interface BookingListProps {
  bookings: Booking[]
  isReceived?: boolean
  onUpdateStatus?: (bookingId: string, status: string) => void
}

// ── Config de estados ────────────────────────────────────────────────────────
const STATUS: Record<string, { label: string; pill: string; icon: React.ReactNode }> = {
  pending: {
    label: "Pendiente",
    pill: "text-yellow-300 bg-yellow-500/20 border-yellow-500/40",
    icon: <Clock className="h-3 w-3" />,
  },
  matched: {
    label: "Pendiente de confirmación",
    pill: "text-blue-300 bg-blue-500/20 border-blue-500/40",
    icon: <AlertCircle className="h-3 w-3" />,
  },
  confirmed: {
    label: "Contratación confirmada",
    pill: "text-green-300 bg-green-500/20 border-green-500/40",
    icon: <Unlock className="h-3 w-3" />,
  },
  accepted: {
    label: "Contratación confirmada",
    pill: "text-green-300 bg-green-500/20 border-green-500/40",
    icon: <Check className="h-3 w-3" />,
  },
  rejected: {
    label: "Rechazada",
    pill: "text-red-300 bg-red-500/20 border-red-500/40",
    icon: <X className="h-3 w-3" />,
  },
  completed: {
    label: "Evento realizado",
    pill: "text-purple-300 bg-purple-500/20 border-purple-500/40",
    icon: <Trophy className="h-3 w-3" />,
  },
  cancelled: {
    label: "Cancelada",
    pill: "text-white/50 bg-white/10 border-white/20",
    icon: <X className="h-3 w-3" />,
  },
}

// ── Componente ────────────────────────────────────────────────────────────────
export function BookingList({ bookings, isReceived = false, onUpdateStatus }: BookingListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [loadingId, setLoadingId]   = useState<string | null>(null)
  const [payingId, setPayingId]     = useState<string | null>(null)
  const router    = useRouter()
  const { toast } = useToast()
  const me       = getCurrentUser()
  const amIOwner = me?.role === "owner"

  const otherUserId = (b: Booking) => {
    if (isReceived) return b.sender_role === "artist" ? b.artist_id : b.owner_id
    else            return b.sender_role === "artist" ? b.owner_id  : b.artist_id
  }

  const goChat    = (b: Booking) => router.push(`/messaging?userId=${otherUserId(b)}`)
  const goProfile = (b: Booking) => router.push(`/profile/${otherUserId(b)}`)

  const patchBooking = async (id: string, payload: object, successMsg: string) => {
    setLoadingId(id)
    try {
      const res  = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al actualizar")
      if (onUpdateStatus) await onUpdateStatus(id, data.status || "")
      toast({ title: successMsg })
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" })
    } finally {
      setLoadingId(null)
    }
  }

  const handleAccept    = (id: string) =>
    patchBooking(id, { status: "matched" },
      "Propuesta aceptada — el local debe confirmar y pagar para finalizar")
  const handleReject    = (id: string) =>
    patchBooking(id, { status: "rejected" }, "Propuesta rechazada")
  const handleComplete  = (id: string) =>
    patchBooking(id, { status: "completed" }, "Evento marcado como realizado ✓")

  // ── Render ─────────────────────────────────────────────────────────────────
  if (bookings.length === 0) {
    return (
      <div className="text-center py-14 rounded-2xl"
           style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
        <Calendar className="w-9 h-9 mx-auto mb-3" style={{ color: "rgba(255,255,255,0.2)" }} />
        <p style={{ color: "rgba(255,255,255,0.4)" }} className="text-sm">
          {isReceived ? "Todavía no recibiste propuestas" : "Todavía no enviaste propuestas"}
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Modal de pago */}
      {payingId && (() => {
        const b = bookings.find(x => x.id.toString() === payingId)!
        return (
          <PaymentModal
            bookingId={payingId}
            bookingTitle={b.title || "Contratación"}
            artistName={b.artist_name || b.sender_name || "Artista"}
            bookingDate={b.booking_date || b.date}
            onSuccess={() => onUpdateStatus?.(payingId, "confirmed")}
            onClose={() => setPayingId(null)}
          />
        )
      })()}

      <div className="space-y-3">
        {bookings.map((booking) => {
          const id       = booking.id.toString()
          const expanded = expandedId === id
          const loading  = loadingId  === id
          const cfg      = STATUS[booking.status] ?? STATUS.pending
          const displayDate = booking.booking_date || booking.date

          return (
            <div key={id} className="rounded-2xl overflow-hidden transition-all duration-200"
                 style={{
                   background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)",
                   backdropFilter: "blur(12px)",
                   border: "1px solid rgba(255,255,255,0.12)",
                   boxShadow: "0 4px 24px rgba(0,0,0,0.25)",
                 }}>

              {/* ── Cabecera ─────────────────────────────────────────── */}
              <div className="flex items-start justify-between gap-4 p-5">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h4 className="font-bold text-white truncate">{booking.title || "Sin título"}</h4>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${cfg.pill}`}>
                      {cfg.icon}
                      {cfg.label}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
                    {displayDate && (
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(displayDate).toLocaleDateString("es-AR",
                          { day: "2-digit", month: "long", year: "numeric" })}
                      </span>
                    )}
                    {booking.sender_name && (
                      <span className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5" />
                        {booking.sender_name}
                      </span>
                    )}
                    {booking.payment_reference && (
                      <span className="flex items-center gap-1.5 text-green-400/70">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        {booking.payment_reference}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setExpandedId(expanded ? null : id)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all flex-shrink-0"
                  style={{
                    color: "rgba(255,255,255,0.6)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.05)",
                  }}>
                  {expanded ? <><ChevronUp size={13}/>Menos</> : <><ChevronDown size={13}/>Ver más</>}
                </button>
              </div>

              {/* ── Panel expandido ───────────────────────────────────── */}
              {expanded && (
                <div className="px-5 pb-5 space-y-4"
                     style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="pt-4" />

                  {/* Info remitente */}
                  {booking.sender_name && (
                    <div className="flex items-center justify-between p-3 rounded-xl"
                         style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                      <div className="flex items-center gap-3">
                        {booking.sender_image ? (
                          <img src={booking.sender_image} alt={booking.sender_name}
                            className="w-10 h-10 rounded-full object-cover" style={{ border: "2px solid rgba(255,255,255,0.2)" }} />
                        ) : (
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                            style={{ background: "linear-gradient(135deg,#001C55,#B744B8)" }}>
                            {booking.sender_name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Propuesta de:</p>
                          <p className="font-semibold text-white text-sm">{booking.sender_name}</p>
                          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                            {booking.sender_role === "artist" ? "Artista / Emprendedor" : "Dueño de Local"}
                          </p>
                        </div>
                      </div>
                      <button onClick={() => goProfile(booking)}
                        className="text-xs font-semibold transition-all px-3 py-1.5 rounded-lg"
                        style={{ color: "#c084fc", border: "1px solid rgba(183,68,184,0.3)", background: "rgba(183,68,184,0.1)" }}>
                        Ver perfil
                      </button>
                    </div>
                  )}

                  {/* Mensaje */}
                  {booking.message && (
                    <div className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>Mensaje</p>
                      <p className="text-sm italic" style={{ color: "rgba(255,255,255,0.7)" }}>"{booking.message}"</p>
                    </div>
                  )}

                  {/* ━━━ PENDING: receptor acepta o rechaza ━━━━━━━━━━━━━━━━━ */}
                  {isReceived && booking.status === "pending" && (
                    <div className="space-y-3">
                      <div className="p-4 rounded-xl" style={{ background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.25)" }}>
                        <p className="font-semibold text-yellow-300 text-sm mb-1">Propuesta recibida</p>
                        <p className="text-xs" style={{ color: "rgba(253,224,71,0.65)" }}>
                          Si aceptás, el local deberá abonar la tarifa de gestión (USD 3) para confirmar definitivamente.
                          Los datos de contacto se revelan una vez confirmado.
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => handleAccept(id)} disabled={loading}
                          className="flex-1 h-11 font-bold border-0"
                          style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)" }}>
                          {loading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Check className="h-4 w-4 mr-1.5"/>}
                          Aceptar propuesta
                        </Button>
                        <Button onClick={() => handleReject(id)} disabled={loading} variant="outline"
                          className="flex-1 h-11 font-bold bg-transparent"
                          style={{ border: "1px solid rgba(239,68,68,0.4)", color: "#f87171" }}>
                          {loading ? <Loader2 className="h-4 w-4 animate-spin"/> : <X className="h-4 w-4 mr-1.5"/>}
                          Rechazar
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Cancelar propia propuesta pendiente */}
                  {!isReceived && booking.status === "pending" && (
                    <div className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <p className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>
                        Esperando respuesta del receptor.
                      </p>
                      <Button onClick={() => handleReject(id)} disabled={loading} variant="outline" size="sm"
                        className="w-full bg-transparent"
                        style={{ border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}>
                        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1"/> : <X className="h-3.5 w-3.5 mr-1.5"/>}
                        Cancelar propuesta
                      </Button>
                    </div>
                  )}

                  {/* ━━━ MATCHED: el local paga ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                  {booking.status === "matched" && (
                    <div className="space-y-3">
                      <div className="p-4 rounded-xl" style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.25)" }}>
                        <div className="flex items-start gap-2 mb-2">
                          <AlertCircle className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5"/>
                          <div>
                            <p className="text-blue-300 font-semibold text-sm">Propuesta aceptada — acción requerida</p>
                            <p className="text-xs mt-1" style={{ color: "rgba(147,197,253,0.65)" }}>
                              Para confirmar la contratación y bloquear definitivamente la fecha, el Local debe abonar
                              la tarifa de gestión de <strong className="text-blue-300">USD 3</strong>.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs mt-2 pt-2"
                             style={{ borderTop: "1px solid rgba(59,130,246,0.15)", color: "rgba(255,255,255,0.35)" }}>
                          <Lock className="h-3 w-3"/>
                          Los datos de contacto se revelan una vez confirmada la contratación.
                        </div>
                      </div>

                      {amIOwner ? (
                        <Button onClick={() => setPayingId(id)}
                          className="w-full h-12 font-bold border-0"
                          style={{ background: "linear-gradient(135deg,#B744B8,#7a1a8a)", boxShadow: "0 4px 20px rgba(183,68,184,0.35)" }}>
                          <CreditCard className="h-4 w-4 mr-2"/>
                          Confirmar contratación y pagar USD 3
                        </Button>
                      ) : (
                        <div className="p-3 rounded-xl text-center"
                             style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                            Esperando que el local confirme y abone la tarifa de gestión.
                          </p>
                        </div>
                      )}

                      {/* Chat limitado */}
                      <div className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <Lock className="h-3.5 w-3.5" style={{ color: "rgba(255,255,255,0.3)" }}/>
                          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.35)" }}>Chat limitado</p>
                        </div>
                        <p className="text-xs mb-2.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                          Los datos de contacto se habilitan una vez confirmada la contratación.
                        </p>
                        <Button onClick={() => goChat(booking)} variant="outline" size="sm"
                          className="w-full bg-transparent"
                          style={{ border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.6)" }}>
                          <MessageSquare className="h-3.5 w-3.5 mr-1.5"/>
                          Abrir chat (limitado)
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* ━━━ CONFIRMED: chat completo ━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                  {(booking.status === "confirmed" || booking.status === "accepted") && (
                    <div className="space-y-3">
                      <div className="p-4 rounded-xl" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)" }}>
                        <div className="flex items-center gap-2 mb-1">
                          <ShieldCheck className="h-4 w-4 text-green-400"/>
                          <p className="text-green-300 font-semibold text-sm">Contratación confirmada y pagada</p>
                        </div>
                        <p className="text-xs" style={{ color: "rgba(134,239,172,0.65)" }}>
                          La fecha está bloqueada. El chat y los datos de contacto están completamente habilitados.
                        </p>
                        {booking.payment_method && (
                          <p className="text-xs mt-1.5" style={{ color: "rgba(134,239,172,0.5)" }}>
                            Método: {booking.payment_method} · Ref: {booking.payment_reference}
                          </p>
                        )}
                      </div>
                      <Button onClick={() => goChat(booking)}
                        className="w-full h-11 font-bold border-0"
                        style={{ background: "linear-gradient(135deg,#001C55,#B744B8)" }}>
                        <MessageSquare className="h-4 w-4 mr-2"/>
                        Abrir chat completo
                      </Button>
                      <Button onClick={() => handleComplete(id)} disabled={loading} variant="outline"
                        className="w-full bg-transparent text-sm"
                        style={{ border: "1px solid rgba(168,85,247,0.35)", color: "#c084fc" }}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Trophy className="h-4 w-4 mr-2"/>}
                        Marcar como evento realizado
                      </Button>
                    </div>
                  )}

                  {/* ━━━ COMPLETED ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                  {booking.status === "completed" && (
                    <div className="p-4 rounded-xl" style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.25)" }}>
                      <div className="flex items-center gap-2 mb-1">
                        <Trophy className="h-4 w-4 text-purple-400"/>
                        <p className="text-purple-300 font-semibold text-sm">Evento realizado</p>
                      </div>
                      <p className="text-xs mb-3" style={{ color: "rgba(216,180,254,0.6)" }}>
                        ¡El evento fue completado con éxito! Podés dejar tu calificación.
                      </p>
                      <div className="flex gap-2">
                        <Button onClick={() => goChat(booking)} variant="outline" size="sm"
                          className="flex-1 bg-transparent"
                          style={{ border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.6)" }}>
                          <MessageSquare className="h-3.5 w-3.5 mr-1.5"/>Chat
                        </Button>
                        <Button onClick={() => goProfile(booking)} size="sm"
                          className="flex-1 border-0"
                          style={{ background: "linear-gradient(135deg,#B744B8,#7a1a8a)" }}>
                          <Star className="h-3.5 w-3.5 mr-1.5"/>
                          Calificar
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* ━━━ REJECTED ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                  {booking.status === "rejected" && (
                    <div className="p-3 rounded-xl" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }}>
                      <div className="flex items-center gap-2" style={{ color: "#f87171" }}>
                        <X className="h-4 w-4"/>
                        <span className="font-semibold text-sm">Propuesta rechazada</span>
                      </div>
                      <p className="text-xs mt-1" style={{ color: "rgba(252,165,165,0.55)" }}>
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
