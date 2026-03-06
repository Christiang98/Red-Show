"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { getCurrentUser, logoutUser } from "@/lib/auth"
import {
  Shield, Users, AlertCircle, HelpCircle, CheckCircle, Calendar,
  ArrowRight, Star, Eye, EyeOff, Send, MessageSquare, XCircle,
  Check, Clock, Ban, Trash2, Mail
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

  // Message modal state
  const [messageModal, setMessageModal] = useState<{open: boolean; userId: number | null; type: 'report' | 'ticket' | null; itemId: number | null}>({
    open: false, userId: null, type: null, itemId: null
  })
  const [messageText, setMessageText] = useState("")

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser || currentUser.role !== "admin") {
      alert("Acceso denegado. Solo administradores.")
      router.push("/dashboard")
      return
    }
    setUser(currentUser)
    loadAllData()
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
    } finally {
      setLoading(false)
    }
  }

  const sendMessageToUser = async () => {
    if (!messageText.trim() || !messageModal.userId) return
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: messageModal.userId,
          type: messageModal.type === 'report' ? 'report_update' : 'support_update',
          title: messageModal.type === 'report' ? 'Actualización de tu reporte' : 'Respuesta de soporte',
          message: messageText,
          relatedId: messageModal.itemId,
          relatedType: messageModal.type,
        })
      })
      toast({ title: "Mensaje enviado al usuario" })
      setMessageModal({ open: false, userId: null, type: null, itemId: null })
      setMessageText("")
    } catch (e) {
      toast({ title: "Error enviando mensaje", variant: "destructive" })
    }
  }

  const updateReportStatus = async (reportId: number, status: string, userId: number) => {
    try {
      await fetch(`/api/admin/reports`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, status })
      })
      toast({ title: "Reporte actualizado" })
      loadAllData()
      if (status === "resolved") {
        setMessageModal({ open: true, userId, type: 'report', itemId: reportId })
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
      if (status === "resolved") {
        setMessageModal({ open: true, userId, type: 'ticket', itemId: ticketId })
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
              <img 
                src="/logo-redshow.png" 
                alt="Red Show Admin" 
                className="h-16 w-auto object-contain"
              />
              <div>
                <h1 className="text-3xl font-black text-white">Panel de Administración</h1>
                <p className="text-white/80 text-sm">Gestión completa de Red Show</p>
              </div>
            </div>
            <Button onClick={logoutUser} variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20 bg-transparent">
              Cerrar Sesión
            </Button>
          </div>
          <div className="flex items-center gap-2 text-white/70 text-sm">
            <CheckCircle className="h-4 w-4" />
            <span>Sesión: <strong className="text-white">{user?.firstName} {user?.lastName}</strong> ({user?.email})</span>
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
              <div className="flex items-center justify-between mb-2">
                <Icon className="h-8 w-8" style={{ color }} />
              </div>
              <p className="text-3xl font-black mb-1" style={{ color }}>{value}</p>
              <p className="text-white/50 text-xs font-semibold uppercase tracking-wider">{label}</p>
            </div>
          ))}
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6 p-1 h-auto"
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
          </TabsList>

          {/* USUARIOS */}
          <TabsContent value="overview" className="space-y-3">
            <h3 className="text-xl font-bold text-white mb-4">Usuarios del Sistema</h3>
            {users.map((u: any) => (
              <div 
                key={u.id} 
                className="rounded-xl p-4 border cursor-pointer hover:border-purple-500/50 transition-all" 
                style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.1)" }}
                onClick={() => {
                  // Abrir modal con detalles del usuario
                  const userStats = {
                    ...u,
                    avgRating: reviews.filter((r: any) => r.reviewee_id === u.id)
                      .reduce((acc: number, r: any) => acc + r.rating, 0) / 
                      Math.max(reviews.filter((r: any) => r.reviewee_id === u.id).length, 1) || 0,
                    reviewCount: reviews.filter((r: any) => r.reviewee_id === u.id).length,
                    bookingCount: bookings.filter((b: any) => 
                      b.artist_id === u.id || b.owner_id === u.id
                    ).length
                  }
                  // Mostrar modal
                  alert(`Usuario: ${u.first_name} ${u.last_name}
Email: ${u.email}
Rol: ${u.role}
Calificación: ${userStats.avgRating.toFixed(1)} ⭐
Reseñas: ${userStats.reviewCount}
Contrataciones: ${userStats.bookingCount}

Acciones disponibles:
- Ver perfil: /profile/${u.id}
- Enviar mensaje
- Suspender cuenta
- Dar de baja`)
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                      {u.first_name?.charAt(0)}{u.last_name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{u.first_name} {u.last_name}</p>
                      <p className="text-white/50 text-sm">{u.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                        <span className="text-xs text-white/70">
                          {(reviews.filter((r: any) => r.reviewee_id === u.id)
                            .reduce((acc: number, r: any) => acc + r.rating, 0) / 
                            Math.max(reviews.filter((r: any) => r.reviewee_id === u.id).length, 1) || 0).toFixed(1)}
                        </span>
                        <span className="text-xs text-white/50">
                          ({reviews.filter((r: any) => r.reviewee_id === u.id).length} reseñas)
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge className={u.role === 'admin' ? 'bg-purple-500' : u.role === 'artist' ? 'bg-blue-500' : 'bg-green-500'}>
                      {u.role === 'owner' ? 'Dueño' : u.role === 'artist' ? 'Artista' : u.role}
                    </Badge>
                    <span className="text-xs text-white/50">
                      {bookings.filter((b: any) => b.artist_id === u.id || b.owner_id === u.id).length} contrataciones
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>

          {/* CONTRATACIONES */}
          <TabsContent value="bookings" className="space-y-3">
            <h3 className="text-xl font-bold text-white mb-4">Contrataciones</h3>
            {bookings.length === 0 ? (
              <div className="rounded-xl p-8 text-center border" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.1)" }}>
                <Calendar className="h-12 w-12 mx-auto mb-3 text-white/30" />
                <p className="text-white/50">No hay contrataciones registradas</p>
              </div>
            ) : (
              bookings.map((b: any) => {
                const requester = users.find((u: any) => u.id === b.artist_id || u.id === b.owner_id)
                const provider = users.find((u: any) => u.id !== b.artist_id && u.id !== b.owner_id && (u.id === b.artist_id || u.id === b.owner_id))
                
                return (
                  <div key={b.id} className="rounded-xl p-5 border" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.1)" }}>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-bold text-lg text-white mb-1">
                          Contratación #{b.id}
                        </h4>
                        <p className="text-xs text-white/50">
                          Creada: {new Date(b.created_at).toLocaleDateString('es-AR')}
                        </p>
                      </div>
                      <Badge className={
                        b.status === 'accepted' ? 'bg-green-500' :
                        b.status === 'rejected' ? 'bg-red-500' :
                        b.status === 'completed' ? 'bg-blue-500' :
                        'bg-yellow-500'
                      }>
                        {b.status === 'pending' ? '⏳ Pendiente' :
                         b.status === 'accepted' ? '✅ Aceptada' :
                         b.status === 'rejected' ? '❌ Rechazada' :
                         b.status === 'completed' ? '✓ Concluida' : b.status}
                      </Badge>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-xs font-medium text-white/70 mb-1">Solicitante:</p>
                        <p className="text-sm text-white">
                          {users.find((u: any) => u.id === (b.requester_id || b.artist_id))?.first_name || 'Usuario'} {users.find((u: any) => u.id === (b.requester_id || b.artist_id))?.last_name || ''}
                        </p>
                        <p className="text-xs text-white/50">
                          {users.find((u: any) => u.id === (b.requester_id || b.artist_id))?.email || ''}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-white/70 mb-1">Contratado:</p>
                        <p className="text-sm text-white">
                          {users.find((u: any) => u.id === (b.provider_id || b.owner_id))?.first_name || 'Usuario'} {users.find((u: any) => u.id === (b.provider_id || b.owner_id))?.last_name || ''}
                        </p>
                        <p className="text-xs text-white/50">
                          {users.find((u: any) => u.id === (b.provider_id || b.owner_id))?.email || ''}
                        </p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-3 mb-3">
                      <div className="rounded-lg p-3" style={{ background: "rgba(59,130,246,0.1)" }}>
                        <p className="text-xs text-blue-300 mb-1">📅 Fecha del Evento</p>
                        <p className="text-sm font-semibold text-white">
                          {b.event_date ? new Date(b.event_date).toLocaleDateString('es-AR') : 'No especificada'}
                        </p>
                      </div>
                      <div className="rounded-lg p-3" style={{ background: "rgba(139,92,246,0.1)" }}>
                        <p className="text-xs text-purple-300 mb-1">🕐 Horario</p>
                        <p className="text-sm font-semibold text-white">
                          {b.event_time || 'No especificado'}
                        </p>
                      </div>
                      {b.proposed_price && (
                        <div className="rounded-lg p-3" style={{ background: "rgba(236,72,153,0.1)" }}>
                          <p className="text-xs text-pink-300 mb-1">💰 Precio Propuesto</p>
                          <p className="text-sm font-semibold text-white">
                            ${b.proposed_price?.toLocaleString('es-AR')}
                          </p>
                        </div>
                      )}
                    </div>

                    {b.message && (
                      <div className="rounded-lg p-3 mt-3" style={{ background: "rgba(255,255,255,0.05)" }}>
                        <p className="text-xs text-white/50 mb-1">Mensaje:</p>
                        <p className="text-sm text-white/80 italic">"{b.message}"</p>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </TabsContent>

          {/* REPORTES */}
          <TabsContent value="reports" className="space-y-3">
            <h3 className="text-xl font-bold text-white mb-4">Reportes de Usuarios</h3>
            {reports.map((r: any) => (
              <div key={r.id} className="rounded-xl p-5 border" style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.2)" }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={r.status === 'pending' ? 'bg-yellow-500' : r.status === 'resolved' ? 'bg-green-500' : 'bg-gray-500'}>
                        {r.status}
                      </Badge>
                      <span className="text-white/50 text-xs">{new Date(r.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="font-semibold text-white mb-1">Razón: {r.reason}</p>
                    <p className="text-white/60 text-sm">{r.description}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" onClick={() => updateReportStatus(r.id, 'resolved', r.reporter_id)}
                    className="bg-green-600 hover:bg-green-700 border-0">
                    <Check className="h-3.5 w-3.5 mr-1.5" /> Resolver
                  </Button>
                  <Button size="sm" onClick={() => updateReportStatus(r.id, 'dismissed', r.reporter_id)}
                    variant="outline" className="border-white/20 text-white/70 bg-transparent">
                    <XCircle className="h-3.5 w-3.5 mr-1.5" /> Descartar
                  </Button>
                  <Button size="sm" onClick={() => setMessageModal({ open: true, userId: r.reporter_id, type: 'report', itemId: r.id })}
                    className="bg-purple-600 hover:bg-purple-700 border-0">
                    <Send className="h-3.5 w-3.5 mr-1.5" /> Mensaje
                  </Button>
                </div>
              </div>
            ))}
          </TabsContent>

          {/* SOPORTE */}
          <TabsContent value="support" className="space-y-3">
            <h3 className="text-xl font-bold text-white mb-4">Tickets de Soporte</h3>
            {tickets.map((t: any) => (
              <div key={t.id} className="rounded-xl p-5 border" style={{ background: "rgba(168,85,247,0.08)", borderColor: "rgba(168,85,247,0.2)" }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={t.status === 'open' ? 'bg-yellow-500' : t.status === 'resolved' ? 'bg-green-500' : 'bg-blue-500'}>
                        {t.status}
                      </Badge>
                      <span className="text-white/50 text-xs">{new Date(t.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="font-semibold text-white mb-1">Asunto: {t.subject}</p>
                    <p className="text-white/60 text-sm">{t.message}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" onClick={() => updateTicketStatus(t.id, 'resolved', t.user_id)}
                    className="bg-green-600 hover:bg-green-700 border-0">
                    <Check className="h-3.5 w-3.5 mr-1.5" /> Resolver
                  </Button>
                  <Button size="sm" onClick={() => updateTicketStatus(t.id, 'in_progress', t.user_id)}
                    className="bg-blue-600 hover:bg-blue-700 border-0">
                    <Clock className="h-3.5 w-3.5 mr-1.5" /> En proceso
                  </Button>
                  <Button size="sm" onClick={() => setMessageModal({ open: true, userId: t.user_id, type: 'ticket', itemId: t.id })}
                    className="bg-purple-600 hover:bg-purple-700 border-0">
                    <Send className="h-3.5 w-3.5 mr-1.5" /> Mensaje
                  </Button>
                </div>
              </div>
            ))}
          </TabsContent>

          {/* RESEÑAS */}
          <TabsContent value="reviews" className="space-y-3">
            <h3 className="text-xl font-bold text-white mb-4">Reseñas del Sistema</h3>
            {reviews.length === 0 ? (
              <div className="rounded-xl p-8 text-center border" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.1)" }}>
                <Star className="h-12 w-12 mx-auto mb-3 text-white/30" />
                <p className="text-white/50">No hay reseñas registradas</p>
              </div>
            ) : (
              reviews.map((rev: any) => {
                const reviewer = users.find((u: any) => u.id === rev.reviewer_id)
                const reviewee = users.find((u: any) => u.id === rev.reviewee_id)
                
                return (
                  <div key={rev.id} className="rounded-xl p-5 border" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.1)" }}>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-bold text-lg text-white mb-1">
                          Reseña #{rev.id}
                        </h4>
                        <p className="text-xs text-white/50">
                          {new Date(rev.created_at).toLocaleDateString('es-AR', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </p>
                      </div>
                      <Badge className={rev.is_visible ? 'bg-green-500' : 'bg-gray-600'}>
                        {rev.is_visible ? '👁️ Visible' : '👁️‍🗨️ Oculta'}
                      </Badge>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div className="rounded-lg p-3" style={{ background: "rgba(59,130,246,0.1)" }}>
                        <p className="text-xs text-blue-300 mb-1">Autor de la reseña:</p>
                        <p className="text-sm font-semibold text-white">
                          {reviewer?.first_name} {reviewer?.last_name}
                        </p>
                        <p className="text-xs text-white/50">{reviewer?.email}</p>
                      </div>
                      <div className="rounded-lg p-3" style={{ background: "rgba(236,72,153,0.1)" }}>
                        <p className="text-xs text-pink-300 mb-1">Reseña dirigida a:</p>
                        <p className="text-sm font-semibold text-white">
                          {reviewee?.first_name} {reviewee?.last_name}
                        </p>
                        <p className="text-xs text-white/50">{reviewee?.email}</p>
                        {reviewee && (
                          <a 
                            href={`/profile/${reviewee.id}`} 
                            target="_blank"
                            className="text-xs text-blue-400 hover:text-blue-300 hover:underline mt-1 inline-block"
                          >
                            Ver perfil →
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-xs font-medium text-white/70 mb-2">Calificación:</p>
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star} 
                              className={`h-5 w-5 ${
                                star <= rev.rating 
                                  ? 'fill-yellow-400 text-yellow-400' 
                                  : 'fill-gray-600 text-gray-600'
                              }`} 
                            />
                          ))}
                        </div>
                        <span className="text-lg font-bold text-white">
                          {rev.rating}/5
                        </span>
                      </div>
                    </div>

                    {rev.comment && (
                      <div className="rounded-lg p-4 mb-4" style={{ background: "rgba(139,92,246,0.1)" }}>
                        <p className="text-xs text-purple-300 mb-2">💬 Comentario:</p>
                        <p className="text-sm text-white/90 italic leading-relaxed">
                          "{rev.comment}"
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2 justify-end">
                      <Button 
                        size="sm" 
                        onClick={() => toggleReviewVisibility(rev.id, rev.is_visible)}
                        variant="outline" 
                        className="border-white/20 bg-transparent hover:bg-white/5"
                      >
                        {rev.is_visible ? (
                          <>
                            <EyeOff className="h-4 w-4 mr-2" />
                            Ocultar Reseña
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-2" />
                            Mostrar Reseña
                          </>
                        )}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => {
                          if (confirm('¿Estás seguro de eliminar esta reseña permanentemente? Esta acción no se puede deshacer.')) {
                            // Llamar a la API para eliminar
                            fetch(`/api/admin/reviews`, {
                              method: 'DELETE',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ reviewId: rev.id })
                            }).then(() => {
                              toast({ title: "Reseña eliminada" })
                              loadAllData()
                            })
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                )
              })
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Message Modal */}
      {messageModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)" }}>
          <div className="w-full max-w-lg rounded-2xl p-6" style={{ background: "linear-gradient(160deg, #0d1022 0%, #080b14 100%)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="flex items-center gap-3 mb-4">
              <Mail className="h-6 w-6 text-purple-400" />
              <h3 className="text-xl font-bold text-white">Enviar mensaje al usuario</h3>
            </div>
            <textarea value={messageText} onChange={(e) => setMessageText(e.target.value)}
              placeholder="Escribe tu mensaje aquí..." rows={5}
              className="w-full px-4 py-3 rounded-xl text-white placeholder-white/30 mb-4 resize-none"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }} />
            <div className="flex gap-2">
              <Button onClick={sendMessageToUser} disabled={!messageText.trim()}
                className="flex-1 bg-gradient-to-r from-purple-600 to-purple-500 border-0">
                <Send className="h-4 w-4 mr-2" /> Enviar
              </Button>
              <Button onClick={() => { setMessageModal({ open: false, userId: null, type: null, itemId: null }); setMessageText("") }}
                variant="outline" className="border-white/20 bg-transparent">
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
