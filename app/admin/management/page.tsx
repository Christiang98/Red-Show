"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import { getCurrentUser } from "@/lib/auth"
import {
  Shield, Users, AlertCircle, HelpCircle, CheckCircle, Calendar,
  ArrowLeft, Star, Eye, EyeOff, Clock, DollarSign, MessageSquare,
  UserX, AlertTriangle, ExternalLink, Music, Building2, Camera,
  Mic, Briefcase, X, ChevronRight, Ban, Send, TicketX, CheckCircle2,
  UserCheck, Mail, Phone, MapPin, Hash, TrendingUp, Activity,
  FileText, Zap, RefreshCw,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// ─── Constantes ────────────────────────────────────────────────────────────────

const BOOKING_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: "Pendiente",  color: "text-yellow-400", bg: "bg-yellow-500/15 border-yellow-500/30" },
  matched:   { label: "Pendiente",  color: "text-yellow-400", bg: "bg-yellow-500/15 border-yellow-500/30" },
  accepted:  { label: "Aceptada",   color: "text-green-400",  bg: "bg-green-500/15 border-green-500/30"  },
  confirmed: { label: "Confirmada", color: "text-green-400",  bg: "bg-green-500/15 border-green-500/30"  },
  rejected:  { label: "Rechazada",  color: "text-red-400",    bg: "bg-red-500/15 border-red-500/30"      },
  cancelled: { label: "Cancelada",  color: "text-red-400",    bg: "bg-red-500/15 border-red-500/30"      },
  completed: { label: "Finalizada", color: "text-blue-400",   bg: "bg-blue-500/15 border-blue-500/30"    },
}

const ROLE_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  artist: { label: "Artista",       color: "bg-purple-500/20 text-purple-300 border-purple-500/40", icon: Music },
  owner:  { label: "Dueño de Local",color: "bg-blue-500/20 text-blue-300 border-blue-500/40",       icon: Building2 },
  admin:  { label: "Administrador", color: "bg-rose-500/20 text-rose-300 border-rose-500/40",        icon: Shield },
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(d?: string | null) {
  if (!d) return "—"
  try {
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
      const [year, month, day] = d.split("-").map(Number)
      return new Date(year, month - 1, day).toLocaleDateString("es-AR", {
        day: "2-digit", month: "long", year: "numeric",
      })
    }
    return new Date(d).toLocaleDateString("es-AR", {
      day: "2-digit", month: "long", year: "numeric",
    })
  } catch { return d }
}

function fmtDateTime(d?: string | null) {
  if (!d) return "—"
  try { return new Date(d).toLocaleString("es-AR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) }
  catch { return d }
}

function UserAvatar({ name, size = "md", active = true, role }: { name: string; size?: "sm" | "md" | "lg"; active?: boolean; role?: string }) {
  const sz = size === "lg" ? "w-14 h-14 text-lg" : size === "sm" ? "w-7 h-7 text-xs" : "w-10 h-10 text-sm"
  const bg = !active
    ? "rgba(80,80,80,0.5)"
    : role === "artist"
      ? "linear-gradient(135deg,#7c3aed,#a855f7)"
      : role === "owner"
        ? "linear-gradient(135deg,#1d4ed8,#3b82f6)"
        : "linear-gradient(135deg,#001C55,#B744B8)"
  return (
    <div className={`${sz} rounded-full flex items-center justify-center text-white font-bold shrink-0`}
         style={{ background: bg }}>
      {name?.charAt(0)?.toUpperCase() || "?"}
    </div>
  )
}

function Stars({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const cls = size === "md" ? "h-4 w-4" : "h-3 w-3"
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} className={`${cls} ${i <= rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-700 text-gray-700"}`} />
      ))}
      {size === "md" && <span className="ml-1 font-bold text-foreground text-sm">{rating}/5</span>}
    </div>
  )
}

