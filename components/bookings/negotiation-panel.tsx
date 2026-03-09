"use client"

import { useState, useEffect, useRef } from "react"
import { Check, X, Pencil, DollarSign, Calendar, Clock, Loader2, ChevronDown, ChevronUp, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface NegotiationPanelProps {
  booking: any
  currentUserId: number
  isArtist: boolean
  onUpdate: (updatedBooking?: any) => void
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(d: string) {
  if (!d) return "—"
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
    const [y, m, day] = d.split("-").map(Number)
    return new Date(y, m - 1, day).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })
  }
  return new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })
}
function fmtTime(t: string) { return t ? t.substring(0, 5) + " hs" : "—" }

// ── Historial colapsable ──────────────────────────────────────────────────────
const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  initial_proposal: { label: "Propuesta inicial",   color: "text-blue-300" },
  counter:          { label: "Nueva propuesta",      color: "text-yellow-300" },
  accept:           { label: "Aceptó la propuesta",  color: "text-green-400" },
  reject:           { label: "Rechazó la propuesta", color: "text-red-400" },
}

function History({ bookingId }: { bookingId: string | number }) {
  const [open, setOpen] = useState(false)
  const { data: rows = [] } = useSWR(`/api/negotiations?bookingId=${bookingId}`, fetcher, { refreshInterval: 4000 })
  if (!rows.length) return null
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold"
        style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.45)" }}>
        <span className="flex items-center gap-2"><FileText className="h-3.5 w-3.5" />Historial ({rows.length})</span>
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>
      {open && (
        <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          {rows.map((item: any) => {
            const cfg = ACTION_LABELS[item.action_type] ?? ACTION_LABELS.initial_proposal
            return (
              <div key={item.id} className="px-4 py-2.5" style={{ background: "rgba(255,255,255,0.02)" }}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${cfg.color}`}>{cfg.label}</span>
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
                    {new Date(item.created_at).toLocaleDateString("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{item.user_name}</p>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {item.price && (
                    <span className="text-xs px-2 py-0.5 rounded-md font-semibold text-green-300"
                          style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.18)" }}>
                      ${Number(item.price).toLocaleString("es-AR")}
                    </span>
                  )}
                  {item.new_date && (
                    <span className="text-xs px-2 py-0.5 rounded-md font-semibold text-blue-300"
                          style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.18)" }}>
                      {fmtDate(item.new_date)}
                      {item.new_time ? ` · ${fmtTime(item.new_time)}` : ""}
                      {item.new_time_end ? ` → ${fmtTime(item.new_time_end)}` : ""}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Formulario de edición ────────────────────────────────────────────────────
interface EditFormProps {
  date: string
  timeStart: string
  timeEnd: string
  price: string
  onDateChange: (v: string) => void
  onTimeStartChange: (v: string) => void
  onTimeEndChange: (v: string) => void
  onPriceChange: (v: string) => void
  onSend: () => void
  onCancel: () => void
  loading: boolean
  error: string
}

function EditForm({
  date, timeStart, timeEnd, price,
  onDateChange, onTimeStartChange, onTimeEndChange, onPriceChange,
  onSend, onCancel, loading, error,
}: EditFormProps) {
  const inputStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.13)",
    borderRadius: "10px",
    color: "#fff",
    padding: "9px 12px",
    fontSize: "14px",
    width: "100%",
    outline: "none",
  }
  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "11px",
    fontWeight: 700,
    color: "rgba(255,255,255,0.4)",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginBottom: "5px",
  }

  return (
    <div className="rounded-2xl p-4 space-y-3"
         style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>
        ✏️ Editar propuesta
      </p>

      <div>
        <label style={labelStyle}><Calendar className="inline h-3 w-3 mr-1" />Fecha</label>
        <input type="date" value={date} onChange={(e) => onDateChange(e.target.value)}
          min={new Date().toISOString().split("T")[0]} style={inputStyle} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label style={labelStyle}><Clock className="inline h-3 w-3 mr-1" />Inicio</label>
          <input type="time" value={timeStart} onChange={(e) => onTimeStartChange(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}><Clock className="inline h-3 w-3 mr-1" />Cierre</label>
          <input type="time" value={timeEnd} onChange={(e) => onTimeEndChange(e.target.value)} style={inputStyle} />
        </div>
      </div>

      <div>
        <label style={labelStyle}><DollarSign className="inline h-3 w-3 mr-1" />Precio</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-400 font-bold text-sm">$</span>
          <input type="number" value={price} onChange={(e) => onPriceChange(e.target.value)}
            min="0" placeholder="0"
            style={{ ...inputStyle, paddingLeft: "28px" }} />
        </div>
      </div>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button onClick={onCancel} disabled={loading}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{ border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.5)", background: "transparent" }}>
          Cancelar
        </button>
        <Button onClick={onSend} disabled={loading}
          className="flex-1 h-10 font-bold border-0"
          style={{ background: "linear-gradient(135deg,#B744B8,#7a1a8a)" }}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
          Enviar nueva propuesta
        </Button>
      </div>
    </div>
  )
}

// ── Panel principal ───────────────────────────────────────────────────────────
export function NegotiationPanel({ booking: propBooking, currentUserId, isArtist, onUpdate }: NegotiationPanelProps) {
  // Estado local del booking — se inicializa con el prop y se actualiza
  // inmediatamente cuando el servidor confirma cambios (sin esperar poll SWR)
  const [booking, setBooking] = useState<any>(propBooking)

  // Sincronizar con actualizaciones del padre (por ejemplo cuando SWR refresca)
  // Solo actualizar si el padre trae datos MÁS NUEVOS que los locales
  useEffect(() => {
    const propTime = new Date(propBooking.updated_at || 0).getTime()
    const localTime = new Date(booking.updated_at || 0).getTime()
    if (propTime >= localTime) {
      setBooking(propBooking)
    }
  }, [propBooking])

  // Estados del formulario de edición — viven en el panel padre para poder
  // inicializarlos/resetearlos con los valores actuales del booking
  const [editing, setEditing]       = useState(false)
  const [editDate, setEditDate]     = useState("")
  const [editStart, setEditStart]   = useState("")
  const [editEnd, setEditEnd]       = useState("")
  const [editPrice, setEditPrice]   = useState("")
  const [editErr, setEditErr]       = useState("")

  // Protección anti-doble-envío con ref (no causa re-render)
  const submitting = useRef(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const canNegotiate = ["pending", "negotiating"].includes(booking.status)

  // ── Turno ─────────────────────────────────────────────────────────────────
  const lastActionBy   = booking.last_action_by ? Number(booking.last_action_by) : null
  const senderIsArtist = booking.sender_role === "artist"
  const senderIsUser   = booking.sender_role === "user"
  // Para usuario común: el sender es externo, el turno lo maneja el receptor (artista o dueño)
  const senderUserId   = senderIsArtist ? Number(booking.artist_id) : senderIsUser ? Number(booking.owner_id || booking.artist_id) : Number(booking.owner_id)

  const isMyTurn = lastActionBy !== null
    ? lastActionBy !== currentUserId          // Si alguien actuó, le toca al otro
    : currentUserId !== senderUserId          // Propuesta inicial: le toca al receptor

  // ── Abrir formulario con valores actuales ─────────────────────────────────
  const openEdit = () => {
    setEditDate(booking.booking_date?.substring(0, 10) ?? "")
    setEditStart(booking.event_time?.substring(0, 5) ?? "")
    setEditEnd(booking.event_time_end?.substring(0, 5) ?? "")
    setEditPrice(
      booking.proposed_price
        ? String(Math.round(Number(booking.proposed_price)))
        : booking.price ? String(Math.round(Number(booking.price))) : ""
    )
    setEditErr("")
    setEditing(true)
  }

  const closeEdit = () => {
    setEditing(false)
    setEditErr("")
  }

  // ── Enviar acción al servidor ─────────────────────────────────────────────
  const post = async (payload: Record<string, any>) => {
    if (submitting.current) return   // prevenir doble envío
    submitting.current = true
    setLoading(true)
    try {
      const res = await fetch("/api/negotiations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking.id, userId: currentUserId, ...payload }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error")

      // Actualizar el booking local INMEDIATAMENTE con los datos frescos del servidor
      if (data.booking) {
        setBooking(data.booking)
      }

      setEditing(false)
      onUpdate(data.booking)

      const titles: Record<string, string> = {
        accept:  "✓ Propuesta aceptada — ¡Acuerdo alcanzado!",
        reject:  "Propuesta rechazada",
        counter: "✓ Nueva propuesta enviada",
      }
      toast({ title: titles[payload.actionType] ?? "Acción completada" })
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" })
    } finally {
      setLoading(false)
      submitting.current = false
    }
  }

  const handleSendEdit = () => {
    if (!editDate || !editStart || !editEnd) { setEditErr("Completá fecha y horarios"); return }
    if (editEnd <= editStart) { setEditErr("El cierre debe ser después del inicio"); return }
    post({
      actionType: "counter",
      newDate:    editDate,
      newTime:    editStart,
      newTimeEnd: editEnd,
      price:      editPrice ? Number(editPrice) : null,
    })
  }

  if (!canNegotiate) return null

  return (
    <div className="space-y-3">

      {/* ── Propuesta vigente ─────────────────────────────────────────── */}
      <div className="rounded-2xl p-4"
           style={{ background: "linear-gradient(135deg,rgba(183,68,184,0.08),rgba(0,28,85,0.15))", border: "1px solid rgba(183,68,184,0.22)" }}>
        <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "rgba(216,180,254,0.65)" }}>
          📋 Propuesta vigente
        </p>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
              <Calendar className="h-3.5 w-3.5" /> Fecha
            </span>
            <span className="text-sm font-bold text-white">{fmtDate(booking.booking_date)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
              <Clock className="h-3.5 w-3.5" /> Horario
            </span>
            <span className="text-sm font-bold text-white">
              {fmtTime(booking.event_time)}
              {booking.event_time_end ? ` → ${fmtTime(booking.event_time_end)}` : ""}
            </span>
          </div>
          {(booking.proposed_price || booking.price) && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
                <DollarSign className="h-3.5 w-3.5" /> Precio
              </span>
              <span className="text-sm font-bold text-green-300">
                ${Number(booking.proposed_price || booking.price).toLocaleString("es-AR")}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Acciones: formulario o botones según turno ────────────────── */}
      {isMyTurn ? (
        editing ? (
          <EditForm
            date={editDate}
            timeStart={editStart}
            timeEnd={editEnd}
            price={editPrice}
            onDateChange={setEditDate}
            onTimeStartChange={setEditStart}
            onTimeEndChange={setEditEnd}
            onPriceChange={setEditPrice}
            onSend={handleSendEdit}
            onCancel={closeEdit}
            loading={loading}
            error={editErr}
          />
        ) : (
          <div className="space-y-2">
            <Button
              onClick={() => post({ actionType: "accept" })}
              disabled={loading}
              className="w-full h-11 font-bold border-0"
              style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)" }}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
              Aceptar propuesta
            </Button>
            <Button
              onClick={openEdit}
              disabled={loading}
              variant="outline"
              className="w-full h-11 font-semibold bg-transparent"
              style={{ border: "1px solid rgba(183,68,184,0.35)", color: "#c084fc" }}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Editar y enviar nueva propuesta
            </Button>
            <Button
              onClick={() => post({ actionType: "reject" })}
              disabled={loading}
              variant="outline"
              className="w-full h-9 bg-transparent text-xs font-semibold"
              style={{ border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <X className="h-3.5 w-3.5 mr-1.5" />}
              Rechazar solicitud
            </Button>
          </div>
        )
      ) : (
        <div className="rounded-xl px-4 py-3 flex items-center gap-3"
             style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <Loader2 className="h-4 w-4 text-purple-400/60 animate-spin flex-shrink-0" />
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            Propuesta enviada. Esperando respuesta del otro usuario…
          </p>
        </div>
      )}

      {/* ── Historial ─────────────────────────────────────────────────── */}
      <History bookingId={booking.id} />
    </div>
  )
}
