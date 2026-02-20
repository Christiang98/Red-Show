"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getCurrentUser } from "@/lib/auth"
import {
  Shield,
  Users,
  AlertCircle,
  HelpCircle,
  CheckCircle,
  Calendar,
  ArrowLeft,
  Star,
  Eye,
  EyeOff,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

export default function AdminManagement() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [reports, setReports] = useState<any[]>([])
  const [tickets, setTickets] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [reviews, setReviews] = useState<any[]>([])

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser || currentUser.role !== "admin") {
      alert("Acceso denegado. Solo administradores pueden acceder a esta página.")
      router.push("/dashboard")
      return
    }
    setUser(currentUser)
    loadAdminData()
  }, [])

  const loadAdminData = async () => {
    setLoading(true)
    try {
      const [reportsRes, ticketsRes, usersRes, bookingsRes, reviewsRes] = await Promise.all([
        fetch(`/api/reports?isAdmin=true`),
        fetch(`/api/support?isAdmin=true`),
        fetch(`/api/admin/users`),
        fetch(`/api/admin/bookings?isAdmin=true`),
        fetch(`/api/admin/reviews`),
      ])

      const reportsData = await reportsRes.json()
      const ticketsData = await ticketsRes.json()
      const usersData = await usersRes.json()
      const bookingsData = await bookingsRes.json()
      const reviewsData = await reviewsRes.json()

      setReports(reportsData.reports || [])
      setTickets(ticketsData.tickets || [])
      setUsers(usersData.users || [])
      setBookings(bookingsData.bookings || [])
      setReviews(reviewsData.reviews || [])
    } catch (error) {
      console.error("[v0] Error cargando datos de admin:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleReportAction = async (reportId: number, status: string, notes?: string) => {
    try {
      const response = await fetch(`/api/admin/reports`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, status, adminNotes: notes }),
      })

      if (response.ok) {
        alert("Reporte actualizado")
        loadAdminData()
      } else {
        alert("Error actualizando reporte")
      }
    } catch (error) {
      console.error("[v0] Error:", error)
    }
  }

  const handleTicketAction = async (ticketId: number, status: string, response?: string) => {
    try {
      const res = await fetch(`/api/admin/support`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId, status, adminResponse: response }),
      })

      if (res.ok) {
        alert("Ticket actualizado")
        loadAdminData()
      } else {
        alert("Error actualizando ticket")
      }
    } catch (error) {
      console.error("[v0] Error:", error)
    }
  }

  const handleUserAction = async (userId: number, action: string) => {
    const confirmMessages: Record<string, string> = {
      delete: "¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.",
      disable: "¿Deseas deshabilitar esta cuenta? El usuario no podrá acceder al sistema.",
      suspend: "¿Deseas suspender los perfiles de este usuario? Se despublicarán todos sus perfiles.",
    }

    if (confirmMessages[action] && !confirm(confirmMessages[action])) {
      return
    }

    try {
      const response = await fetch(`/api/admin/users`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action }),
      })

      if (response.ok) {
        const actionText =
          action === "disable"
            ? "deshabilitado"
            : action === "enable"
              ? "habilitado"
              : action === "verify"
                ? "verificado"
                : action === "unverify"
                  ? "desverificado"
                  : action

        alert(`Usuario ${actionText}`)
        loadAdminData()
      } else {
        alert("Error ejecutando acción")
      }
    } catch (error) {
      console.error("[v0] Error:", error)
    }
  }

  const handleBookingAction = async (bookingId: number, action: string) => {
    if (
      action === "cancel" &&
      !confirm("¿Estás seguro de cancelar esta contratación? Esta acción no se puede deshacer.")
    ) {
      return
    }

    try {
      const response = await fetch(`/api/admin/bookings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, action }),
      })

      if (response.ok) {
        alert(`Contratación ${action === "cancel" ? "cancelada" : "completada"}`)
        loadAdminData()
      } else {
        alert("Error ejecutando acción")
      }
    } catch (error) {
      console.error("[v0] Error:", error)
    }
  }

  const handleReviewAction = async (reviewId: number, action: string) => {
    if (action === "delete" && !confirm("¿Estás seguro de eliminar esta reseña permanentemente?")) {
      return
    }

    try {
      const response = await fetch(`/api/admin/reviews`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId, action }),
      })

      if (response.ok) {
        alert(`Reseña ${action === "hide" ? "ocultada" : action === "show" ? "mostrada" : "eliminada"}`)
        loadAdminData()
      } else {
        alert("Error ejecutando acción")
      }
    } catch (error) {
      console.error("[v0] Error:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Cargando panel de gestión...</p>
      </div>
    )
  }

  const pendingReports = reports.filter((r) => r.status === "pending")
  const openTickets = tickets.filter((t) => t.status === "open" || t.status === "in_progress")
  const activeBookings = bookings.filter((b) => b.status === "pending" || b.status === "accepted")
  const activeUsers = users.filter((u) => u.is_active !== 0)
  const hiddenReviews = reviews.filter((r) => !r.is_visible)

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-r from-primary to-secondary text-primary-foreground py-8 px-4">
        <div className="container mx-auto max-w-7xl">
          <Button
            variant="ghost"
            className="text-primary-foreground hover:bg-primary-foreground/10 mb-4"
            onClick={() => router.push("/admin")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Panel Principal
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8" />
            <h1 className="text-3xl font-bold">Gestión Detallada del Sistema</h1>
          </div>
          <p className="text-primary-foreground/80">
            Administración completa de usuarios, contrataciones, reseñas, reportes y soporte
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="grid md:grid-cols-6 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Usuarios Activos</p>
                <p className="text-3xl font-bold text-primary">{activeUsers.length}</p>
                <p className="text-xs text-muted-foreground mt-1">de {users.length} totales</p>
              </div>
              <Users className="h-8 w-8 text-primary/60" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Contrataciones</p>
                <p className="text-3xl font-bold text-blue-600">{activeBookings.length}</p>
                <p className="text-xs text-muted-foreground mt-1">activas</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600/60" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Reseñas</p>
                <p className="text-3xl font-bold text-yellow-600">{reviews.length}</p>
                <p className="text-xs text-muted-foreground mt-1">{hiddenReviews.length} ocultas</p>
              </div>
              <Star className="h-8 w-8 text-yellow-600/60" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Reportes</p>
                <p className="text-3xl font-bold text-destructive">{pendingReports.length}</p>
                <p className="text-xs text-muted-foreground mt-1">pendientes</p>
              </div>
              <AlertCircle className="h-8 w-8 text-destructive/60" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tickets</p>
                <p className="text-3xl font-bold text-secondary">{openTickets.length}</p>
                <p className="text-xs text-muted-foreground mt-1">abiertos</p>
              </div>
              <HelpCircle className="h-8 w-8 text-secondary/60" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Perfiles</p>
                <p className="text-3xl font-bold text-green-600">
                  {users.filter((u) => u.artist_published || u.owner_published).length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">publicados</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600/60" />
            </div>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full md:w-auto grid-cols-5">
            <TabsTrigger value="users">Usuarios ({users.length})</TabsTrigger>
            <TabsTrigger value="bookings">Contrataciones ({bookings.length})</TabsTrigger>
            <TabsTrigger value="reviews">Reseñas ({reviews.length})</TabsTrigger>
            <TabsTrigger value="reports">Reportes ({pendingReports.length})</TabsTrigger>
            <TabsTrigger value="support">Soporte ({openTickets.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">Gestión de Usuarios</h2>
              {users.length === 0 ? (
                <p className="text-muted-foreground">No hay usuarios</p>
              ) : (
                <div className="space-y-4">
                  {users.map((usr) => (
                    <Card key={usr.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-foreground">
                              {usr.first_name} {usr.last_name}
                            </p>
                            {usr.verified && <CheckCircle className="h-4 w-4 text-green-600" />}
                            {usr.is_active === 0 && (
                              <Badge variant="destructive" className="text-xs">
                                DESHABILITADO
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{usr.email}</p>
                          <div className="flex gap-2 mt-2 flex-wrap">
                            <Badge variant="outline" className="capitalize">
                              {usr.role}
                            </Badge>
                            {usr.artist_published && <Badge className="bg-green-600">Artista Publicado</Badge>}
                            {usr.owner_published && <Badge className="bg-blue-600">Local Publicado</Badge>}
                            {usr.artist_name && (
                              <Badge variant="secondary">
                                {usr.artist_name} - {usr.artist_category}
                              </Badge>
                            )}
                            {usr.business_name && (
                              <Badge variant="secondary">
                                {usr.business_name} - {usr.business_type}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 flex-wrap justify-end">
                          {usr.is_active !== 0 ? (
                            <>
                              {!usr.verified && (
                                <Button size="sm" variant="outline" onClick={() => handleUserAction(usr.id, "verify")}>
                                  Verificar
                                </Button>
                              )}
                              {usr.verified && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUserAction(usr.id, "unverify")}
                                >
                                  Quitar Verificación
                                </Button>
                              )}
                              {(usr.artist_published || usr.owner_published) && (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => handleUserAction(usr.id, "suspend")}
                                >
                                  Suspender Perfiles
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleUserAction(usr.id, "disable")}
                              >
                                Deshabilitar Cuenta
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              className="bg-green-600"
                              onClick={() => handleUserAction(usr.id, "enable")}
                            >
                              Habilitar Cuenta
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="bookings">
            <Card className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">Gestión de Contrataciones</h2>
              {bookings.length === 0 ? (
                <p className="text-muted-foreground">No hay contrataciones registradas</p>
              ) : (
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <Card key={booking.id} className="p-4 border-l-4 border-l-blue-500">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-semibold text-foreground">
                            {booking.owner_business_name || `${booking.owner_first_name} ${booking.owner_last_name}`} →{" "}
                            {booking.artist_stage_name || `${booking.artist_first_name} ${booking.artist_last_name}`}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Dueño: {booking.owner_email} | Artista: {booking.artist_email}
                          </p>
                        </div>
                        <Badge
                          className={
                            booking.status === "pending"
                              ? "bg-yellow-500"
                              : booking.status === "accepted"
                                ? "bg-green-500"
                                : booking.status === "rejected"
                                  ? "bg-red-500"
                                  : booking.status === "completed"
                                    ? "bg-blue-500"
                                    : "bg-gray-500"
                          }
                        >
                          {booking.status}
                        </Badge>
                      </div>
                      <div className="mb-3">
                        <p className="text-sm font-medium text-foreground">Fecha: {booking.event_date}</p>
                        <p className="text-sm text-muted-foreground mt-1">{booking.message || "Sin mensaje"}</p>
                      </div>
                      {(booking.status === "pending" || booking.status === "accepted") && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleBookingAction(booking.id, "complete")}
                          >
                            Marcar Completada
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleBookingAction(booking.id, "cancel")}
                          >
                            Cancelar Contratación
                          </Button>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="reviews">
            <Card className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">Gestión de Reseñas</h2>
              {reviews.length === 0 ? (
                <p className="text-muted-foreground">No hay reseñas registradas</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <Card
                      key={review.id}
                      className={`p-4 border-l-4 ${review.is_visible ? "border-l-green-500" : "border-l-gray-400"}`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-foreground">
                              {review.reviewer_first_name} {review.reviewer_last_name}
                            </p>
                            <span className="text-muted-foreground">→</span>
                            <p className="font-semibold text-foreground">
                              {review.reviewed_artist_name ||
                                review.reviewed_business_name ||
                                `${review.reviewed_first_name} ${review.reviewed_last_name}`}
                            </p>
                            {!review.is_visible && (
                              <Badge variant="secondary" className="gap-1">
                                <EyeOff className="h-3 w-3" /> Oculta
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {review.reviewer_email} → {review.reviewed_email}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: review.rating }).map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                          ))}
                        </div>
                      </div>
                      <div className="mb-3">
                        <p className="text-sm text-foreground">{review.comment || "Sin comentario"}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(review.created_at).toLocaleDateString("es-AR")}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {review.is_visible ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 bg-transparent"
                            onClick={() => handleReviewAction(review.id, "hide")}
                          >
                            <EyeOff className="h-4 w-4" /> Ocultar
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 bg-transparent"
                            onClick={() => handleReviewAction(review.id, "show")}
                          >
                            <Eye className="h-4 w-4" /> Mostrar
                          </Button>
                        )}
                        <Button size="sm" variant="destructive" onClick={() => handleReviewAction(review.id, "delete")}>
                          Eliminar
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <Card className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">Reportes de Usuarios</h2>
              {reports.length === 0 ? (
                <p className="text-muted-foreground">No hay reportes registrados</p>
              ) : (
                <div className="space-y-4">
                  {reports.map((report) => (
                    <Card key={report.id} className="p-4 border-l-4 border-l-destructive">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-semibold text-foreground">
                            {report.reporter_first_name} {report.reporter_last_name} reportó a{" "}
                            {report.reported_first_name} {report.reported_last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">{report.reporter_email}</p>
                        </div>
                        <Badge
                          className={
                            report.status === "pending"
                              ? "bg-yellow-500"
                              : report.status === "resolved"
                                ? "bg-green-500"
                                : "bg-gray-500"
                          }
                        >
                          {report.status}
                        </Badge>
                      </div>
                      <div className="mb-3">
                        <p className="text-sm font-medium text-foreground">Motivo: {report.reason}</p>
                        <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
                      </div>
                      {report.status === "pending" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReportAction(report.id, "under_review")}
                          >
                            Revisar
                          </Button>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleReportAction(report.id, "resolved", "Reporte revisado y resuelto")}
                          >
                            Resolver
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReportAction(report.id, "dismissed", "Reporte descartado")}
                          >
                            Descartar
                          </Button>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="support">
            <Card className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">Tickets de Soporte</h2>
              {tickets.length === 0 ? (
                <p className="text-muted-foreground">No hay tickets de soporte registrados</p>
              ) : (
                <div className="space-y-4">
                  {tickets.map((ticket) => (
                    <Card key={ticket.id} className="p-4 border-l-4 border-l-secondary">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-semibold text-foreground">{ticket.subject}</p>
                          <p className="text-sm text-muted-foreground">
                            {ticket.first_name} {ticket.last_name} - {ticket.email}
                          </p>
                        </div>
                        <div className="flex gap-2 items-center">
                          <Badge
                            className={
                              ticket.priority === "urgent"
                                ? "bg-red-500"
                                : ticket.priority === "high"
                                  ? "bg-orange-500"
                                  : "bg-blue-500"
                            }
                          >
                            {ticket.priority}
                          </Badge>
                          <Badge
                            className={
                              ticket.status === "open"
                                ? "bg-yellow-500"
                                : ticket.status === "resolved"
                                  ? "bg-green-500"
                                  : ticket.status === "closed"
                                    ? "bg-gray-500"
                                    : "bg-blue-500"
                            }
                          >
                            {ticket.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="mb-3">
                        <p className="text-sm font-medium text-foreground">Categoría: {ticket.category}</p>
                        <p className="text-sm text-muted-foreground mt-1">{ticket.message}</p>
                        {ticket.admin_response && (
                          <div className="mt-2 p-2 bg-secondary/10 rounded">
                            <p className="text-xs font-medium text-foreground">Respuesta Admin:</p>
                            <p className="text-sm text-muted-foreground">{ticket.admin_response}</p>
                          </div>
                        )}
                      </div>
                      {(ticket.status === "open" || ticket.status === "in_progress") && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTicketAction(ticket.id, "in_progress")}
                          >
                            En Progreso
                          </Button>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() =>
                              handleTicketAction(ticket.id, "resolved", "Ticket resuelto por el equipo de soporte")
                            }
                          >
                            Resolver
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => handleTicketAction(ticket.id, "closed")}>
                            Cerrar
                          </Button>
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
