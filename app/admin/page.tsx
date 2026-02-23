"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { getCurrentUser, logoutUser } from "@/lib/auth"
import {
  Shield, Users, AlertCircle, HelpCircle, CheckCircle, Calendar,
  Star, Eye, EyeOff, Send, MessageSquare, XCircle,
  Check, Clock, Ban, Trash2, Mail, Info, UserX, ExternalLink, X, Image as ImageIcon,
  UserCheck, AlertTriangle, ChevronRight, Crown, Package, MapPin,
  Zap, Camera, Activity, Music, Building2, Plus
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function AdminPanel() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingReports: 0,
    openTickets: 0,
    activeBookings: 0,
    publishedProfiles: 0,
  })

  // Data states
  const [reports, setReports] = useState<any[]>([])
  const [tickets, setTickets] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [reviews, setReviews] = useState<any[]>([])

  // Modal states
  const [messageModal, setMessageModal] = useState<{open: boolean; userId: number | null; userName: string; type?: string; itemId?: number}>({
    open: false, userId: null, userName: "", type: undefined, itemId: undefined
  })
  const [messageText, setMessageText] = useState("")
  
  const [detailsModal, setDetailsModal] = useState<{open: boolean; user: any | null}>({
    open: false, user: null
  })

  const [imageModal, setImageModal] = useState<{open: boolean; url: string}>({
    open: false, url: ""
  })

  // Events state
  const [events, setEvents] = useState<any[]>([])
  const [eventsLoading, setEventsLoading] = useState(false)
  const [evImgIdx, setEvImgIdx] = useState<Record<number, number>>({})
  const [evFilterStatus, setEvFilterStatus] = useState<"all"|"visible"|"hidden">("all")
  const [evTogglingId, setEvTogglingId] = useState<number|null>(null)
  const [evDeletingId, setEvDeletingId] = useState<number|null>(null)
  const [evShowCreate, setEvShowCreate] = useState(false)
  const [evTitle, setEvTitle] = useState("")
  const [evDesc, setEvDesc] = useState("")
  const [evCategory, setEvCategory] = useState("")
  const [evLocation, setEvLocation] = useState("")
  const [evDate, setEvDate] = useState("")
  const [evTime, setEvTime] = useState("")
  const [evCapacity, setEvCapacity] = useState("")
  const [evImages, setEvImages] = useState<string[]>([])
  const [evCreating, setEvCreating] = useState(false)

  // Modal de confirmación profesional (reemplaza confirm() del browser)
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean
    title: string
    description: string
    icon: "sanction" | "disable" | "enable"
    confirmLabel: string
    confirmClass: string
    onConfirm: () => void
    // Sanción extra fields
    showSanctionFields?: boolean
    sanctionReason?: string
    sanctionDays?: number
  }>({
    open: false, title: "", description: "", icon: "disable",
    confirmLabel: "", confirmClass: "", onConfirm: () => {},
  })
  const [sanctionReason, setSanctionReason] = useState("")
  const [sanctionDays, setSanctionDays] = useState(7)

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser || currentUser.role !== "admin") {
      toast({ title: "Acceso denegado", description: "Solo administradores", variant: "destructive" })
      router.push("/dashboard")
      return
    }
    setUser(currentUser)
    loadAllData()
    loadEvents()
  }, [])

  const loadAllData = async () => {
    setLoading(true)
    try {
      const [usersRes, reportsRes, ticketsRes, bookingsRes, reviewsRes] = await Promise.all([
        fetch(`/api/admin/users`),
        fetch(`/api/reports?isAdmin=true`),
        fetch(`/api/support?isAdmin=true`),
        fetch(`/api/admin/bookings?isAdmin=true`),
        fetch(`/api/admin/reviews`),
      ])

      const [usersData, reportsData, ticketsData, bookingsData, reviewsData] = await Promise.all([
        usersRes.json(), reportsRes.json(), ticketsRes.json(), bookingsRes.json(), reviewsRes.json()
      ])

      const usersList = usersData.users || []
      const reportsList = reportsData.reports || []
      const ticketsList = ticketsData.tickets || []
      const bookingsList = bookingsData.bookings || []
      const reviewsList = reviewsData.reviews || []

      setUsers(usersList)
      setReports(reportsList)
      setTickets(ticketsList)
      setBookings(bookingsList)
      setReviews(reviewsList)

      setStats({
        totalUsers: usersList.length,
        pendingReports: reportsList.filter((r: any) => r.status === "pending").length,
        openTickets: ticketsList.filter((t: any) => t.status === "open" || t.status === "in_progress").length,
        activeBookings: bookingsList.filter((b: any) => b.status === "pending" || b.status === "accepted").length,
        publishedProfiles: usersList.filter((u: any) => u.artist_published || u.owner_published).length,
      })
    } catch (error) {
      console.error("Error cargando datos:", error)
      toast({ title: "Error cargando datos", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const loadEvents = async () => {
    setEventsLoading(true)
    try {
      const res = await fetch("/api/events?admin=true")
      const data = await res.json()
      setEvents(Array.isArray(data) ? data : [])
    } catch {}
    setEventsLoading(false)
  }

  const handleEvImgNav = (eventId: number, dir: 1 | -1, total: number) => {
    setEvImgIdx(prev => ({ ...prev, [eventId]: ((prev[eventId] ?? 0) + dir + total) % total }))
  }

  const handleEvToggle = async (event: any) => {
    setEvTogglingId(event.id)
    await fetch("/api/events", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: event.id, is_published: !event.is_published }),
    })
    await loadEvents()
    setEvTogglingId(null)
  }

  const handleEvDelete = async (id: number) => {
    if (!confirm("¿Eliminar este evento permanentemente?")) return
    setEvDeletingId(id)
    await fetch(`/api/events?id=${id}`, { method: "DELETE" })
    await loadEvents()
    setEvDeletingId(null)
  }

  const handleEvImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    files.slice(0, 5 - evImages.length).forEach(file => {
      const reader = new FileReader()
      reader.onload = ev => setEvImages(prev => [...prev, ev.target?.result as string])
      reader.readAsDataURL(file)
    })
  }

  const handleEvCreate = async () => {
    if (!evTitle.trim()) return
    setEvCreating(true)
    const cu = getCurrentUser()
    try {
      await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: cu?.id,
          title: evTitle, description: evDesc, category: evCategory,
          location: evLocation, eventDate: evDate, eventTime: evTime,
          capacity: evCapacity ? Number(evCapacity) : null,
          images: evImages, createdByAdmin: true
        }),
      })
      setEvShowCreate(false)
      setEvTitle(""); setEvDesc(""); setEvCategory(""); setEvLocation("")
      setEvDate(""); setEvTime(""); setEvCapacity(""); setEvImages([])
      await loadEvents()
    } catch {}
    setEvCreating(false)
  }

  const sendMessageToUser = async () => {
    if (!messageText.trim() || !messageModal.userId) return
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: messageModal.userId,
          type: messageModal.type === 'report' ? 'report_resolved' : messageModal.type === 'ticket' ? 'support_resolved' : 'admin_message',
          title: messageModal.type === 'report' ? 'Tu reporte ha sido atendido' : 
                 messageModal.type === 'ticket' ? 'Tu ticket de soporte ha sido resuelto' :
                 'Mensaje del Administrador',
          message: messageText,
          relatedId: messageModal.itemId,
          relatedType: messageModal.type,
        })
      })
      toast({ title: "Mensaje enviado al usuario" })
      setMessageModal({ open: false, userId: null, userName: "", type: undefined, itemId: undefined })
      setMessageText("")
    } catch (e) {
      toast({ title: "Error enviando mensaje", variant: "destructive" })
    }
  }

  const applySanction = (userId: number, userName: string) => {
    setSanctionReason("")
    setSanctionDays(7)
    setConfirmModal({
      open: true,
      title: `Sancionar a ${userName}`,
      description: "El perfil del usuario será desactivado durante el período indicado y recibirá una notificación.",
      icon: "sanction",
      confirmLabel: "Aplicar Sanción",
      confirmClass: "bg-yellow-500 hover:bg-yellow-600 text-white",
      showSanctionFields: true,
      onConfirm: async () => {
        const endDate = new Date()
        endDate.setDate(endDate.getDate() + sanctionDays)
        try {
          await fetch('/api/admin/users', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId, action: 'sanction',
              sanctionReason, sanctionDays,
              sanctionEndDate: endDate.toISOString(),
            })
          })
          toast({ title: "✅ Sanción aplicada", description: `${userName} ha sido sancionado por ${sanctionDays} días.` })
          loadAllData()
        } catch { toast({ title: "Error aplicando sanción", variant: "destructive" }) }
      }
    })
  }

  const deactivateUser = (userId: number, userName: string, isCurrentlyActive: boolean) => {
    if (!isCurrentlyActive) {
      // Usuario ya está dado de baja → ofrecer rehabilitar
      setConfirmModal({
        open: true,
        title: `Rehabilitar a ${userName}`,
        description: "La cuenta del usuario será reactivada y podrá volver a usar la plataforma.",
        icon: "enable",
        confirmLabel: "Rehabilitar cuenta",
        confirmClass: "bg-green-600 hover:bg-green-700 text-white",
        onConfirm: async () => {
          try {
            await fetch('/api/admin/users', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId, action: 'enable' })
            })
            toast({ title: "✅ Usuario rehabilitado", description: `${userName} puede volver a acceder.` })
            loadAllData()
          } catch { toast({ title: "Error", variant: "destructive" }) }
        }
      })
    } else {
      setConfirmModal({
        open: true,
        title: `Dar de baja a ${userName}`,
        description: "La cuenta quedará desactivada. Podés reactivarla en cualquier momento.",
        icon: "disable",
        confirmLabel: "Dar de baja",
        confirmClass: "bg-red-600 hover:bg-red-700 text-white",
        onConfirm: async () => {
          try {
            await fetch('/api/admin/users', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId, action: 'deactivate' })
            })
            toast({ title: "✅ Usuario dado de baja", description: `La cuenta de ${userName} fue desactivada.` })
            loadAllData()
          } catch { toast({ title: "Error", variant: "destructive" }) }
        }
      })
    }
  }

  const openUserDetails = async (userId: number) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`)
      const data = await res.json()
      if (data.user) {
        setDetailsModal({ open: true, user: data.user })
      }
    } catch (e) {
      toast({ title: "Error cargando detalles", variant: "destructive" })
    }
  }

  const updateReportStatus = async (reportId: number, status: string, reporterId: number) => {
    try {
      await fetch(`/api/admin/reports`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, status })
      })
      toast({ title: "Reporte actualizado" })
      loadAllData()
      if (status === 'resolved') {
        const report = reports.find(r => r.id === reportId)
        setMessageModal({ 
          open: true, 
          userId: reporterId, 
          userName: "usuario", 
          type: 'report',
          itemId: reportId
        })
      }
    } catch (e) {
      toast({ title: "Error", variant: "destructive" })
    }
  }

  const updateTicketStatus = async (ticketId: number, status: string, userId: number) => {
    try {
      await fetch(`/api/admin/support`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, status })
      })
      toast({ title: "Ticket actualizado" })
      loadAllData()
      if (status === 'resolved') {
        setMessageModal({ 
          open: true, 
          userId, 
          userName: "usuario", 
          type: 'ticket',
          itemId: ticketId
        })
      }
    } catch (e) {
      toast({ title: "Error", variant: "destructive" })
    }
  }

  const toggleReviewVisibility = async (reviewId: number, isVisible: boolean) => {
    try {
      await fetch(`/api/admin/reviews`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, isVisible: !isVisible })
      })
      toast({ title: isVisible ? "Reseña ocultada" : "Reseña visible" })
      loadAllData()
    } catch (e) {
      toast({ title: "Error", variant: "destructive" })
    }
  }

  const deleteReview = async (reviewId: number) => {
    if (!confirm("¿Eliminar esta reseña permanentemente?")) return
    try {
      await fetch(`/api/admin/reviews`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId })
      })
      toast({ title: "Reseña eliminada" })
      loadAllData()
    } catch (e) {
      toast({ title: "Error eliminando reseña", variant: "destructive" })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(160deg, #080b14 0%, #0d0817 50%, #080b14 100%)" }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60 text-lg">Cargando panel...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #080b14 0%, #0d0817 50%, #080b14 100%)" }}>
      {/* Header */}
      <div className="py-8 px-4" style={{ background: "linear-gradient(135deg, #001C55 0%, #B744B8 100%)" }}>
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)" }}>
                <Shield className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-white">Panel de Administración</h1>
                <p className="text-white/80 text-sm">Gestión completa de Red Show</p>
              </div>
            </div>
            <Button onClick={logoutUser} variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20 bg-transparent">
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: "Usuarios", value: stats.totalUsers, icon: Users, color: "#3b82f6" },
            { label: "Reportes", value: stats.pendingReports, icon: AlertCircle, color: "#ef4444" },
            { label: "Tickets", value: stats.openTickets, icon: HelpCircle, color: "#B744B8" },
            { label: "Contrataciones", value: stats.activeBookings, icon: Calendar, color: "#10b981" },
            { label: "Perfiles", value: stats.publishedProfiles, icon: CheckCircle, color: "#f59e0b" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-2xl p-5 border transition-all hover:scale-105"
              style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.1)" }}>
              <Icon className="h-8 w-8 mb-2" style={{ color }} />
              <p className="text-3xl font-black mb-1" style={{ color }}>{value}</p>
              <p className="text-white/50 text-xs font-semibold uppercase tracking-wider">{label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-6 p-1 h-auto"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-500">
              <Users className="h-4 w-4 mr-2" /> Usuarios
            </TabsTrigger>
            <TabsTrigger value="bookings" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-green-500">
              <Calendar className="h-4 w-4 mr-2" /> Contrataciones
            </TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-red-500">
              <AlertCircle className="h-4 w-4 mr-2" /> Reportes
            </TabsTrigger>
            <TabsTrigger value="support" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-500">
              <HelpCircle className="h-4 w-4 mr-2" /> Soporte
            </TabsTrigger>
            <TabsTrigger value="reviews" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-600 data-[state=active]:to-yellow-500">
              <Star className="h-4 w-4 mr-2" /> Reseñas
            </TabsTrigger>
            <TabsTrigger value="events" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-600 data-[state=active]:to-purple-600">
              <Zap className="h-4 w-4 mr-2" /> Eventos
            </TabsTrigger>
          </TabsList>

          {/* TAB: USUARIOS */}
          <TabsContent value="overview">
            <h3 className="text-xl font-bold text-white mb-4">Gestión de Usuarios</h3>
            <div className="rounded-2xl overflow-hidden border" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.1)" }}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ background: "rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                      <th className="text-left p-4 text-white/60 text-xs font-bold uppercase tracking-wider">Usuario</th>
                      <th className="text-left p-4 text-white/60 text-xs font-bold uppercase tracking-wider">Email</th>
                      <th className="text-left p-4 text-white/60 text-xs font-bold uppercase tracking-wider">Rol</th>
                      <th className="text-left p-4 text-white/60 text-xs font-bold uppercase tracking-wider">Estado</th>
                      <th className="text-right p-4 text-white/60 text-xs font-bold uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u: any) => (
                      <tr key={u.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
                        className="hover:bg-white/5 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                              style={{ background: "linear-gradient(135deg, #001C55, #B744B8)" }}>
                              {u.first_name?.charAt(0)}{u.last_name?.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold text-white text-sm">{u.first_name} {u.last_name}</p>
                              <p className="text-white/40 text-xs">ID: {u.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4"><p className="text-white/70 text-sm">{u.email}</p></td>
                        <td className="p-4">
                          <Badge className={u.role === 'admin' ? 'bg-purple-500' : u.role === 'artist' ? 'bg-blue-500' : 'bg-green-500'}>
                            {u.role === 'admin' ? 'Admin' : u.role === 'artist' ? 'Artista' : 'Dueño'}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Badge className={u.is_active === 0 ? 'bg-red-500' : u.is_sanctioned ? 'bg-yellow-500' : 'bg-green-500'}>
                            {u.is_active === 0 ? 'Inactivo' : u.is_sanctioned ? 'Sancionado' : 'Activo'}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button size="sm" onClick={() => openUserDetails(u.id)}
                              className="h-8 px-3 bg-blue-600 hover:bg-blue-700 border-0 text-xs">
                              <Info className="h-3.5 w-3.5 mr-1" />Ver más
                            </Button>
                            <Button size="sm" onClick={() => router.push(`/profile/${u.id}`)}
                              variant="outline" className="h-8 px-3 border-white/20 bg-transparent text-xs">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" onClick={() => setMessageModal({ open: true, userId: u.id, userName: `${u.first_name} ${u.last_name}` })}
                              className="h-8 px-3 bg-purple-600 hover:bg-purple-700 border-0 text-xs">
                              <Send className="h-3.5 w-3.5" />
                            </Button>
                            {u.is_active !== 0 && (
                              <Button size="sm" onClick={() => applySanction(u.id, `${u.first_name} ${u.last_name}`)}
                                className="h-8 px-3 bg-yellow-600 hover:bg-yellow-700 border-0 text-xs"
                                title="Sancionar usuario">
                                <Ban className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            <Button size="sm"
                              onClick={() => deactivateUser(u.id, `${u.first_name} ${u.last_name}`, u.is_active !== 0)}
                              className={`h-8 px-3 border-0 text-xs ${u.is_active !== 0 ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                              title={u.is_active !== 0 ? 'Dar de baja' : 'Rehabilitar cuenta'}>
                              {u.is_active !== 0 ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* TAB: CONTRATACIONES */}
          <TabsContent value="bookings" className="space-y-3">
            <h3 className="text-xl font-bold text-white mb-4">Contrataciones del Sistema</h3>
            {bookings.map((b: any) => {
              const statusLabel: Record<string,string> = {
                pending:"Pendiente",matched:"Aceptada parcial",accepted:"Aceptada",
                confirmed:"Confirmada",rejected:"Rechazada",cancelled:"Cancelada",completed:"Finalizada"
              }
              const statusColor: Record<string,string> = {
                pending:"bg-yellow-500",matched:"bg-yellow-400",accepted:"bg-green-500",
                confirmed:"bg-green-600",rejected:"bg-red-500",cancelled:"bg-red-400",completed:"bg-blue-500"
              }
              // sender_role indica quién inició: 'owner' = dueño contrató artista; 'artist' = artista se postuló
              const ownerIsInitiator = !b.sender_role || b.sender_role === "owner"
              const senderName = ownerIsInitiator
                ? (b.owner_business_name || `${b.owner_first_name||""} ${b.owner_last_name||""}`.trim() || "Desconocido")
                : (b.artist_stage_name   || `${b.artist_first_name||""} ${b.artist_last_name||""}`.trim() || "Desconocido")
              const receiverName = ownerIsInitiator
                ? (b.artist_stage_name   || `${b.artist_first_name||""} ${b.artist_last_name||""}`.trim() || "Desconocido")
                : (b.owner_business_name || `${b.owner_first_name||""} ${b.owner_last_name||""}`.trim() || "Desconocido")
              const senderEmail   = ownerIsInitiator ? b.owner_email  : b.artist_email
              const receiverEmail = ownerIsInitiator ? b.artist_email : b.owner_email
              const fmtD = (d: string) => {
                if (!d) return "No especificada"
                if (/^\d{4}-\d{2}-\d{2}$/.test(d)) { const [y,m,day]=d.split("-").map(Number); return new Date(y,m-1,day).toLocaleDateString("es-AR",{day:"2-digit",month:"long",year:"numeric"}) }
                return new Date(d).toLocaleDateString("es-AR",{day:"2-digit",month:"long",year:"numeric"})
              }
              return (
                <div key={b.id} className="rounded-xl p-5 border" style={{ background:"rgba(255,255,255,0.04)",borderColor:"rgba(255,255,255,0.1)" }}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-bold text-white text-base">{b.title || "Contratación"}</p>
                      <p className="text-white/40 text-xs mt-0.5">{fmtD(b.booking_date)}{b.event_time ? ` · ${b.event_time.substring(0,5)} hs` : ""}</p>
                    </div>
                    <Badge className={statusColor[b.status]||"bg-gray-500"}>{statusLabel[b.status]||b.status}</Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                    <div className="flex items-center gap-2.5 p-3 rounded-xl" style={{ background:"rgba(59,130,246,0.1)",border:"1px solid rgba(59,130,246,0.2)" }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ background:"linear-gradient(135deg,#1d4ed8,#3b82f6)" }}>
                        {senderName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Solicitante</p>
                        <p className="text-sm font-semibold text-white truncate">{senderName}</p>
                        <p className="text-xs text-white/40 truncate">{senderEmail||""}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 p-3 rounded-xl" style={{ background:"rgba(168,85,247,0.1)",border:"1px solid rgba(168,85,247,0.2)" }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ background:"linear-gradient(135deg,#7c3aed,#a855f7)" }}>
                        {receiverName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Contratado</p>
                        <p className="text-sm font-semibold text-white truncate">{receiverName}</p>
                        <p className="text-xs text-white/40 truncate">{receiverEmail||""}</p>
                      </div>
                    </div>
                  </div>
                  {b.price && <p className="text-xs text-white/50 mb-2">Precio: <span className="text-white font-semibold">${Number(b.price).toLocaleString("es-AR")}</span></p>}
                  {b.message && (
                    <div className="p-3 rounded-lg" style={{ background:"rgba(255,255,255,0.04)" }}>
                      <p className="text-white/50 text-xs mb-1">Mensaje</p>
                      <p className="text-white/70 text-sm italic">"{b.message}"</p>
                    </div>
                  )}
                </div>
              )
            })}
          </TabsContent>

          {/* TAB: REPORTES */}
          <TabsContent value="reports" className="space-y-3">
            <h3 className="text-xl font-bold text-white mb-4">Reportes de Usuarios</h3>
            {reports.map((r: any) => (
              <div key={r.id} className="rounded-xl p-5 border" style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.2)" }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className={r.status === 'pending' ? 'bg-yellow-500' : r.status === 'resolved' ? 'bg-green-500' : 'bg-gray-500'}>
                        {r.status === 'pending' ? 'Pendiente' : r.status === 'resolved' ? 'Resuelto' : 'Descartado'}
                      </Badge>
                      <span className="text-white/50 text-xs">{new Date(r.created_at).toLocaleDateString('es-AR')}</span>
                    </div>

                    {/* Quién reportó → A quién */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                      <div className="flex items-center gap-2 p-2.5 rounded-lg" style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)" }}>
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                          style={{ background: "linear-gradient(135deg,#dc2626,#ef4444)" }}>
                          {(r.reporter_first_name || r.reporter_email || "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Reportado por</p>
                          <p className="text-sm font-semibold text-white truncate">
                            {r.reporter_first_name && r.reporter_last_name
                              ? `${r.reporter_first_name} ${r.reporter_last_name}`
                              : r.reporter_email || `Usuario #${r.reporter_id}`}
                          </p>
                          <p className="text-xs text-white/40 truncate">{r.reporter_email || ""}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2.5 rounded-lg" style={{ background: "rgba(251,146,60,0.12)", border: "1px solid rgba(251,146,60,0.25)" }}>
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                          style={{ background: "linear-gradient(135deg,#ea580c,#f97316)" }}>
                          {(r.reported_first_name || r.reported_email || "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">Usuario reportado</p>
                          <p className="text-sm font-semibold text-white truncate">
                            {r.reported_first_name && r.reported_last_name
                              ? `${r.reported_first_name} ${r.reported_last_name}`
                              : r.reported_email || `Usuario #${r.reported_user_id}`}
                          </p>
                          <p className="text-xs text-white/40 truncate">{r.reported_email || ""}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg mb-2" style={{ background: "rgba(255,255,255,0.04)" }}>
                      <p className="text-white/50 text-xs mb-0.5 font-semibold uppercase tracking-wide">Motivo</p>
                      <p className="font-semibold text-white text-sm">{r.reason}</p>
                      {r.description && <p className="text-white/60 text-sm mt-1">{r.description}</p>}
                    </div>
                    {r.image_url && (
                      <button onClick={() => setImageModal({ open: true, url: r.image_url })}
                        className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-xs">
                        <ImageIcon className="h-3.5 w-3.5" />
                        Ver imagen adjunta
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" onClick={() => updateReportStatus(r.id, 'resolved', r.reporter_id)}
                    className="bg-green-600 hover:bg-green-700 border-0">
                    <Check className="h-3.5 w-3.5 mr-1.5" />Resolver
                  </Button>
                  <Button size="sm" onClick={() => setMessageModal({ open: true, userId: r.reporter_id, userName: r.reporter_first_name ? `${r.reporter_first_name} ${r.reporter_last_name}` : "usuario", type: 'report', itemId: r.id })}
                    className="bg-purple-600 hover:bg-purple-700 border-0">
                    <Send className="h-3.5 w-3.5 mr-1.5" />Mensaje
                  </Button>
                  <Button size="sm" onClick={() => updateReportStatus(r.id, 'dismissed', r.reporter_id)}
                    variant="outline" className="border-white/20 text-white/70 bg-transparent">
                    <XCircle className="h-3.5 w-3.5 mr-1.5" />Descartar
                  </Button>
                </div>
              </div>
            ))}
          </TabsContent>

          {/* TAB: SOPORTE */}
          <TabsContent value="support" className="space-y-3">
            <h3 className="text-xl font-bold text-white mb-4">Tickets de Soporte</h3>
            {tickets.map((t: any) => (
              <div key={t.id} className="rounded-xl p-5 border" style={{ background: "rgba(168,85,247,0.08)", borderColor: "rgba(168,85,247,0.2)" }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className={t.status === 'open' ? 'bg-yellow-500' : t.status === 'resolved' ? 'bg-green-500' : 'bg-blue-500'}>
                        {t.status === 'open' ? 'Abierto' : t.status === 'resolved' ? 'Resuelto' : t.status === 'in_progress' ? 'En proceso' : t.status}
                      </Badge>
                      <span className="text-white/50 text-xs">{new Date(t.created_at).toLocaleDateString('es-AR')}</span>
                    </div>

                    {/* Usuario que creó el ticket */}
                    <div className="flex items-center gap-3 p-3 rounded-xl mb-3"
                      style={{ background: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.25)" }}>
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                        style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)" }}>
                        {(t.first_name || t.email || "?").charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wider mb-0.5">Creado por</p>
                        <p className="text-sm font-semibold text-white">
                          {t.first_name && t.last_name ? `${t.first_name} ${t.last_name}` : t.email || `Usuario #${t.user_id}`}
                        </p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <p className="text-xs text-white/50">{t.email || ""}</p>
                          {t.role && (
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              t.role === 'admin' ? 'bg-rose-500/20 text-rose-300' :
                              t.role === 'artist' ? 'bg-purple-500/20 text-purple-300' :
                              'bg-blue-500/20 text-blue-300'
                            }`}>
                              {t.role === 'admin' ? 'Admin' : t.role === 'artist' ? 'Artista' : 'Dueño de Local'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg mb-2" style={{ background: "rgba(255,255,255,0.04)" }}>
                      <p className="font-semibold text-white mb-1">Asunto: {t.subject}</p>
                      <p className="text-white/60 text-sm">{t.message}</p>
                    </div>
                    {t.image_url && (
                      <button onClick={() => setImageModal({ open: true, url: t.image_url })}
                        className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-xs">
                        <ImageIcon className="h-3.5 w-3.5" />
                        Ver imagen adjunta
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" onClick={() => updateTicketStatus(t.id, 'resolved', t.user_id)}
                    className="bg-green-600 hover:bg-green-700 border-0">
                    <Check className="h-3.5 w-3.5 mr-1.5" />Resolver
                  </Button>
                  <Button size="sm" onClick={() => setMessageModal({ open: true, userId: t.user_id, userName: t.first_name ? `${t.first_name} ${t.last_name}` : "usuario", type: 'ticket', itemId: t.id })}
                    className="bg-purple-600 hover:bg-purple-700 border-0">
                    <Send className="h-3.5 w-3.5 mr-1.5" />Mensaje
                  </Button>
                  <Button size="sm" onClick={() => updateTicketStatus(t.id, 'in_progress', t.user_id)}
                    className="bg-blue-600 hover:bg-blue-700 border-0">
                    <Clock className="h-3.5 w-3.5 mr-1.5" />En proceso
                  </Button>
                </div>
              </div>
            ))}
          </TabsContent>

          {/* TAB: RESEÑAS */}
          <TabsContent value="reviews" className="space-y-3">
            <h3 className="text-xl font-bold text-white mb-4">Reseñas del Sistema</h3>
            {reviews.map((rev: any) => (
              <div key={rev.id} className="rounded-xl p-5 border" style={{ background: "rgba(234,179,8,0.06)", borderColor: "rgba(234,179,8,0.2)" }}>
                {/* Header: estrellas + visibilidad + fecha */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} className={`h-4 w-4 ${i <= rev.rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-700 text-gray-700'}`} />
                      ))}
                    </div>
                    <span className="font-bold text-yellow-400 text-sm">{rev.rating}/5</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-white/40 text-xs">{new Date(rev.created_at).toLocaleDateString('es-AR', { day:'2-digit', month:'long', year:'numeric' })}</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${rev.is_visible ? 'bg-green-500/15 text-green-400 border-green-500/30' : 'bg-gray-500/15 text-gray-400 border-gray-500/30'}`}>
                      {rev.is_visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      {rev.is_visible ? 'Visible' : 'Oculta'}
                    </span>
                  </div>
                </div>

                {/* Autor → Destinatario */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                  <div className="flex items-center gap-2.5 p-3 rounded-xl" style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)" }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ background: "linear-gradient(135deg,#1d4ed8,#3b82f6)" }}>
                      {(rev.reviewer_name || "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Autor de la reseña</p>
                      <p className="text-sm font-semibold text-white truncate">{rev.reviewer_name || "Desconocido"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 p-3 rounded-xl" style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.2)" }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)" }}>
                      {(rev.reviewed_name || "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Reseña dirigida a</p>
                      <p className="text-sm font-semibold text-white truncate">{rev.reviewed_name || "Desconocido"}</p>
                    </div>
                  </div>
                </div>

                {/* Comentario */}
                {rev.comment && (
                  <div className="p-3 rounded-xl mb-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <p className="text-white/70 text-sm italic">"{rev.comment}"</p>
                  </div>
                )}

                {/* Acciones */}
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => toggleReviewVisibility(rev.id, rev.is_visible)}
                    variant="outline" className="border-white/20 bg-transparent text-white/80 hover:bg-white/10 h-8">
                    {rev.is_visible ? <EyeOff className="h-3.5 w-3.5 mr-1.5" /> : <Eye className="h-3.5 w-3.5 mr-1.5" />}
                    {rev.is_visible ? 'Ocultar' : 'Mostrar'}
                  </Button>
                  <Button size="sm" onClick={() => deleteReview(rev.id)}
                    className="bg-red-600 hover:bg-red-700 border-0 h-8">
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />Eliminar
                  </Button>
                </div>
              </div>
            ))}
          </TabsContent>

          {/* ════════════════════ EVENTOS ════════════════════ */}
          <TabsContent value="events">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
                <div>
                  <h3 className="text-lg font-bold text-white">Gestión de Eventos</h3>
                  <p className="text-white/40 text-sm mt-0.5">
                    {events.length} eventos · {events.filter(e=>e.is_published).length} visibles · {events.filter(e=>!e.is_published).length} ocultos
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {/* filtro */}
                  <div className="flex rounded-lg overflow-hidden text-xs" style={{ border: "1px solid rgba(255,255,255,0.15)" }}>
                    {(["all","visible","hidden"] as const).map(f => (
                      <button key={f} onClick={() => setEvFilterStatus(f)}
                        className="px-3 py-1.5 font-semibold transition-colors"
                        style={{ background: evFilterStatus===f ? "linear-gradient(135deg,#B744B8,#7a1a8a)" : "transparent", color: evFilterStatus===f ? "white" : "rgba(255,255,255,0.4)" }}>
                        {f==="all"?"Todos":f==="visible"?"Visibles":"Ocultos"}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setEvShowCreate(s=>!s)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all"
                    style={{ background: "linear-gradient(135deg,#001C55,#B744B8)" }}>
                    <Plus className="h-4 w-4" />
                    {evShowCreate ? "Cancelar" : "Publicar Evento"}
                  </button>
                </div>
              </div>

              {/* Create form */}
              {evShowCreate && (
                <div className="rounded-2xl p-6 space-y-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <p className="font-bold text-white text-sm flex items-center gap-2">
                    <Shield className="h-4 w-4 text-purple-400" /> Nuevo evento (publicado como Admin)
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { label:"Título *", val:evTitle, set:setEvTitle, ph:"Nombre del evento" },
                      { label:"Lugar",    val:evLocation, set:setEvLocation, ph:"Ej: Palermo, CABA" },
                    ].map(f => (
                      <div key={f.label}>
                        <label className="text-xs font-semibold text-white/40 uppercase tracking-wider block mb-1">{f.label}</label>
                        <input value={f.val} onChange={e=>f.set(e.target.value)} placeholder={f.ph}
                          className="w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                          style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)" }} />
                      </div>
                    ))}
                    <div>
                      <label className="text-xs font-semibold text-white/40 uppercase tracking-wider block mb-1">Categoría</label>
                      <select value={evCategory} onChange={e=>setEvCategory(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl text-sm text-white focus:outline-none"
                        style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)" }}>
                        <option value="">Seleccioná</option>
                        {["Música en vivo","DJ","Teatro","Humor","Danza","Arte","Feria","Otro"].map(c=>(
                          <option key={c} value={c} style={{background:"#0d1022"}}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-white/40 uppercase tracking-wider block mb-1">Capacidad</label>
                      <input type="number" value={evCapacity} onChange={e=>setEvCapacity(e.target.value)} placeholder="N° personas"
                        className="w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none"
                        style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)" }} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-white/40 uppercase tracking-wider block mb-1">Fecha</label>
                      <input type="date" value={evDate} onChange={e=>setEvDate(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl text-sm text-white focus:outline-none"
                        style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", colorScheme:"dark" }} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-white/40 uppercase tracking-wider block mb-1">Horario</label>
                      <input type="time" value={evTime} onChange={e=>setEvTime(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl text-sm text-white focus:outline-none"
                        style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", colorScheme:"dark" }} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-white/40 uppercase tracking-wider block mb-1">Descripción</label>
                    <textarea value={evDesc} onChange={e=>setEvDesc(e.target.value)} rows={3} placeholder="Info del evento..."
                      className="w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none resize-none"
                      style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)" }} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-white/40 uppercase tracking-wider block mb-1">Imágenes / Flyer (hasta 5)</label>
                    <div className="flex gap-2 flex-wrap">
                      {evImages.map((img,i) => (
                        <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden">
                          <img src={img} alt="" className="w-full h-full object-cover" />
                          <button onClick={() => setEvImages(prev=>prev.filter((_,idx)=>idx!==i))}
                            className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      {evImages.length < 5 && (
                        <label className="w-16 h-16 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                          style={{ border:"2px dashed rgba(255,255,255,0.15)" }}>
                          <Camera className="h-5 w-5 text-white/40" />
                          <input type="file" accept="image/*" multiple className="hidden" onChange={handleEvImageChange} />
                        </label>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleEvCreate} disabled={evCreating || !evTitle.trim()}
                      className="px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition-all"
                      style={{ background:"linear-gradient(135deg,#001C55,#B744B8)" }}>
                      {evCreating ? "Publicando..." : "Publicar Evento"}
                    </button>
                    <button onClick={() => setEvShowCreate(false)}
                      className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white/50 hover:text-white transition-colors"
                      style={{ border:"1px solid rgba(255,255,255,0.1)" }}>
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Events Grid */}
              {eventsLoading ? (
                <div className="text-center py-12 text-white/40">Cargando eventos...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {events
                    .filter(e => evFilterStatus==="all" ? true : evFilterStatus==="visible" ? e.is_published : !e.is_published)
                    .map(event => {
                      const imgs: string[] = (() => {
                        try { const p=JSON.parse(event.images||"[]"); return p.length?p:event.image_url?[event.image_url]:[] }
                        catch { return event.image_url?[event.image_url]:[] }
                      })()
                      const curImg = evImgIdx[event.id] ?? 0
                      const creatorInitial = ((event.first_name?.[0]??"")+(event.last_name?.[0]??"")).toUpperCase()||"?"
                      const creatorName = event.creator_name || `${event.first_name??""} ${event.last_name??""}`.trim() || "Usuario"

                      return (
                        <div key={event.id}
                          className={`rounded-2xl overflow-hidden transition-all hover:shadow-xl hover:-translate-y-0.5 ${!event.is_published?"opacity-55":""}`}
                          style={{ background:"rgba(255,255,255,0.04)", border: event.is_published ? "1px solid rgba(255,255,255,0.1)" : "1px dashed rgba(255,255,255,0.15)" }}>

                          {/* Image */}
                          <div className="relative h-44 overflow-hidden" style={{ background:"linear-gradient(135deg,rgba(183,68,184,0.2),rgba(0,28,85,0.3))" }}>
                            {imgs.length>0 ? (
                              <>
                                <img src={imgs[curImg]} alt={event.title} className="w-full h-full object-cover" />
                                {imgs.length>1 && (
                                  <>
                                    <button onClick={()=>handleEvImgNav(event.id,-1,imgs.length)}
                                      className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-all">
                                      <ChevronRight className="h-4 w-4 rotate-180" />
                                    </button>
                                    <button onClick={()=>handleEvImgNav(event.id,1,imgs.length)}
                                      className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-all">
                                      <ChevronRight className="h-4 w-4" />
                                    </button>
                                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                                      {imgs.map((_:any,i:number) => (
                                        <div key={i} className={`w-1.5 h-1.5 rounded-full ${i===curImg?"bg-white":"bg-white/40"}`} />
                                      ))}
                                    </div>
                                  </>
                                )}
                              </>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Calendar className="h-14 w-14 text-white/10" />
                              </div>
                            )}
                            {/* badges */}
                            <div className="absolute top-2 left-2 flex flex-col gap-1">
                              {event.category && (
                                <span className="px-2 py-0.5 rounded-lg text-xs font-bold text-white"
                                  style={{ background:"linear-gradient(135deg,#B744B8,#7a1a8a)" }}>
                                  {event.category}
                                </span>
                              )}
                              {event.created_by_admin ? (
                                <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-amber-500 text-white">Admin</span>
                              ) : null}
                            </div>
                            <div className="absolute top-2 right-2">
                              <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${event.is_published?"bg-green-500 text-white":"bg-gray-700 text-white/80"}`}>
                                {event.is_published?"Visible":"Oculto"}
                              </span>
                            </div>
                          </div>

                          {/* Content */}
                          <div className="p-4">
                            <h4 className="font-bold text-white text-sm mb-1.5 line-clamp-2 leading-snug">{event.title}</h4>
                            {event.description && (
                              <p className="text-white/45 text-xs mb-3 line-clamp-2 leading-relaxed">{event.description}</p>
                            )}

                            <div className="space-y-1.5 mb-3">
                              {event.event_date && (
                                <div className="flex items-center gap-1.5 text-xs text-white/50">
                                  <Calendar className="h-3 w-3 text-purple-400 flex-shrink-0" />
                                  <span>
                                    {(() => { try { const [y,m,d]=event.event_date.split("-").map(Number); return new Date(y,m-1,d).toLocaleDateString("es-AR",{day:"2-digit",month:"long",year:"numeric"}) } catch { return event.event_date } })()}
                                    {event.event_time ? ` · ${event.event_time}` : ""}
                                  </span>
                                </div>
                              )}
                              {event.location && (
                                <div className="flex items-center gap-1.5 text-xs text-white/50">
                                  <MapPin className="h-3 w-3 text-green-400 flex-shrink-0" />
                                  <span className="truncate">{event.location}</span>
                                </div>
                              )}
                              {event.capacity && (
                                <div className="flex items-center gap-1.5 text-xs text-white/50">
                                  <Users className="h-3 w-3 text-blue-400 flex-shrink-0" />
                                  <span>Capacidad: {event.capacity} personas</span>
                                </div>
                              )}
                            </div>

                            {/* Creator info */}
                            <div className="flex items-center gap-2 py-2.5 mb-3" style={{ borderTop:"1px solid rgba(255,255,255,0.06)" }}>
                              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                                style={{ background:"linear-gradient(135deg,#B744B8,#001C55)" }}>
                                {creatorInitial}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-white truncate">{creatorName}</p>
                                {event.creator_email && (
                                  <p className="text-xs text-white/35 truncate">{event.creator_email}</p>
                                )}
                              </div>
                              {event.role && (
                                <span className="text-xs px-1.5 py-0.5 rounded flex-shrink-0 text-white/50"
                                  style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.08)" }}>
                                  {event.role==="artist"?"Artista":event.role==="owner"?"Local":event.role==="admin"?"Admin":event.role}
                                </span>
                              )}
                            </div>

                            {/* Action buttons */}
                            <div className="flex gap-2">
                              <button onClick={()=>handleEvToggle(event)} disabled={evTogglingId===event.id}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                                style={{
                                  background: event.is_published ? "rgba(255,255,255,0.06)" : "rgba(34,197,94,0.15)",
                                  border: event.is_published ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(34,197,94,0.3)",
                                  color: event.is_published ? "rgba(255,255,255,0.6)" : "#22c55e"
                                }}>
                                {evTogglingId===event.id ? (
                                  <Activity className="h-3.5 w-3.5 animate-spin" />
                                ) : event.is_published ? (
                                  <EyeOff className="h-3.5 w-3.5" />
                                ) : (
                                  <Eye className="h-3.5 w-3.5" />
                                )}
                                {event.is_published ? "Ocultar" : "Mostrar"}
                              </button>
                              <button onClick={()=>handleEvDelete(event.id)} disabled={evDeletingId===event.id}
                                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                                style={{ background:"rgba(239,68,68,0.12)", border:"1px solid rgba(239,68,68,0.25)", color:"#f87171" }}>
                                {evDeletingId===event.id ? <Activity className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                                Eliminar
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                  })}
                  {events.filter(e => evFilterStatus==="all" ? true : evFilterStatus==="visible" ? e.is_published : !e.is_published).length === 0 && (
                    <div className="col-span-full text-center py-16 text-white/30">
                      <Calendar className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p className="font-semibold">{evFilterStatus==="hidden"?"No hay eventos ocultos":evFilterStatus==="visible"?"No hay eventos visibles":"No hay eventos publicados aún"}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

        </Tabs>
      </div>

      {/* MODAL: Confirmación profesional (sancionar / dar de baja / rehabilitar) */}
      {confirmModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ background: "linear-gradient(160deg,#0d1022 0%,#080b14 100%)", border: "1px solid rgba(255,255,255,0.1)" }}>
            {/* Header */}
            <div className={`px-6 pt-6 pb-4 flex items-center gap-4 ${
              confirmModal.icon === "sanction" ? "border-b border-yellow-500/20" :
              confirmModal.icon === "enable"   ? "border-b border-green-500/20"  :
                                                 "border-b border-red-500/20"
            }`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                confirmModal.icon === "sanction" ? "bg-yellow-500/15" :
                confirmModal.icon === "enable"   ? "bg-green-500/15"  :
                                                   "bg-red-500/15"
              }`}>
                {confirmModal.icon === "sanction" ? <Ban className="h-6 w-6 text-yellow-400" /> :
                 confirmModal.icon === "enable"   ? <UserCheck className="h-6 w-6 text-green-400" /> :
                                                    <UserX className="h-6 w-6 text-red-400" />}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{confirmModal.title}</h3>
                <p className="text-white/50 text-sm mt-0.5">{confirmModal.description}</p>
              </div>
            </div>

            {/* Campos extra para sanción */}
            {confirmModal.showSanctionFields && (
              <div className="px-6 py-4 space-y-4 border-b border-white/10">
                <div>
                  <label className="block text-sm font-medium text-white mb-1.5">Motivo de la sanción *</label>
                  <textarea
                    value={sanctionReason}
                    onChange={e => setSanctionReason(e.target.value)}
                    placeholder="Describe el motivo de la sanción..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-xl text-white placeholder-white/30 text-sm resize-none focus:outline-none"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-1.5">Duración: <span className="text-yellow-400 font-bold">{sanctionDays} días</span></label>
                  <input type="range" min={1} max={365} value={sanctionDays}
                    onChange={e => setSanctionDays(Number(e.target.value))}
                    className="w-full accent-yellow-500" />
                  <div className="flex gap-2 mt-2">
                    {[3,7,14,30,90].map(d => (
                      <button key={d} onClick={() => setSanctionDays(d)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${sanctionDays === d ? 'bg-yellow-500 text-white border-yellow-500' : 'border-white/20 text-white/50 hover:border-yellow-400 hover:text-yellow-400'}`}>
                        {d}d
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-yellow-400/70 mt-2">
                    📅 Finaliza: {(() => { const d = new Date(); d.setDate(d.getDate()+sanctionDays); return d.toLocaleDateString("es-AR",{day:"2-digit",month:"long",year:"numeric"}) })()}
                  </p>
                </div>
              </div>
            )}

            {/* Acciones */}
            <div className="flex gap-3 p-6">
              <Button variant="outline" className="flex-1 border-white/20 bg-transparent text-white hover:bg-white/10"
                onClick={() => setConfirmModal(m => ({ ...m, open: false }))}>
                Cancelar
              </Button>
              <Button
                className={`flex-1 border-0 ${confirmModal.confirmClass}`}
                disabled={confirmModal.showSanctionFields && !sanctionReason.trim()}
                onClick={() => { setConfirmModal(m => ({ ...m, open: false })); confirmModal.onConfirm() }}>
                {confirmModal.icon === "sanction" ? <Ban className="h-4 w-4 mr-2" /> :
                 confirmModal.icon === "enable"   ? <UserCheck className="h-4 w-4 mr-2" /> :
                                                    <UserX className="h-4 w-4 mr-2" />}
                {confirmModal.confirmLabel}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Enviar Mensaje */}
      {messageModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)" }}>
          <div className="w-full max-w-lg rounded-2xl p-6" style={{ background: "linear-gradient(160deg, #0d1022 0%, #080b14 100%)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Mail className="h-6 w-6 text-purple-400" />
                <h3 className="text-xl font-bold text-white">Enviar mensaje a {messageModal.userName}</h3>
              </div>
              <button onClick={() => { setMessageModal({ open: false, userId: null, userName: "" }); setMessageText("") }}
                className="text-white/50 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <textarea value={messageText} onChange={(e) => setMessageText(e.target.value)}
              placeholder="Escribe tu mensaje aquí..." rows={5}
              className="w-full px-4 py-3 rounded-xl text-white placeholder-white/30 mb-4 resize-none"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }} />
            <div className="flex gap-2">
              <Button onClick={sendMessageToUser} disabled={!messageText.trim()}
                className="flex-1 bg-gradient-to-r from-purple-600 to-purple-500 border-0">
                <Send className="h-4 w-4 mr-2" />Enviar
              </Button>
              <Button onClick={() => { setMessageModal({ open: false, userId: null, userName: "" }); setMessageText("") }}
                variant="outline" className="border-white/20 bg-transparent">Cancelar</Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Detalles del Usuario */}
      {detailsModal.open && detailsModal.user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)" }}>
          <div className="w-full max-w-3xl rounded-2xl my-8" style={{ background: "linear-gradient(160deg, #0d1022 0%, #080b14 100%)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold"
                  style={{ background: "linear-gradient(135deg, #001C55, #B744B8)" }}>
                  {detailsModal.user.first_name?.charAt(0)}{detailsModal.user.last_name?.charAt(0)}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">{detailsModal.user.first_name} {detailsModal.user.last_name}</h3>
                  <p className="text-white/50 text-sm">{detailsModal.user.email}</p>
                </div>
              </div>
              <button onClick={() => setDetailsModal({ open: false, user: null })}
                className="text-white/50 hover:text-white transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Información Básica */}
              <div>
                <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-400" />
                  Información Básica
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }}>
                    <p className="text-white/50 text-xs mb-1">Rol</p>
                    <p className="text-white font-semibold">
                      {detailsModal.user.role === 'admin' ? 'Administrador' : detailsModal.user.role === 'artist' ? 'Artista' : detailsModal.user.role === 'owner' ? 'Dueño de Local' : detailsModal.user.role}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }}>
                    <p className="text-white/50 text-xs mb-1">Teléfono</p>
                    <p className="text-white font-semibold">{detailsModal.user.phone || "No registrado"}</p>
                  </div>
                  <div className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }}>
                    <p className="text-white/50 text-xs mb-1">Calificación</p>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                      <p className="text-white font-semibold">{detailsModal.user.average_rating?.toFixed(1) || "N/A"}</p>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }}>
                    <p className="text-white/50 text-xs mb-1">Reseñas</p>
                    <p className="text-white font-semibold">{detailsModal.user.review_count || 0}</p>
                  </div>
                </div>
              </div>

              {/* Info Dueño */}
              {detailsModal.user.role === 'owner' && detailsModal.user.owner_profile && (
                <div>
                  <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    Información del Local
                  </h4>
                  <div className="p-4 rounded-xl space-y-3" style={{ background: "rgba(255,255,255,0.04)" }}>
                    <div>
                      <p className="text-white/50 text-xs mb-1">Nombre del Establecimiento</p>
                      <p className="text-white font-semibold">{detailsModal.user.owner_profile.business_name || "No especificado"}</p>
                    </div>
                    <div>
                      <p className="text-white/50 text-xs mb-1">Tipo</p>
                      <p className="text-white font-semibold">{detailsModal.user.owner_profile.venue_type || "No especificado"}</p>
                    </div>
                    <div>
                      <p className="text-white/50 text-xs mb-1">Dirección</p>
                      <p className="text-white font-semibold">{detailsModal.user.owner_profile.address || "No especificada"}</p>
                    </div>
                    <div>
                      <p className="text-white/50 text-xs mb-1">Capacidad</p>
                      <p className="text-white font-semibold">{detailsModal.user.owner_profile.capacity || "No especificada"}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Info Artista */}
              {detailsModal.user.role === 'artist' && detailsModal.user.artist_profile && (
                <div>
                  <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                    <Star className="h-5 w-5 text-purple-400" />
                    Información del Artista
                  </h4>
                  <div className="p-4 rounded-xl space-y-3" style={{ background: "rgba(255,255,255,0.04)" }}>
                    <div>
                      <p className="text-white/50 text-xs mb-1">Nombre Artístico</p>
                      <p className="text-white font-semibold">{detailsModal.user.artist_profile.stage_name || "No especificado"}</p>
                    </div>
                    <div>
                      <p className="text-white/50 text-xs mb-1">Categoría</p>
                      <p className="text-white font-semibold">{detailsModal.user.artist_profile.category || "No especificado"}</p>
                    </div>
                    <div>
                      <p className="text-white/50 text-xs mb-1">Años de Experiencia</p>
                      <p className="text-white font-semibold">{detailsModal.user.artist_profile.experience_years || "No especificado"}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Suscripción */}
              {(() => {
                const sub = detailsModal.user.subscription
                const subDays = sub?.days_remaining ?? -1
                return (
                  <div>
                    <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                      <Crown className="h-5 w-5 text-purple-400" />
                      Suscripción
                    </h4>
                    {sub ? (
                      <div className="space-y-3">
                        {/* Plan */}
                        <div className="flex items-center gap-3 p-4 rounded-xl"
                          style={{ background: "linear-gradient(135deg, rgba(183,68,184,0.15), rgba(0,28,85,0.15))", border: "1px solid rgba(183,68,184,0.3)" }}>
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: "linear-gradient(135deg, #B744B8, #7a1a8a)" }}>
                            <Crown className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="text-white font-bold text-sm">{sub.plan_name}</p>
                            <p className="text-white/50 text-xs">{sub.price}/mes · {sub.payment_method || "—"}</p>
                          </div>
                        </div>
                        {/* Días restantes */}
                        <div className={`flex items-center gap-3 p-3 rounded-xl ${subDays > 7 ? "bg-green-500/10 border border-green-500/25" : subDays > 0 ? "bg-amber-500/10 border border-amber-500/25" : "bg-red-500/10 border border-red-500/25"}`}>
                          <Clock className={`h-4 w-4 flex-shrink-0 ${subDays > 7 ? "text-green-400" : subDays > 0 ? "text-amber-400" : "text-red-400"}`} />
                          <div>
                            <p className={`font-bold text-sm ${subDays > 7 ? "text-green-300" : subDays > 0 ? "text-amber-300" : "text-red-300"}`}>
                              {subDays > 0 ? `${subDays} días restantes` : subDays === 0 ? "Expira hoy" : "Suscripción expirada"}
                            </p>
                            <p className="text-white/40 text-xs">
                              Vence: {new Date(sub.expires_at).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px dashed rgba(255,255,255,0.1)" }}>
                        <Package className="h-5 w-5 text-white/25" />
                        <div>
                          <p className="text-white/40 font-semibold text-sm">Sin suscripción activa</p>
                          <p className="text-white/25 text-xs">Plan gratuito</p>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* Reseñas */}
              {detailsModal.user.reviews && detailsModal.user.reviews.length > 0 && (
                <div>
                  <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-400" />
                    Reseñas Recibidas ({detailsModal.user.reviews.length})
                  </h4>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {detailsModal.user.reviews.map((rev: any) => (
                      <div key={rev.id} className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="flex">
                              {[...Array(rev.rating)].map((_, i) => (
                                <Star key={i} className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                              ))}
                            </div>
                            <span className="text-white/50 text-xs">{new Date(rev.created_at).toLocaleDateString('es-AR')}</span>
                          </div>
                        </div>
                        <p className="text-white/70 text-sm mb-2">{rev.comment}</p>
                        <p className="text-white/40 text-xs">Por: {rev.reviewer_name || "Usuario"}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 p-6 border-t" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
              <Button onClick={() => router.push(`/profile/${detailsModal.user.id}`)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 border-0">
                <ExternalLink className="h-4 w-4 mr-2" />Ver Perfil Público
              </Button>
              <Button onClick={() => { setDetailsModal({ open: false, user: null }); setMessageModal({ open: true, userId: detailsModal.user.id, userName: `${detailsModal.user.first_name} ${detailsModal.user.last_name}` }) }}
                className="flex-1 bg-purple-600 hover:bg-purple-700 border-0">
                <Send className="h-4 w-4 mr-2" />Enviar Mensaje
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Ver Imagen */}
      {imageModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setImageModal({ open: false, url: "" })}
          style={{ background: "rgba(0,0,0,0.9)", backdropFilter: "blur(6px)" }}>
          <div className="max-w-4xl max-h-[90vh] relative">
            <button onClick={() => setImageModal({ open: false, url: "" })}
              className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center text-white bg-black/50 hover:bg-black/70">
              <X className="h-6 w-6" />
            </button>
            <img src={imageModal.url} alt="Imagen adjunta" className="max-w-full max-h-[90vh] rounded-2xl" />
          </div>
        </div>
      )}
    </div>
  )
}
