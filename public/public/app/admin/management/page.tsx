"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getCurrentUser } from "@/lib/auth"
import {
  Shield, Users, AlertCircle, HelpCircle, CheckCircle,
  Calendar, ArrowLeft, Star, Eye, EyeOff, Clock,
  DollarSign, ChevronDown, ChevronUp, MessageSquare,
  UserX, AlertTriangle, ExternalLink, Music, Building2,
  Camera, Mic, Briefcase, User,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

const BOOKING_STATUS: Record<string, { label: string; color: string }> = {
  pending:   { label: "En proceso",  color: "bg-yellow-500" },
  matched:   { label: "En proceso",  color: "bg-yellow-500" },
  accepted:  { label: "Aceptada",    color: "bg-green-500" },
  confirmed: { label: "Aceptada",    color: "bg-green-500" },
  rejected:  { label: "Rechazada",   color: "bg-red-500" },
  cancelled: { label: "Rechazada",   color: "bg-red-500" },
  completed: { label: "Concluida",   color: "bg-blue-500" },
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`h-4 w-4 ${i < rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-600 text-gray-600"}`} />
      ))}
      <span className="ml-1 text-sm font-bold text-foreground">{rating}/5</span>
    </div>
  )
}

export default function AdminManagement() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [reports, setReports] = useState<any[]>([])
  const [tickets, setTickets] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [reviews, setReviews] = useState<any[]>([])
  const [expandedUser, setExpandedUser] = useState<number | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null)

  const showToast = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser || currentUser.role !== "admin") {
      router.push("/dashboard")
      return
    }
    loadAdminData()
  }, [])

  const loadAdminData = async () => {
    setLoading(true)
    try {
      const [r1, r2, r3, r4, r5] = await Promise.all([
        fetch(`/api/reports?isAdmin=true`),
        fetch(`/api/support?isAdmin=true`),
        fetch(`/api/admin/users`),
        fetch(`/api/admin/bookings?isAdmin=true`),
        fetch(`/api/admin/reviews`),
      ])
      setReports((await r1.json()).reports || [])
      setTickets((await r2.json()).tickets || [])
      setUsers((await r3.json()).users || [])
      setBookings((await r4.json()).bookings || [])
      setReviews((await r5.json()).reviews || [])
    } catch { showToast("Error cargando datos", "err") }
    finally { setLoading(false) }
  }

  const apiCall = async (url: string, body: object, successMsg: string) => {
    const key = JSON.stringify(body)
    setActionLoading(key)
    try {
      const res = await fetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      if (res.ok) { showToast(successMsg); loadAdminData() }
      else showToast("Error al ejecutar la acción", "err")
    } catch { showToast("Error de red", "err") }
    finally { setActionLoading(null) }
  }

  const handleUserAction = async (userId: number, action: string) => {
    const confirmMsgs: Record<string, string> = {
      disable:  "¿Dar de baja esta cuenta? El usuario no podrá iniciar sesión.",
      suspend:  "¿Suspender los perfiles? Se despublicarán pero la cuenta sigue activa.",
      sanction: "¿Aplicar sanción? Se quitará la verificación y se suspenderán los perfiles.",
      delete:   "¿Eliminar usuario? Esta acción NO se puede deshacer.",
    }
    if (confirmMsgs[action] && !window.confirm(confirmMsgs[action])) return
    const labels: Record<string, string> = {
      disable: "Usuario dado de baja", enable: "Cuenta habilitada",
      verify: "Usuario verificado", unverify: "Verificación removida",
      suspend: "Perfiles suspendidos", sanction: "Sanción aplicada",
    }
    await apiCall("/api/admin/users", { userId, action }, labels[action] || "Acción ejecutada")
  }

  const handleBookingAction = async (bookingId: number, action: string) => {
    if (action === "cancel" && !window.confirm("¿Cancelar esta contratación?")) return
    await apiCall("/api/admin/bookings", { bookingId, action }, action === "cancel" ? "Contratación cancelada" : "Contratación completada")
  }

  const handleReviewAction = async (reviewId: number, action: string) => {
    if (action === "delete" && !window.confirm("¿Eliminar esta reseña permanentemente?")) return
    const labels: Record<string, string> = { hide: "Reseña ocultada", show: "Reseña mostrada", delete: "Reseña eliminada" }
    await apiCall("/api/admin/reviews", { reviewId, action }, labels[action])
  }

  const handleReportAction = async (reportId: number, status: string, notes?: string) => {
    await apiCall("/api/admin/reports", { reportId, status, adminNotes: notes }, "Reporte actualizado")
  }

  const handleTicketAction = async (ticketId: number, status: string, resp?: string) => {
    await apiCall("/api/admin/support", { ticketId, status, adminResponse: resp }, "Ticket actualizado")
  }

  const fmtDate = (d: string) => {
    if (!d) return "—"
    try { return new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" }) }
    catch { return d }
  }

  const getCategoryIcon = (cat: string) => {
    const c = (cat || "").toLowerCase()
    if (c.includes("foto") || c.includes("photo")) return <Camera className="h-4 w-4" />
    if (c.includes("band") || c.includes("musi")) return <Music className="h-4 w-4" />
    if (c.includes("dj")) return <Mic className="h-4 w-4" />
    return <Briefcase className="h-4 w-4" />
  }

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-muted-foreground animate-pulse">Cargando panel de gestión...</p>
    </div>
  )

  const pendingReports = reports.filter(r => r.status === "pending")
  const openTickets = tickets.filter(t => t.status === "open" || t.status === "in_progress")
  const activeBookings = bookings.filter(b => ["pending","matched","accepted","confirmed"].includes(b.status))
  const activeUsers = users.filter(u => u.is_active !== 0)
  const hiddenReviews = reviews.filter(r => !r.is_visible)

  return (
    <div className="min-h-screen bg-background">

      {/* Toast notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl text-white text-sm font-semibold shadow-xl transition-all ${toast.type === "ok" ? "bg-green-600" : "bg-red-600"}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-secondary text-primary-foreground py-8 px-4">
        <div className="container mx-auto max-w-7xl">
          <Button variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10 mb-4" onClick={() => router.push("/admin")}>
            <ArrowLeft className="h-4 w-4 mr-2" />Volver al Panel Principal
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8" />
            <h1 className="text-3xl font-bold">Gestión Detallada del Sistema</h1>
          </div>
          <p className="text-primary-foreground/80">Administración completa de usuarios, contrataciones, reseñas, reportes y soporte</p>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 py-8">

        {/* Stats */}
        <div className="grid md:grid-cols-6 gap-4 mb-8">
          {[
            { label: "Usuarios Activos", val: activeUsers.length, sub: `de ${users.length} totales`, icon: <Users className="h-8 w-8 text-primary/60"/>, cls: "text-primary" },
            { label: "Contrataciones", val: activeBookings.length, sub: "activas", icon: <Calendar className="h-8 w-8 text-blue-600/60"/>, cls: "text-blue-600" },
            { label: "Reseñas", val: reviews.length, sub: `${hiddenReviews.length} ocultas`, icon: <Star className="h-8 w-8 text-yellow-600/60"/>, cls: "text-yellow-600" },
            { label: "Reportes", val: pendingReports.length, sub: "pendientes", icon: <AlertCircle className="h-8 w-8 text-destructive/60"/>, cls: "text-destructive" },
            { label: "Tickets", val: openTickets.length, sub: "abiertos", icon: <HelpCircle className="h-8 w-8 text-secondary/60"/>, cls: "text-secondary" },
            { label: "Perfiles", val: users.filter(u => u.artist_published || u.owner_published).length, sub: "publicados", icon: <CheckCircle className="h-8 w-8 text-green-600/60"/>, cls: "text-green-600" },
          ].map(s => (
            <Card key={s.label} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className={`text-3xl font-bold ${s.cls}`}>{s.val}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
                </div>
                {s.icon}
              </div>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full md:w-auto grid-cols-5">
            <TabsTrigger value="users">Usuarios ({users.length})</TabsTrigger>
            <TabsTrigger value="bookings">Contrataciones ({bookings.length})</TabsTrigger>
            <TabsTrigger value="reviews">Reseñas ({reviews.length})</TabsTrigger>
            <TabsTrigger value="reports">Reportes ({pendingReports.length})</TabsTrigger>
            <TabsTrigger value="support">Soporte ({openTickets.length})</TabsTrigger>
          </TabsList>

          {/* ══════════════════════════ USUARIOS ══════════════════════════ */}
          <TabsContent value="users">
            <Card className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-1">Gestión de Usuarios</h2>
              <p className="text-sm text-muted-foreground mb-5">Hacé clic en un usuario para ver su información completa y tomar acciones administrativas.</p>
              {users.length === 0 ? <p className="text-muted-foreground">No hay usuarios registrados</p> : (
                <div className="space-y-3">
                  {users.map((usr) => {
                    const isExpanded = expandedUser === usr.id
                    const isActive = usr.is_active !== 0
                    const roleLabel = usr.role === "artist" ? "Artista / Emprendedor" : usr.role === "owner" ? "Dueño de Local" : "Administrador"
                    const profileType = usr.artist_name ? "artista" : usr.business_name ? "local" : null

                    return (
                      <div key={usr.id} className={`rounded-2xl border transition-all duration-200 overflow-hidden ${isExpanded ? "border-primary/40 shadow-lg shadow-primary/5" : "border-border"}`}>
                        {/* ── Fila resumen ── */}
                        <button
                          className="w-full text-left p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors"
                          onClick={() => setExpandedUser(isExpanded ? null : usr.id)}
                        >
                          {/* Avatar */}
                          <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-base shrink-0"
                               style={{ background: isActive ? "linear-gradient(135deg,#001C55,#B744B8)" : "rgba(100,100,100,0.4)" }}>
                            {usr.first_name?.charAt(0)?.toUpperCase() || "?"}
                          </div>

                          {/* Info básica */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-foreground">{usr.first_name} {usr.last_name}</span>
                              {usr.verified && <CheckCircle className="h-4 w-4 text-green-500 shrink-0"/>}
                              {!isActive && <Badge variant="destructive" className="text-xs">DADO DE BAJA</Badge>}
                              <Badge variant="outline" className="capitalize text-xs">{roleLabel}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{usr.email}</p>
                            {(usr.artist_name || usr.business_name) && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {usr.artist_name ? `🎭 ${usr.artist_name} · ${usr.artist_category || ""}` : `🏢 ${usr.business_name} · ${usr.business_type || ""}`}
                              </p>
                            )}
                          </div>

                          {/* Rating mini + chevron */}
                          <div className="flex items-center gap-3 shrink-0">
                            {Number(usr.avg_rating) > 0 && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400"/>
                                <span className="font-semibold">{usr.avg_rating}</span>
                              </div>
                            )}
                            {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground"/> : <ChevronDown className="h-4 w-4 text-muted-foreground"/>}
                          </div>
                        </button>

                        {/* ── Panel expandido ── */}
                        {isExpanded && (
                          <div className="px-4 pb-4 space-y-4 border-t border-border/50 pt-4">

                            {/* Métricas */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              <div className="rounded-xl p-3 bg-muted/30 border border-border/40">
                                <p className="text-xs text-muted-foreground mb-1">Rol</p>
                                <p className="font-semibold text-foreground text-sm">{roleLabel}</p>
                              </div>
                              <div className="rounded-xl p-3 bg-muted/30 border border-border/40">
                                <p className="text-xs text-muted-foreground mb-1">Calificación promedio</p>
                                <div className="flex items-center gap-1">
                                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400"/>
                                  <span className="font-bold text-foreground">{Number(usr.avg_rating) > 0 ? `${usr.avg_rating} / 5` : "Sin calificaciones"}</span>
                                </div>
                              </div>
                              <div className="rounded-xl p-3 bg-muted/30 border border-border/40">
                                <p className="text-xs text-muted-foreground mb-1">Cantidad de reseñas</p>
                                <p className="font-bold text-foreground">{usr.review_count || 0}</p>
                              </div>
                              <div className="rounded-xl p-3 bg-muted/30 border border-border/40">
                                <p className="text-xs text-muted-foreground mb-1">Estado</p>
                                <p className="font-bold text-foreground">{isActive ? "✅ Activo" : "❌ De baja"}</p>
                              </div>
                            </div>

                            {/* Perfil artista */}
                            {usr.artist_name && (
                              <div className="rounded-xl p-4 border border-purple-500/20" style={{ background: "rgba(168,85,247,0.05)" }}>
                                <div className="flex items-center gap-2 mb-2">
                                  {getCategoryIcon(usr.artist_category)}
                                  <span className="font-semibold text-foreground text-sm">Perfil de Artista</span>
                                  {usr.artist_published
                                    ? <Badge className="bg-green-600 text-xs ml-auto">Publicado</Badge>
                                    : <Badge variant="secondary" className="text-xs ml-auto">No publicado</Badge>
                                  }
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div><span className="text-muted-foreground">Nombre artístico: </span><span className="font-medium">{usr.artist_name}</span></div>
                                  <div><span className="text-muted-foreground">Categoría: </span><span className="font-medium">{usr.artist_category || "—"}</span></div>
                                </div>
                              </div>
                            )}

                            {/* Perfil local */}
                            {usr.business_name && (
                              <div className="rounded-xl p-4 border border-blue-500/20" style={{ background: "rgba(59,130,246,0.05)" }}>
                                <div className="flex items-center gap-2 mb-2">
                                  <Building2 className="h-4 w-4 text-blue-400"/>
                                  <span className="font-semibold text-foreground text-sm">Perfil de Local</span>
                                  {usr.owner_published
                                    ? <Badge className="bg-green-600 text-xs ml-auto">Publicado</Badge>
                                    : <Badge variant="secondary" className="text-xs ml-auto">No publicado</Badge>
                                  }
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div><span className="text-muted-foreground">Nombre: </span><span className="font-medium">{usr.business_name}</span></div>
                                  <div><span className="text-muted-foreground">Tipo: </span><span className="font-medium">{usr.business_type || "—"}</span></div>
                                </div>
                              </div>
                            )}

                            {/* Acciones */}
                            <div>
                              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Acciones administrativas</p>
                              <div className="flex flex-wrap gap-2">
                                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => router.push(`/profile/${usr.id}`)}>
                                  <ExternalLink className="h-3.5 w-3.5"/>Ver perfil público
                                </Button>
                                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => router.push(`/messaging?userId=${usr.id}`)}>
                                  <MessageSquare className="h-3.5 w-3.5"/>Enviar mensaje
                                </Button>

                                {isActive ? (
                                  <>
                                    {!usr.verified
                                      ? <Button size="sm" variant="outline" onClick={() => handleUserAction(usr.id, "verify")}>✓ Verificar</Button>
                                      : <Button size="sm" variant="outline" onClick={() => handleUserAction(usr.id, "unverify")}>Quitar verificación</Button>
                                    }
                                    {(usr.artist_published || usr.owner_published) && (
                                      <Button size="sm" variant="secondary" onClick={() => handleUserAction(usr.id, "suspend")}>
                                        Suspender perfiles
                                      </Button>
                                    )}
                                    <Button size="sm" variant="outline"
                                      className="gap-1.5 border-orange-400/50 text-orange-500 hover:bg-orange-500/10"
                                      onClick={() => handleUserAction(usr.id, "sanction")}>
                                      <AlertTriangle className="h-3.5 w-3.5"/>Aplicar sanción
                                    </Button>
                                    <Button size="sm" variant="destructive" className="gap-1.5" onClick={() => handleUserAction(usr.id, "disable")}>
                                      <UserX className="h-3.5 w-3.5"/>Dar de baja
                                    </Button>
                                  </>
                                ) : (
                                  <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleUserAction(usr.id, "enable")}>
                                    Habilitar cuenta
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* ══════════════════════════ CONTRATACIONES ══════════════════════════ */}
          <TabsContent value="bookings">
            <Card className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">Gestión de Contrataciones</h2>
              {bookings.length === 0 ? <p className="text-muted-foreground">No hay contrataciones registradas</p> : (
                <div className="space-y-4">
                  {bookings.map((b) => {
                    const si = BOOKING_STATUS[b.status] || { label: b.status, color: "bg-gray-500" }
                    const requester = b.owner_business_name || `${b.owner_first_name || ""} ${b.owner_last_name || ""}`.trim()
                    const contracted = b.artist_stage_name || `${b.artist_first_name || ""} ${b.artist_last_name || ""}`.trim()
                    const isActive = ["pending","matched","accepted","confirmed"].includes(b.status)
                    const dateVal = b.booking_date || b.event_date

                    return (
                      <Card key={b.id} className="p-4 border-l-4 border-l-blue-500">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <p className="font-semibold text-foreground text-base">
                              <span className="text-muted-foreground text-sm font-normal">Solicitante: </span>{requester}
                              <span className="text-muted-foreground mx-2">→</span>
                              <span className="text-muted-foreground text-sm font-normal">Contratado: </span>{contracted}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {b.owner_email} → {b.artist_email}
                            </p>
                          </div>
                          <Badge className={`${si.color} text-white shrink-0 ml-3`}>{si.label}</Badge>
                        </div>

                        {/* Info boxes */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                            <Calendar className="h-4 w-4 text-blue-400 shrink-0"/>
                            <div>
                              <p className="text-xs text-blue-300/70">Fecha programada</p>
                              <p className="text-sm font-bold text-blue-200">{fmtDate(dateVal)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
                            <Clock className="h-4 w-4 text-purple-400 shrink-0"/>
                            <div>
                              <p className="text-xs text-purple-300/70">Horario</p>
                              <p className="text-sm font-bold text-purple-200">{b.event_time ? b.event_time.substring(0,5) + " hs" : "—"}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-green-500/10 border border-green-500/20">
                            <DollarSign className="h-4 w-4 text-green-400 shrink-0"/>
                            <div>
                              <p className="text-xs text-green-300/70">Precio propuesto</p>
                              <p className="text-sm font-bold text-green-200">
                                {(b.proposed_price || b.price) ? `$${Number(b.proposed_price || b.price).toLocaleString("es-AR")}` : "—"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/40 border border-border/40">
                            <AlertCircle className="h-4 w-4 text-orange-400 shrink-0"/>
                            <div>
                              <p className="text-xs text-muted-foreground">Estado</p>
                              <p className="text-sm font-bold text-foreground">{si.label}</p>
                            </div>
                          </div>
                        </div>

                        {b.message && (
                          <div className="mb-3 p-2.5 rounded-lg bg-muted/20 border border-border/40">
                            <p className="text-xs text-muted-foreground mb-0.5 font-medium">Mensaje:</p>
                            <p className="text-sm text-foreground italic">"{b.message}"</p>
                          </div>
                        )}

                        {isActive && (
                          <div className="flex gap-2">
                            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleBookingAction(b.id, "complete")}>Marcar completada</Button>
                            <Button size="sm" variant="destructive" onClick={() => handleBookingAction(b.id, "cancel")}>Cancelar</Button>
                          </div>
                        )}
                      </Card>
                    )
                  })}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* ══════════════════════════ RESEÑAS ══════════════════════════ */}
          <TabsContent value="reviews">
            <Card className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">Gestión de Reseñas</h2>
              {reviews.length === 0 ? <p className="text-muted-foreground">No hay reseñas registradas</p> : (
                <div className="space-y-4">
                  {reviews.map((rev, idx) => {
                    const reviewerName = `${rev.reviewer_first_name || ""} ${rev.reviewer_last_name || ""}`.trim() || "Usuario desconocido"
                    const reviewedName = rev.reviewed_artist_name || rev.reviewed_business_name
                      || (`${rev.reviewed_first_name || ""} ${rev.reviewed_last_name || ""}`.trim()) || "Usuario desconocido"
                    const reviewerEmail = rev.reviewer_email || "—"
                    const reviewedEmail = rev.reviewed_email || "—"

                    return (
                      <Card key={rev.id} className={`overflow-hidden border-l-4 ${rev.is_visible ? "border-l-green-500" : "border-l-gray-500"}`}>
                        {/* Title bar */}
                        <div className="flex items-center justify-between px-4 py-2.5 bg-muted/20 border-b border-border/30">
                          <span className="text-sm font-bold text-foreground">Reseña #{idx + 1}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {new Date(rev.created_at).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })}
                            </span>
                            {rev.is_visible
                              ? <Badge className="bg-green-600 gap-1 text-xs"><Eye className="h-3 w-3"/>Visible</Badge>
                              : <Badge variant="secondary" className="gap-1 text-xs"><EyeOff className="h-3 w-3"/>Oculta</Badge>
                            }
                          </div>
                        </div>

                        <div className="p-4 space-y-3">
                          {/* Autor y destinatario */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="rounded-xl p-3 border border-blue-500/20" style={{ background: "rgba(59,130,246,0.05)" }}>
                              <p className="text-xs font-semibold text-blue-400 mb-1.5">Autor de la reseña:</p>
                              <p className="font-bold text-foreground text-sm">{reviewerName}</p>
                              <p className="text-xs text-muted-foreground">{reviewerEmail}</p>
                            </div>
                            <div className="rounded-xl p-3 border border-purple-500/20" style={{ background: "rgba(168,85,247,0.05)" }}>
                              <p className="text-xs font-semibold text-purple-400 mb-1.5">Reseña dirigida a:</p>
                              <p className="font-bold text-foreground text-sm">{reviewedName}</p>
                              <p className="text-xs text-muted-foreground">{reviewedEmail}</p>
                            </div>
                          </div>

                          {/* Calificación */}
                          <div>
                            <p className="text-xs text-muted-foreground mb-1.5">Calificación:</p>
                            <StarDisplay rating={rev.rating} />
                          </div>

                          {/* Comentario */}
                          {rev.comment && (
                            <div className="rounded-xl p-3 bg-muted/20 border border-border/40">
                              <div className="flex items-center gap-1.5 mb-1">
                                <MessageSquare className="h-3.5 w-3.5 text-muted-foreground"/>
                                <p className="text-xs text-muted-foreground font-semibold">Comentario:</p>
                              </div>
                              <p className="text-sm text-foreground italic">"{rev.comment}"</p>
                            </div>
                          )}

                          {/* Acciones */}
                          <div className="flex gap-2 pt-1">
                            {rev.is_visible
                              ? <Button size="sm" variant="outline" className="gap-1.5 bg-transparent" onClick={() => handleReviewAction(rev.id, "hide")}>
                                  <EyeOff className="h-4 w-4"/>Ocultar Reseña
                                </Button>
                              : <Button size="sm" variant="outline" className="gap-1.5 bg-transparent" onClick={() => handleReviewAction(rev.id, "show")}>
                                  <Eye className="h-4 w-4"/>Mostrar Reseña
                                </Button>
                            }
                            <Button size="sm" variant="destructive" className="gap-1.5" onClick={() => handleReviewAction(rev.id, "delete")}>
                              Eliminar
                            </Button>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* ══════════════════════════ REPORTES ══════════════════════════ */}
          <TabsContent value="reports">
            <Card className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">Reportes de Usuarios</h2>
              {reports.length === 0 ? <p className="text-muted-foreground">No hay reportes registrados</p> : (
                <div className="space-y-4">
                  {reports.map(rep => (
                    <Card key={rep.id} className="p-4 border-l-4 border-l-destructive">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-semibold text-foreground">
                            {rep.reporter_first_name} {rep.reporter_last_name} reportó a {rep.reported_first_name} {rep.reported_last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">{rep.reporter_email}</p>
                        </div>
                        <Badge className={rep.status === "pending" ? "bg-yellow-500" : rep.status === "resolved" ? "bg-green-500" : "bg-gray-500"}>
                          {rep.status}
                        </Badge>
                      </div>
                      <div className="mb-3">
                        <p className="text-sm font-medium text-foreground">Motivo: {rep.reason}</p>
                        <p className="text-sm text-muted-foreground mt-1">{rep.description}</p>
                      </div>
                      {rep.status === "pending" && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleReportAction(rep.id, "under_review")}>Revisar</Button>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleReportAction(rep.id, "resolved", "Revisado y resuelto")}>Resolver</Button>
                          <Button size="sm" variant="destructive" onClick={() => handleReportAction(rep.id, "dismissed", "Descartado")}>Descartar</Button>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* ══════════════════════════ SOPORTE ══════════════════════════ */}
          <TabsContent value="support">
            <Card className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">Tickets de Soporte</h2>
              {tickets.length === 0 ? <p className="text-muted-foreground">No hay tickets registrados</p> : (
                <div className="space-y-4">
                  {tickets.map(t => (
                    <Card key={t.id} className="p-4 border-l-4 border-l-secondary">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-semibold text-foreground">{t.subject}</p>
                          <p className="text-sm text-muted-foreground">{t.first_name} {t.last_name} — {t.email}</p>
                        </div>
                        <div className="flex gap-2 items-center">
                          <Badge className={t.priority === "urgent" ? "bg-red-500" : t.priority === "high" ? "bg-orange-500" : "bg-blue-500"}>{t.priority}</Badge>
                          <Badge className={t.status === "open" ? "bg-yellow-500" : t.status === "resolved" ? "bg-green-500" : t.status === "closed" ? "bg-gray-500" : "bg-blue-500"}>{t.status}</Badge>
                        </div>
                      </div>
                      <div className="mb-3">
                        <p className="text-sm font-medium text-foreground">Categoría: {t.category}</p>
                        <p className="text-sm text-muted-foreground mt-1">{t.message}</p>
                        {t.admin_response && (
                          <div className="mt-2 p-2 bg-secondary/10 rounded">
                            <p className="text-xs font-medium text-foreground">Respuesta Admin:</p>
                            <p className="text-sm text-muted-foreground">{t.admin_response}</p>
                          </div>
                        )}
                      </div>
                      {(t.status === "open" || t.status === "in_progress") && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleTicketAction(t.id, "in_progress")}>En Progreso</Button>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleTicketAction(t.id, "resolved", "Resuelto por soporte")}>Resolver</Button>
                          <Button size="sm" variant="secondary" onClick={() => handleTicketAction(t.id, "closed")}>Cerrar</Button>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