function RoleBadge({ role }: { role?: string }) {
  const cfg = ROLE_CONFIG[role || ""] || { label: role || "—", color: "bg-muted text-muted-foreground border-border", icon: Users }
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.color}`}>
      <Icon className="h-3 w-3" />{cfg.label}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    open: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    in_progress: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    under_review: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    resolved: "bg-green-500/15 text-green-400 border-green-500/30",
    dismissed: "bg-gray-500/15 text-gray-400 border-gray-500/30",
    closed: "bg-gray-500/15 text-gray-400 border-gray-500/30",
  }
  const labels: Record<string, string> = {
    pending: "Pendiente", open: "Abierto", in_progress: "En progreso",
    under_review: "Revisando", resolved: "Resuelto", dismissed: "Descartado", closed: "Cerrado",
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${map[status] || "bg-muted text-muted-foreground border-border"}`}>
      {labels[status] || status}
    </span>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium text-foreground truncate">{value}</span>
    </div>
  )
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ msg, type }: { msg: string; type: "ok" | "err" }) {
  return (
    <div className={`fixed top-5 right-5 z-[9999] flex items-center gap-2 px-5 py-3 rounded-xl text-white text-sm font-semibold shadow-2xl animate-in slide-in-from-right-5 ${type === "ok" ? "bg-green-600" : "bg-red-600"}`}>
      {type === "ok" ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
      {msg}
    </div>
  )
}

// ─── Modal: Sanción ────────────────────────────────────────────────────────────

function SanctionModal({
  user, onClose, onConfirm,
}: { user: any; onClose: () => void; onConfirm: (reason: string, days: number) => void }) {
  const [reason, setReason] = useState("")
  const [days, setDays] = useState(7)
  const endDate = new Date()
  endDate.setDate(endDate.getDate() + days)

  return (
    <Dialog open onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-500">
            <Ban className="h-5 w-5" />Aplicar Sanción
          </DialogTitle>
          <DialogDescription>
            Sancionarás a <strong>{user.first_name} {user.last_name}</strong>. Su perfil será desactivado durante el período indicado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Motivo de la sanción *</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Describe el motivo de la sanción..."
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Duración (días)</label>
            <div className="flex items-center gap-3">
              <input
                type="range" min={1} max={365} value={days}
                onChange={e => setDays(Number(e.target.value))}
                className="flex-1 accent-orange-500"
              />
              <span className="w-16 text-center font-bold text-orange-400 text-lg">{days}d</span>
            </div>
            <div className="flex gap-2 mt-2 flex-wrap">
              {[3, 7, 14, 30, 90].map(d => (
                <button key={d} onClick={() => setDays(d)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${days === d ? "bg-orange-500 text-white border-orange-500" : "border-border text-muted-foreground hover:border-orange-400"}`}>
                  {d}d
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-lg p-3 bg-orange-500/10 border border-orange-500/20 text-sm">
            <p className="text-orange-400 font-medium">📅 Finaliza el: {endDate.toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })}</p>
            <p className="text-muted-foreground mt-0.5 text-xs">Se notificará al usuario con el motivo y duración.</p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
            disabled={!reason.trim()}
            onClick={() => onConfirm(reason.trim(), days)}
          >
            <Ban className="h-4 w-4 mr-2" />Aplicar Sanción
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Modal: Mensaje a usuario ──────────────────────────────────────────────────

function MessageModal({
  userName, onClose, onSend,
}: { userName: string; onClose: () => void; onSend: (msg: string) => void }) {
  const [msg, setMsg] = useState("")
  return (
    <Dialog open onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />Enviar mensaje a {userName}
          </DialogTitle>
          <DialogDescription>El usuario recibirá este mensaje en su bandeja de entrada.</DialogDescription>
        </DialogHeader>
        <textarea
          value={msg}
          onChange={e => setMsg(e.target.value)}
          placeholder="Escribe tu mensaje aquí..."
          rows={4}
          className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button className="flex-1" disabled={!msg.trim()} onClick={() => onSend(msg.trim())}>
            <Send className="h-4 w-4 mr-2" />Enviar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Modal "Ver más" del usuario ───────────────────────────────────────────────

function UserModal({
  usr, reviews, onClose, onAction, router,
}: {
  usr: any
  reviews: any[]
  onClose: () => void
  onAction: (userId: number, action: string) => void
  router: any
}) {
  const isActive = usr.is_active !== 0
  const isOwner  = usr.role === "owner"
  const isArtist = usr.role === "artist"
  const isSanctioned = !!usr.is_sanctioned
  const userReviews = reviews.filter(r => String(r.reviewed_user_id) === String(usr.id))

  const profileStatus = isSanctioned ? "Sancionado" : !isActive ? "De baja" : (usr.artist_published || usr.owner_published) ? "Público" : "Privado"
  const profileStatusCls = isSanctioned
    ? "bg-orange-500/15 text-orange-400 border-orange-500/30"
    : !isActive
      ? "bg-red-500/15 text-red-400 border-red-500/30"
      : (usr.artist_published || usr.owner_published)
        ? "bg-green-500/15 text-green-400 border-green-500/30"
        : "bg-gray-500/15 text-gray-400 border-gray-500/30"

  return (
    <Dialog open onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-0 gap-0">

        {/* Encabezado */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-6 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <UserAvatar name={usr.first_name || "?"} size="lg" active={isActive} role={usr.role} />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold text-foreground leading-tight">
                    {usr.first_name} {usr.last_name}
                  </h2>
                  {usr.verified && <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />}
                </div>
                <p className="text-sm text-muted-foreground">{usr.email}</p>
                {(usr.phone || usr.profile_phone) && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Phone className="h-3 w-3" />{usr.phone || usr.profile_phone}
                  </p>
                )}
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors shrink-0">
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">

          {/* Métricas clave */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { label: "Rol", value: <RoleBadge role={usr.role} /> },
              { label: "Estado", value: <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${profileStatusCls}`}>{profileStatus}</span> },
              { label: "Calificación", value: Number(usr.avg_rating) > 0 ? (
                <div className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                  <span className="font-bold text-foreground text-sm">{usr.avg_rating}</span>
                </div>
              ) : <span className="text-xs text-muted-foreground">Sin datos</span> },
              { label: "Reseñas", value: <span className="font-bold text-foreground">{usr.review_count || 0}</span> },
            ].map(m => (
              <div key={m.label} className="rounded-xl p-3 text-center bg-muted/30 border border-border/50">
                <p className="text-xs text-muted-foreground mb-1.5">{m.label}</p>
                <div className="flex items-center justify-center">{m.value}</div>
              </div>
            ))}
          </div>

          {/* Perfil de Artista */}
          {isArtist && (
            <div className="rounded-xl p-4 border border-purple-500/25" style={{ background: "rgba(168,85,247,0.06)" }}>
              <div className="flex items-center gap-2 mb-3">
                <Music className="h-4 w-4 text-purple-400" />
                <span className="font-bold text-foreground">Perfil de Artista</span>
                <span className={`ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${usr.artist_published ? "bg-green-500/15 text-green-400 border-green-500/30" : "bg-gray-500/15 text-gray-400 border-gray-500/30"}`}>
                  {usr.artist_published ? "Publicado" : "No publicado"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Nombre artístico</p>
                  <p className="font-semibold text-foreground">{usr.artist_name || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Tipo de artista</p>
                  <p className="font-semibold text-foreground">{usr.artist_category || "—"}</p>
                </div>
                {usr.artist_experience_years != null && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Años de experiencia</p>
                    <p className="font-semibold text-foreground">{usr.artist_experience_years} años</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Perfil de Local */}
          {isOwner && (
            <div className="rounded-xl p-4 border border-blue-500/25" style={{ background: "rgba(59,130,246,0.06)" }}>
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="h-4 w-4 text-blue-400" />
                <span className="font-bold text-foreground">Perfil de Establecimiento</span>
                <span className={`ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${usr.owner_published ? "bg-green-500/15 text-green-400 border-green-500/30" : "bg-gray-500/15 text-gray-400 border-gray-500/30"}`}>
                  {usr.owner_published ? "Publicado" : "No publicado"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Nombre del establecimiento</p>
                  <p className="font-semibold text-foreground">{usr.business_name || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Tipo de venue</p>
                  <p className="font-semibold text-foreground">{usr.business_type || "—"}</p>
                </div>
                {(usr.owner_address || usr.owner_city) && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground mb-0.5">Dirección completa</p>
                    <p className="font-semibold text-foreground">
                      {[usr.owner_address, usr.owner_neighborhood, usr.owner_city].filter(Boolean).join(", ") || "—"}
                    </p>
                  </div>
                )}
                {usr.owner_capacity != null && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Capacidad</p>
                    <p className="font-semibold text-foreground">{usr.owner_capacity} personas</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Reseñas recibidas */}
          <div>
            <p className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-400" />
              Reseñas recibidas ({userReviews.length})
            </p>
            {userReviews.length === 0 ? (
              <div className="rounded-xl p-4 bg-muted/20 border border-border/40 text-center">
                <p className="text-sm text-muted-foreground">Este usuario no tiene reseñas aún.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {userReviews.map((rev: any) => {
                  const reviewer = rev.reviewer_artist_name || rev.reviewer_business_name
                    || `${rev.reviewer_first_name || ""} ${rev.reviewer_last_name || ""}`.trim()
                    || rev.reviewer_email || "Usuario"
                  return (
                    <div key={rev.id} className="rounded-xl p-3 border border-border/40 bg-muted/20">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                               style={{ background: "linear-gradient(135deg,#1d4ed8,#7c3aed)" }}>
                            {reviewer.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground leading-tight">{reviewer}</p>
                            <p className="text-xs text-muted-foreground">{fmtDate(rev.created_at)}</p>
                          </div>
                        </div>
                        <Stars rating={rev.rating} />
                      </div>
                      {rev.comment && (
                        <p className="text-sm text-muted-foreground italic pl-9">"{rev.comment}"</p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Acciones administrativas */}
          <div className="border-t border-border/50 pt-4">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
              Acciones administrativas
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="gap-2 justify-start" onClick={() => { router.push(`/profile/${usr.id}`); onClose() }}>
                <ExternalLink className="h-4 w-4" />Ver perfil público
              </Button>
              <Button variant="outline" className="gap-2 justify-start" onClick={() => { router.push(`/messaging?userId=${usr.id}`); onClose() }}>
                <MessageSquare className="h-4 w-4" />Enviar mensaje
              </Button>
              {isActive ? (
                <>
                  <Button
                    variant="outline"
                    className="gap-2 justify-start border-orange-400/40 text-orange-500 hover:bg-orange-500/10"
                    onClick={() => onAction(usr.id, "sanction")}
                  >
                    <Ban className="h-4 w-4" />Aplicar sanción
                  </Button>
                  <Button variant="destructive" className="gap-2 justify-start" onClick={() => onAction(usr.id, "disable")}>
                    <UserX className="h-4 w-4" />Dar de baja
                  </Button>
                  {!usr.verified
                    ? <Button variant="outline" className="gap-2 justify-start col-span-2" onClick={() => onAction(usr.id, "verify")}>
                        <CheckCircle className="h-4 w-4 text-green-500" />Verificar usuario
                      </Button>
                    : <Button variant="outline" className="gap-2 justify-start col-span-2" onClick={() => onAction(usr.id, "unverify")}>
                        <CheckCircle className="h-4 w-4" />Quitar verificación
                      </Button>
                  }
                </>
              ) : (
                <Button className="gap-2 justify-start bg-green-600 hover:bg-green-700 col-span-2" onClick={() => onAction(usr.id, "enable")}>
                  <CheckCircle className="h-4 w-4" />Habilitar cuenta
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Componente principal ──────────────────────────────────────────────────────

export default function AdminManagement() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [reports, setReports]   = useState<any[]>([])
  const [tickets, setTickets]   = useState<any[]>([])
  const [users, setUsers]       = useState<any[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [reviews, setReviews]   = useState<any[]>([])

  const [selectedUser, setSelectedUser]     = useState<any | null>(null)
  const [sanctionTarget, setSanctionTarget] = useState<any | null>(null)
  const [msgTarget, setMsgTarget]           = useState<{ id: number | string; name: string } | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null)

  const showToast = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => {
    const cu = getCurrentUser()
    if (!cu || cu.role !== "admin") { router.push("/dashboard"); return }
    loadAdminData()
  }, [])

  const loadAdminData = useCallback(async () => {
    setLoading(true)
    try {
      const [r1, r2, r3, r4, r5] = await Promise.all([
        fetch("/api/reports?isAdmin=true"),
        fetch("/api/support?isAdmin=true"),
        fetch("/api/admin/users"),
        fetch("/api/admin/bookings?isAdmin=true"),
        fetch("/api/admin/reviews"),
      ])
      setReports((await r1.json()).reports || [])
      setTickets((await r2.json()).tickets || [])
      setUsers((await r3.json()).users || [])
      setBookings((await r4.json()).bookings || [])
      setReviews((await r5.json()).reviews || [])
    } catch { showToast("Error cargando datos", "err") }
    finally { setLoading(false) }
  }, [])

  const apiCall = async (url: string, method: string, body: object, successMsg: string) => {
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (res.ok) { showToast(successMsg); loadAdminData() }
      else showToast("Error al ejecutar la acción", "err")
    } catch { showToast("Error de red", "err") }
  }

  // Sanción con modal profesional
  const handleSanctionConfirm = async (userId: number, reason: string, days: number) => {
    setSanctionTarget(null)
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + days)
    await apiCall("/api/admin/users", "PATCH", {
      userId, action: "sanction",
      sanctionReason: reason,
      sanctionDays: days,
      sanctionEndDate: endDate.toISOString(),
    }, "Sanción aplicada correctamente")
    if (selectedUser?.id === userId) setSelectedUser(null)
  }

  const handleUserAction = (userId: number, action: string) => {
    // La sanción tiene su propio modal
    if (action === "sanction") {
      const usr = users.find(u => u.id === userId)
      if (usr) { setSanctionTarget(usr); return }
    }
    const labels: Record<string, string> = {
      disable: "Usuario dado de baja", enable: "Cuenta habilitada",
      verify: "Usuario verificado",    unverify: "Verificación removida",
      suspend: "Perfiles suspendidos",
    }
    apiCall("/api/admin/users", "PATCH", { userId, action }, labels[action] || "Hecho")
    if (selectedUser?.id === userId) setSelectedUser(null)
  }

  const handleBookingAction = async (bookingId: number, action: string) => {
    await apiCall("/api/admin/bookings", "PATCH", { bookingId, action },
      action === "cancel" ? "Contratación cancelada" : "Contratación completada")
  }

  const handleReviewAction = async (reviewId: number, action: string) => {
    const labels: Record<string, string> = { hide: "Reseña ocultada", show: "Reseña mostrada", delete: "Reseña eliminada" }
    await apiCall("/api/admin/reviews", "PATCH", { reviewId, action }, labels[action])
  }

  const handleReportAction = (id: number, status: string, notes?: string) =>
    apiCall("/api/admin/reports", "PATCH", { reportId: id, status, adminNotes: notes }, "Reporte actualizado")

  const handleTicketAction = (id: number, status: string, resp?: string) =>
    apiCall("/api/admin/support", "PATCH", { ticketId: id, status, adminResponse: resp }, "Ticket actualizado")

  const handleSendMessage = async (userIdOrEmail: string | number, message: string) => {
    try {
      const cu = getCurrentUser()
      if (!cu) return
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderId: cu.id, receiverId: userIdOrEmail, content: message }),
      })
      if (res.ok) showToast("Mensaje enviado al usuario")
      else showToast("No se pudo enviar el mensaje", "err")
    } catch { showToast("Error al enviar mensaje", "err") }
    setMsgTarget(null)
  }

  if (loading) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
      <RefreshCw className="h-8 w-8 text-primary animate-spin" />
      <p className="text-muted-foreground text-lg">Cargando panel de gestión...</p>
    </div>
  )

  const pendingReports = reports.filter(r => r.status === "pending")
  const openTickets    = tickets.filter(t => t.status === "open" || t.status === "in_progress")
  const activeBookings = bookings.filter(b => ["pending","matched","accepted","confirmed"].includes(b.status))
  const activeUsers    = users.filter(u => u.is_active !== 0)

  return (
    <div className="min-h-screen bg-background">

      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* Modal Ver más */}
      {selectedUser && (
        <UserModal usr={selectedUser} reviews={reviews}
          onClose={() => setSelectedUser(null)}
          onAction={handleUserAction}
          router={router}
        />
      )}

      {/* Modal Sanción */}
      {sanctionTarget && (
        <SanctionModal
          user={sanctionTarget}
          onClose={() => setSanctionTarget(null)}
          onConfirm={(reason, days) => handleSanctionConfirm(sanctionTarget.id, reason, days)}
        />
      )}

      {/* Modal Mensaje */}
      {msgTarget && (
        <MessageModal
          userName={String(msgTarget.name)}
          onClose={() => setMsgTarget(null)}
          onSend={msg => handleSendMessage(msgTarget.id, msg)}
        />
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-[#001C55] via-[#0d2d6e] to-[#B744B8] text-white py-8 px-4">
        <div className="container mx-auto max-w-7xl">
          <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10 mb-4" onClick={() => router.push("/admin")}>
            <ArrowLeft className="h-4 w-4 mr-2" />Volver al Panel Principal
          </Button>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-white/10 rounded-xl">
              <Shield className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-bold">Gestión Detallada del Sistema</h1>
          </div>
          <p className="text-white/60 text-sm ml-16">Administración completa · usuarios, contrataciones, reseñas, reportes y soporte</p>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 py-8">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-8">
          {[
            { label: "Usuarios Activos", val: activeUsers.length, sub: `de ${users.length} totales`, icon: Users, cls: "text-violet-400", bg: "bg-violet-500/10" },
            { label: "Contrataciones", val: activeBookings.length, sub: "activas", icon: Calendar, cls: "text-blue-400", bg: "bg-blue-500/10" },
            { label: "Reseñas", val: reviews.length, sub: `${reviews.filter(r => !r.is_visible).length} ocultas`, icon: Star, cls: "text-yellow-400", bg: "bg-yellow-500/10" },
            { label: "Reportes", val: pendingReports.length, sub: "pendientes", icon: AlertCircle, cls: "text-red-400", bg: "bg-red-500/10" },
            { label: "Tickets", val: openTickets.length, sub: "abiertos", icon: HelpCircle, cls: "text-pink-400", bg: "bg-pink-500/10" },
            { label: "Perfiles", val: users.filter(u => u.artist_published || u.owner_published).length, sub: "publicados", icon: CheckCircle, cls: "text-green-400", bg: "bg-green-500/10" },
          ].map(s => {
            const Icon = s.icon
            return (
              <Card key={s.label} className="p-4 border-border/50 hover:border-border transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
                    <p className={`text-2xl font-bold mt-0.5 ${s.cls}`}>{s.val}</p>
                    <p className="text-xs text-muted-foreground/70 mt-0.5">{s.sub}</p>
                  </div>
                  <div className={`p-2 rounded-lg ${s.bg}`}>
                    <Icon className={`h-5 w-5 ${s.cls}`} />
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 h-auto">
            <TabsTrigger value="users" className="py-2.5 text-xs sm:text-sm">
              <Users className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />Usuarios ({users.length})
            </TabsTrigger>
            <TabsTrigger value="bookings" className="py-2.5 text-xs sm:text-sm">
              <Calendar className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />Contrataciones ({bookings.length})
            </TabsTrigger>
            <TabsTrigger value="reviews" className="py-2.5 text-xs sm:text-sm">
              <Star className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />Reseñas ({reviews.length})
            </TabsTrigger>
            <TabsTrigger value="reports" className="py-2.5 text-xs sm:text-sm">
              <AlertCircle className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />Reportes ({reports.length})
            </TabsTrigger>
            <TabsTrigger value="support" className="py-2.5 text-xs sm:text-sm">
              <HelpCircle className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />Soporte ({tickets.length})
            </TabsTrigger>
          </TabsList>

          {/* ════════════════════ USUARIOS ════════════════════ */}
          <TabsContent value="users">
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Gestión de Usuarios</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Hacé clic en "Ver más" para detalles completos del perfil</p>
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-muted border border-border text-muted-foreground">
                  {users.length} usuarios
                </span>
              </div>

              {users.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">No hay usuarios registrados.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/30 border-b border-border/50">
                        <th className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Usuario</th>
                        <th className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Rol</th>
                        <th className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Calificación</th>
                        <th className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Estado</th>
                        <th className="text-right px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {users.map(usr => {
                        const isActive = usr.is_active !== 0
                        const isSanctioned = !!usr.is_sanctioned

                        return (
                          <tr key={usr.id} className="hover:bg-muted/15 transition-colors group">
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <UserAvatar name={usr.first_name || "?"} size="sm" active={isActive} role={usr.role} />
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-semibold text-foreground text-sm truncate max-w-[140px]">
                                      {usr.first_name} {usr.last_name}
                                    </span>
                                    {usr.verified && <CheckCircle className="h-3 w-3 text-green-500 shrink-0" />}
                                    {isSanctioned && <span className="text-[10px] px-1 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30 font-bold">SANCIONADO</span>}
                                    {!isActive && <span className="text-[10px] px-1 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 font-bold">BAJA</span>}
                                  </div>
                                  <p className="text-xs text-muted-foreground truncate max-w-[160px]">{usr.email}</p>
                                  {(usr.artist_name || usr.business_name) && (
                                    <p className="text-xs text-muted-foreground/60 truncate max-w-[160px]">
                                      {usr.artist_name ? `🎭 ${usr.artist_name}` : `🏢 ${usr.business_name}`}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 hidden sm:table-cell">
                              <RoleBadge role={usr.role} />
                            </td>
                            <td className="px-5 py-3.5 hidden md:table-cell">
                              {Number(usr.avg_rating) > 0 ? (
                                <div className="flex items-center gap-1">
                                  <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                                  <span className="font-semibold text-foreground">{usr.avg_rating}</span>
                                  <span className="text-xs text-muted-foreground">({usr.review_count})</span>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </td>
                            <td className="px-5 py-3.5 hidden md:table-cell">
                              <StatusBadge status={isSanctioned ? "dismissed" : isActive ? "resolved" : "closed"} />
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                <Button size="sm" variant="outline" className="h-7 px-2 text-xs gap-1" onClick={() => setSelectedUser(usr)}>
                                  <ChevronRight className="h-3.5 w-3.5" />Ver más
                                </Button>
                                <Button size="sm" variant="outline" className="h-7 px-2 text-xs gap-1" onClick={() => setMsgTarget({ id: usr.id, name: `${usr.first_name} ${usr.last_name}` })}>
                                  <MessageSquare className="h-3.5 w-3.5" />
                                </Button>
                                {isActive && (
                                  <Button size="sm" variant="outline" className="h-7 px-2 text-xs gap-1 border-orange-400/40 text-orange-500 hover:bg-orange-500/10" onClick={() => { setSanctionTarget(usr) }}>
                                    <Ban className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                                {isActive ? (
                                  <Button size="sm" variant="destructive" className="h-7 px-2 text-xs gap-1" onClick={() => handleUserAction(usr.id, "disable")}>
                                    <UserX className="h-3.5 w-3.5" />
                                  </Button>
                                ) : (
                                  <Button size="sm" className="h-7 px-2 text-xs gap-1 bg-green-600 hover:bg-green-700" onClick={() => handleUserAction(usr.id, "enable")}>
                                    <UserCheck className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* ════════════════════ CONTRATACIONES ════════════════════ */}
          <TabsContent value="bookings">
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Gestión de Contrataciones</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Historial completo de solicitudes entre usuarios</p>
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-muted border border-border text-muted-foreground">
                  {bookings.length} total
                </span>
              </div>

              {bookings.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">No hay contrataciones registradas.</div>
              ) : (
                <div className="divide-y divide-border/40">
                  {bookings.map(b => {
                    const si = BOOKING_STATUS[b.status] || { label: b.status, color: "text-gray-400", bg: "bg-gray-500/15 border-gray-500/30" }
                    // sender_role indica quién inició: 'owner' = dueño contrató; 'artist' = artista se postuló
                    const ownerIsInitiator = !b.sender_role || b.sender_role === "owner"
                    const senderName = ownerIsInitiator
                      ? (b.owner_business_name || `${b.owner_first_name || ""} ${b.owner_last_name || ""}`.trim() || "Usuario desconocido")
                      : (b.artist_stage_name   || `${b.artist_first_name || ""} ${b.artist_last_name || ""}`.trim() || "Usuario desconocido")
                    const receiverName = ownerIsInitiator
                      ? (b.artist_stage_name   || `${b.artist_first_name || ""} ${b.artist_last_name || ""}`.trim() || "Usuario desconocido")
                      : (b.owner_business_name || `${b.owner_first_name || ""} ${b.owner_last_name || ""}`.trim() || "Usuario desconocido")
                    const senderEmail   = ownerIsInitiator ? b.owner_email  : b.artist_email
                    const receiverEmail = ownerIsInitiator ? b.artist_email : b.owner_email
                    const senderRole    = ownerIsInitiator ? "owner" : "artist"
                    const receiverRole  = ownerIsInitiator ? "artist" : "owner"
                    const isActive = ["pending","matched","accepted","confirmed"].includes(b.status)

                    return (
                      <div key={b.id} className="p-5 hover:bg-muted/10 transition-colors">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div className="flex items-center gap-3 flex-wrap">
                            {/* Emisor */}
                            <div className="flex items-center gap-2">
                              <UserAvatar name={senderName} size="sm" role={senderRole} active />
                              <div>
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Solicitante</p>
                                <p className="font-semibold text-foreground text-sm leading-tight">{senderName}</p>
                                <p className="text-xs text-muted-foreground">{senderEmail || "—"}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground/40">
                              <ChevronRight className="h-4 w-4" />
                              <ChevronRight className="h-4 w-4 -ml-2" />
                            </div>
                            {/* Receptor */}
                            <div className="flex items-center gap-2">
                              <UserAvatar name={receiverName} size="sm" role={receiverRole} active />
                              <div>
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Contratado</p>
                                <p className="font-semibold text-foreground text-sm leading-tight">{receiverName}</p>
                                <p className="text-xs text-muted-foreground">{receiverEmail || "—"}</p>
                              </div>
                            </div>
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border shrink-0 ${si.bg} ${si.color}`}>
                            {si.label}
                          </span>
                        </div>

                        {/* Info grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-blue-500/8 border border-blue-500/15">
                            <Calendar className="h-4 w-4 text-blue-400 shrink-0" />
                            <div>
                              <p className="text-[10px] text-blue-400/70 font-medium uppercase tracking-wide">Fecha evento</p>
                              <p className="text-sm font-bold text-foreground leading-tight">{fmtDate(b.booking_date)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-purple-500/8 border border-purple-500/15">
                            <Clock className="h-4 w-4 text-purple-400 shrink-0" />
                            <div>
                              <p className="text-[10px] text-purple-400/70 font-medium uppercase tracking-wide">Horario</p>
                              <p className="text-sm font-bold text-foreground leading-tight">
                                {b.event_time ? b.event_time.substring(0,5) + " hs" : "—"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-green-500/8 border border-green-500/15">
                            <DollarSign className="h-4 w-4 text-green-400 shrink-0" />
                            <div>
                              <p className="text-[10px] text-green-400/70 font-medium uppercase tracking-wide">Precio</p>
                              <p className="text-sm font-bold text-foreground leading-tight">
                                {b.proposed_price ? `$${Number(b.proposed_price).toLocaleString("es-AR")}` : "—"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/40 border border-border/40">
                            <Activity className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div>
                              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Creada</p>
                              <p className="text-xs font-semibold text-foreground leading-tight">{fmtDate(b.created_at)}</p>
                            </div>
                          </div>
                        </div>

                        {b.message && (
                          <div className="mb-3 p-2.5 rounded-lg bg-muted/20 border border-border/40 flex gap-2">
                            <MessageSquare className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                            <p className="text-sm text-muted-foreground italic">"{b.message}"</p>
                          </div>
                        )}

                        {isActive && (
                          <div className="flex gap-2">
                            <Button size="sm" className="bg-green-600 hover:bg-green-700 gap-1.5 text-xs" onClick={() => handleBookingAction(b.id, "complete")}>
                              <CheckCircle2 className="h-3.5 w-3.5" />Marcar completada
                            </Button>
                            <Button size="sm" variant="destructive" className="gap-1.5 text-xs" onClick={() => handleBookingAction(b.id, "cancel")}>
                              <X className="h-3.5 w-3.5" />Cancelar
                            </Button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* ════════════════════ RESEÑAS ════════════════════ */}
          <TabsContent value="reviews">
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Gestión de Reseñas</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Moderá reseñas · quién reseñó a quién, puntuación y comentario</p>
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-muted border border-border text-muted-foreground">
                  {reviews.filter(r => !r.is_visible).length} ocultas de {reviews.length}
                </span>
              </div>

              {reviews.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">No hay reseñas registradas.</div>
              ) : (
                <div className="divide-y divide-border/40">
                  {reviews.map((rev, idx) => {
                    const reviewerName = rev.reviewer_artist_name || rev.reviewer_business_name
                      || `${rev.reviewer_first_name || ""} ${rev.reviewer_last_name || ""}`.trim()
                      || "Usuario desconocido"
                    const reviewedName = rev.reviewed_artist_name || rev.reviewed_business_name
                      || `${rev.reviewed_first_name || ""} ${rev.reviewed_last_name || ""}`.trim()
                      || "Usuario desconocido"
                    const isVisible = rev.is_visible !== 0 && rev.is_visible !== false

                    return (
                      <div key={rev.id} className={`p-5 hover:bg-muted/10 transition-colors ${!isVisible ? "opacity-60" : ""}`}>
                        {/* Meta */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded">#{idx + 1}</span>
                            <Stars rating={rev.rating} size="md" />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{fmtDateTime(rev.created_at)}</span>
                            {isVisible
                              ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-500/15 text-green-400 border border-green-500/30"><Eye className="h-3 w-3" />Visible</span>
                              : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-500/15 text-gray-400 border border-gray-500/30"><EyeOff className="h-3 w-3" />Oculta</span>
                            }
                          </div>
                        </div>

                        {/* Autor → Destinatario */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                          <div className="rounded-xl p-3 border border-blue-500/20 bg-blue-500/5">
                            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-2">Autor de la reseña</p>
                            <div className="flex items-center gap-2">
                              <UserAvatar name={reviewerName} size="sm" active />
                              <div className="min-w-0">
                                <p className="font-semibold text-foreground text-sm truncate">{reviewerName}</p>
                                <p className="text-xs text-muted-foreground truncate">{rev.reviewer_email || "—"}</p>
                              </div>
                            </div>
                          </div>
                          <div className="rounded-xl p-3 border border-purple-500/20 bg-purple-500/5">
                            <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wider mb-2">Reseña dirigida a</p>
                            <div className="flex items-center gap-2">
                              <UserAvatar name={reviewedName} size="sm" active />
                              <div className="min-w-0">
                                <p className="font-semibold text-foreground text-sm truncate">{reviewedName}</p>
                                <p className="text-xs text-muted-foreground truncate">{rev.reviewed_email || "—"}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Comentario */}
                        {rev.comment ? (
                          <div className="rounded-xl p-3 bg-muted/20 border border-border/40 mb-3">
                            <div className="flex items-center gap-1.5 mb-1">
                              <FileText className="h-3 w-3 text-muted-foreground" />
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Comentario</p>
                            </div>
                            <p className="text-sm text-foreground">"{rev.comment}"</p>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground italic mb-3">Sin comentario.</p>
                        )}

                        {/* Acciones */}
                        <div className="flex gap-2">
                          {isVisible
                            ? <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => handleReviewAction(rev.id, "hide")}>
                                <EyeOff className="h-3.5 w-3.5" />Ocultar
                              </Button>
                            : <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => handleReviewAction(rev.id, "show")}>
                                <Eye className="h-3.5 w-3.5" />Mostrar
                              </Button>
                          }
                          <Button size="sm" variant="destructive" className="gap-1.5 text-xs" onClick={() => handleReviewAction(rev.id, "delete")}>
                            <X className="h-3.5 w-3.5" />Eliminar
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* ════════════════════ REPORTES ════════════════════ */}
          <TabsContent value="reports">
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Reportes de Usuarios</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Gestión de denuncias entre miembros de la comunidad</p>
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500/15 border border-yellow-500/30 text-yellow-400">
                  {pendingReports.length} pendientes
                </span>
              </div>

              {reports.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">No hay reportes registrados.</div>
              ) : (
                <div className="divide-y divide-border/40">
                  {reports.map(rep => (
                    <div key={rep.id} className="p-5 hover:bg-muted/10 transition-colors">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-muted-foreground">#{rep.id}</span>
                          <span className="text-xs text-muted-foreground">{fmtDateTime(rep.created_at)}</span>
                        </div>
                        <StatusBadge status={rep.status} />
                      </div>

                      {/* Reporter → Reported */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                        <div className="rounded-xl p-3 border border-red-500/20 bg-red-500/5">
                          <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-2">Reportado por</p>
                          <div className="flex items-center gap-2">
                            <UserAvatar name={rep.reporter_first_name || "?"} size="sm" active />
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground text-sm truncate">
                                {rep.reporter_first_name} {rep.reporter_last_name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">{rep.reporter_email || "—"}</p>
                            </div>
                          </div>
                        </div>
                        <div className="rounded-xl p-3 border border-orange-500/20 bg-orange-500/5">
                          <p className="text-[10px] font-bold text-orange-400 uppercase tracking-wider mb-2">Usuario reportado</p>
                          <div className="flex items-center gap-2">
                            <UserAvatar name={rep.reported_first_name || "?"} size="sm" active />
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground text-sm truncate">
                                {rep.reported_first_name} {rep.reported_last_name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">{rep.reported_email || "—"}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Motivo + descripción */}
                      <div className="rounded-xl p-3 bg-muted/20 border border-border/40 mb-3">
                        <p className="text-xs font-bold text-muted-foreground mb-0.5">Motivo: <span className="text-foreground font-semibold">{rep.reason}</span></p>
                        <p className="text-sm text-muted-foreground">{rep.description}</p>
                      </div>

                      {rep.image_url && (
                        <div className="mb-3">
                          <p className="text-xs text-muted-foreground mb-1 font-medium flex items-center gap-1">
                            <Zap className="h-3 w-3" />Evidencia adjunta:
                          </p>
                          <img src={rep.image_url} alt="Evidencia" className="max-h-48 rounded-xl border border-border object-contain" />
                        </div>
                      )}

                      {rep.admin_notes && (
                        <div className="mb-3 p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                          <p className="text-xs font-bold text-blue-400 mb-0.5">Nota del administrador:</p>
                          <p className="text-sm text-foreground">{rep.admin_notes}</p>
                        </div>
                      )}

                      {/* Acciones */}
                      <div className="flex gap-2 flex-wrap">
                        <Button size="sm" variant="outline" className="gap-1.5 text-xs text-red-500 border-red-500/30 hover:bg-red-500/10"
                          onClick={() => handleReportAction(rep.id, "dismissed", "Descartado por el administrador")}>
                          <TicketX className="h-3.5 w-3.5" />Descartar
                        </Button>
                        <Button size="sm" variant="outline" className="gap-1.5 text-xs"
                          onClick={() => setMsgTarget({ id: rep.reporter_id, name: `${rep.reporter_first_name || ""} ${rep.reporter_last_name || ""}`.trim() || rep.reporter_email })}>
                          <MessageSquare className="h-3.5 w-3.5" />Enviar Mensaje
                        </Button>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 gap-1.5 text-xs"
                          onClick={() => handleReportAction(rep.id, "resolved", "Revisado y resuelto por el equipo")}>
                          <CheckCircle2 className="h-3.5 w-3.5" />Marcar Resuelto
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* ════════════════════ SOPORTE ════════════════════ */}
          <TabsContent value="support">
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Tickets de Soporte</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Solicitudes de ayuda enviadas por los usuarios</p>
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500/15 border border-yellow-500/30 text-yellow-400">
                  {openTickets.length} abiertos
                </span>
              </div>

              {tickets.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">No hay tickets registrados.</div>
              ) : (
                <div className="divide-y divide-border/40">
                  {tickets.map(t => {
                    const priorityCfg: Record<string, string> = {
                      urgent: "bg-red-500/20 text-red-400 border-red-500/30",
                      high:   "bg-orange-500/20 text-orange-400 border-orange-500/30",
                      medium: "bg-blue-500/20 text-blue-400 border-blue-500/30",
                      low:    "bg-gray-500/20 text-gray-400 border-gray-500/30",
                    }
                    const priorityLabels: Record<string, string> = { urgent: "Urgente", high: "Alta", medium: "Media", low: "Baja" }

                    return (
                      <div key={t.id} className="p-5 hover:bg-muted/10 transition-colors">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <h3 className="font-bold text-foreground">{t.subject}</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">{fmtDateTime(t.created_at)}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${priorityCfg[t.priority] || priorityCfg.medium}`}>
                              {priorityLabels[t.priority] || t.priority}
                            </span>
                            <StatusBadge status={t.status} />
                          </div>
                        </div>

                        {/* Creador del ticket */}
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border/40 mb-3">
                          <UserAvatar name={t.first_name || "?"} size="sm" active />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-foreground text-sm">{t.first_name} {t.last_name}</p>
                              <RoleBadge role={t.role} />
                            </div>
                            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Mail className="h-3 w-3" />{t.email || "—"}
                              </p>
                              {t.phone && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Phone className="h-3 w-3" />{t.phone}
                                </p>
                              )}
                            </div>
                          </div>
                          <span className="text-xs px-2 py-0.5 rounded bg-muted border border-border text-muted-foreground">{t.category}</span>
                        </div>

                        {/* Mensaje */}
                        <div className="rounded-xl p-3 bg-muted/20 border border-border/40 mb-3">
                          <p className="text-sm text-foreground">{t.message}</p>
                        </div>

                        {t.image_url && (
                          <div className="mb-3">
                            <p className="text-xs text-muted-foreground mb-1 font-medium flex items-center gap-1">
                              <Zap className="h-3 w-3" />Captura adjunta:
                            </p>
                            <img src={t.image_url} alt="Captura" className="max-h-48 rounded-xl border border-border object-contain" />
                          </div>
                        )}

                        {t.admin_response && (
                          <div className="mb-3 p-3 bg-primary/8 border border-primary/20 rounded-xl">
                            <p className="text-xs font-bold text-primary mb-0.5 flex items-center gap-1">
                              <Shield className="h-3 w-3" />Respuesta del administrador:
                            </p>
                            <p className="text-sm text-foreground">{t.admin_response}</p>
                          </div>
                        )}

                        {/* Acciones */}
                        <div className="flex gap-2 flex-wrap">
                          <Button size="sm" variant="outline" className="gap-1.5 text-xs text-red-500 border-red-500/30 hover:bg-red-500/10"
                            onClick={() => handleTicketAction(t.id, "closed")}>
                            <TicketX className="h-3.5 w-3.5" />Descartar
                          </Button>
                          <Button size="sm" variant="outline" className="gap-1.5 text-xs"
                            onClick={() => setMsgTarget({ id: t.user_id, name: `${t.first_name || ""} ${t.last_name || ""}`.trim() || t.email })}>
                            <MessageSquare className="h-3.5 w-3.5" />Enviar Mensaje
                          </Button>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700 gap-1.5 text-xs"
                            onClick={() => {
                              const resp = prompt("Respuesta al usuario (opcional):", "Tu solicitud fue resuelta. Gracias por contactarnos.")
                              handleTicketAction(t.id, "resolved", resp || "Resuelto por soporte técnico")
                            }}>
                            <CheckCircle2 className="h-3.5 w-3.5" />Marcar Resuelto
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
