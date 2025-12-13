"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AppNavbar } from "@/components/navigation/app-navbar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getCurrentUser } from "@/lib/auth"
import { Shield, Users, AlertCircle, HelpCircle, CheckCircle, Calendar, Star, Trash2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

export default function AdminPanel() {
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
      // Cargar reportes
      const reportsRes = await fetch(`/api/reports?isAdmin=true`)
      const reportsData = await reportsRes.json()
      setReports(reportsData.reports || [])

      // Cargar tickets
      const ticketsRes = await fetch(`/api/support?isAdmin=true`)
      const ticketsData = await ticketsRes.json()
      setTickets(ticketsData.tickets || [])

      // Cargar usuarios
      const usersRes = await fetch(`/api/admin/users`)
      const usersData = await usersRes.json()
      setUsers(usersData.users || [])

      // Cargar contrataciones
      const bookingsRes = await fetch(`/api/admin/bookings?isAdmin=true`)
      const bookingsData = await bookingsRes.json()
      setBookings(bookingsData.bookings || [])

      const reviewsRes = await fetch(`/api/admin/reviews`)
      const reviewsData = await reviewsRes.json()
      setReviews(reviewsData.reviews || [])
    } catch (error) {
      console.error("Error cargando datos de admin:", error)
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
      console.error("Error:", error)
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
      console.error("Error:", error)
    }
  }

  const handleUserAction = async (userId: number, action: string) => {
    if (action === "delete" && !confirm("¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.")) {
      return
    }

    try {
      const response = await fetch(`/api/admin/users`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action }),
      })

      if (response.ok) {
        alert(`Usuario ${action === "verify" ? "verificado" : action === "suspend" ? "suspendido" : "eliminado"}`)
        loadAdminData()
      } else {
        alert("Error ejecutando acción")
      }
    } catch (error) {
      console.error("Error:", error)
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
      console.error("Error:", error)
    }
  }

  const handleDeleteReview = async (reviewId: number) => {
    if (!confirm("¿Estás seguro de eliminar esta reseña? Esta acción no se puede deshacer.")) {
      return
    }

    try {
      const response = await fetch(`/api/admin/reviews?reviewId=${reviewId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        alert("Reseña eliminada")
        loadAdminData()
      } else {
        alert("Error eliminando reseña")
      }
    } catch (error) {
      console.error("Error:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Cargando panel de administración...</p>
      </div>
    )
  }

  const pendingReports = reports.filter((r) => r.status === "pending")
  const openTickets = tickets.filter((t) => t.status === "open" || t.status === "in_progress")
  const activeBookings = bookings.filter((b) => b.status === "pending" || b.status === "accepted")
  const activeUsers = users.filter((u) => u.artist_published || u.owner_published)

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />

      <div className="bg-gradient-to-r from-primary to-secondary text-primary-foreground py-8 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8" />
            <h1 className="text-3xl font-bold">Panel de Administración</h1>
          </div>
          <p className="text-primary-foreground/80">Gestión completa de la plataforma Red Show</p>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 py-8">
        {/* Estadísticas */}
        <div className="grid md:grid-cols-6 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Usuarios</p>
                <p className="text-3xl font-bold text-primary">{users.length}</p>
              </div>
              <Users className="h-8 w-8 text-primary/60" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Reportes</p>
                <p className="text-3xl font-bold text-destructive">{pendingReports.length}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-destructive/60" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tickets</p>
                <p className="text-3xl font-bold text-secondary">{openTickets.length}</p>
              </div>
              <HelpCircle className="h-8 w-8 text-secondary/60" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Contrataciones</p>
                <p className="text-3xl font-bold text-blue-600">{activeBookings.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600/60" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Perfiles Activos</p>
                <p className="text-3xl font-bold text-green-600">{activeUsers.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600/60" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Reseñas</p>
                <p className="text-3xl font-bold text-yellow-600">{reviews.length}</p>
              </div>
              <Star className="h-8 w-8 text-yellow-600/60" />
            </div>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full md:w-auto grid-cols-5">
            <TabsTrigger value="users">Usuarios ({users.length})</TabsTrigger>
            <TabsTrigger value="bookings">Contrataciones ({activeBookings.length})</TabsTrigger>
            <TabsTrigger value="reviews">Reseñas ({reviews.length})</TabsTrigger>
            <TabsTrigger value="reports">Reportes ({pendingReports.length})</TabsTrigger>
            <TabsTrigger value="support">Soporte ({openTickets.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">Gestión de Usuarios</h2>
              {users.length === 0 ? (
                <p className="text-muted-foreground">No hay usuarios registrados</p>
              ) : (
                <div className="space-y-4">
                  {users.map((usr) => (
                    <Card key={usr.id} className="p-4 hover:border-primary/50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-foreground">
                              {usr.first_name} {usr.last_name}
                            </p>
                            {usr.verified && usr.verified !== 0 && usr.verified !== "0" && (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{usr.email}</p>
                          <div className="flex gap-2 flex-wrap">
                            {usr.role && usr.role !== 0 && usr.role !== "0" && (
                              <Badge variant="outline" className="capitalize">
                                {usr.role}
                              </Badge>
                            )}
                            {usr.artist_published && (
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                                Artista Publicado
                              </Badge>
                            )}
                            {usr.owner_published && (
                              <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Local Publicado</Badge>
                            )}
                            {usr.location && <Badge variant="secondary">{usr.location}</Badge>}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          {(!usr.verified || usr.verified === 0 || usr.verified === "0") && (
                            <Button size="sm" variant="outline" onClick={() => handleUserAction(usr.id, "verify")}>
                              Verificar
                            </Button>
                          )}
                          {usr.verified && usr.verified !== 0 && usr.verified !== "0" && (
                            <Button size="sm" variant="outline" onClick={() => handleUserAction(usr.id, "unverify")}>
                              Quitar Verificación
                            </Button>
                          )}
                          <Button size="sm" variant="destructive" onClick={() => handleUserAction(usr.id, "suspend")}>
                            Suspender
                          </Button>
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
                        <div className="flex-1">
                          <p className="font-semibold text-foreground mb-1">
                            {booking.owner_business_name || `${booking.owner_first_name} ${booking.owner_last_name}`} →{" "}
                            {booking.artist_stage_name || `${booking.artist_first_name} ${booking.artist_last_name}`}
                          </p>
                          <p className="text-sm text-muted-foreground mb-2">
                            <span className="font-medium">Dueño:</span> {booking.owner_email} |{" "}
                            <span className="font-medium">Artista:</span> {booking.artist_email}
                          </p>
                          {booking.title && (
                            <p className="text-sm font-medium text-foreground mb-1">
                              <span className="text-muted-foreground">Evento:</span> {booking.title}
                            </p>
                          )}
                          <p className="text-sm text-muted-foreground mb-1">
                            <span className="font-medium">Fecha:</span>{" "}
                            {booking.booking_date || booking.event_date || "No especificada"}
                          </p>
                          {booking.description && (
                            <p className="text-sm text-muted-foreground mt-2">{booking.description}</p>
                          )}
                        </div>
                        <div className="ml-4">
                          <Badge
                            className={
                              booking.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : booking.status === "accepted"
                                  ? "bg-green-100 text-green-800"
                                  : booking.status === "rejected"
                                    ? "bg-red-100 text-red-800"
                                    : booking.status === "completed"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-gray-100 text-gray-800"
                            }
                          >
                            {booking.status}
                          </Badge>
                        </div>
                      </div>
                      {(booking.status === "pending" || booking.status === "accepted") && (
                        <div className="flex gap-2 mt-3">
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
                            Cancelar
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
                    <Card key={review.id} className="p-4 border-l-4 border-l-yellow-500">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                                />
                              ))}
                            </div>
                            <span className="text-sm font-semibold">{review.rating}/5</span>
                          </div>
                          <p className="font-semibold text-foreground mb-1">
                            {review.reviewer_first_name} {review.reviewer_last_name} →{" "}
                            {review.reviewed_artist_name ||
                              review.reviewed_business_name ||
                              `${review.reviewed_first_name} ${review.reviewed_last_name}`}
                          </p>
                          <p className="text-sm text-muted-foreground mb-2">
                            <span className="font-medium">Revisor:</span> {review.reviewer_email} |{" "}
                            <span className="font-medium">Revisado:</span> {review.reviewed_email}
                          </p>
                          {review.comment && <p className="text-sm text-foreground mt-2">{review.comment}</p>}
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(review.created_at).toLocaleDateString("es-AR", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="ml-4"
                          onClick={() => handleDeleteReview(review.id)}
                        >
                          <Trash2 className="h-4 w-4" />
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
                <p className="text-muted-foreground">No hay reportes</p>
              ) : (
                <div className="space-y-4">
                  {reports.map((report) => (
                    <Card key={report.id} className="p-4 border-l-4 border-l-red-500">
                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-semibold text-foreground">
                              {report.reporter_first_name} {report.reporter_last_name} reportó a{" "}
                              {report.reported_first_name} {report.reported_last_name}
                            </p>
                            <Badge
                              variant={
                                report.status === "pending"
                                  ? "destructive"
                                  : report.status === "reviewed"
                                    ? "secondary"
                                    : "outline"
                              }
                            >
                              {report.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            <span className="font-medium">Reportador:</span> {report.reporter_email} |{" "}
                            <span className="font-medium">Reportado:</span> {report.reported_email}
                          </p>
                          <p className="text-sm font-medium text-foreground mb-1">
                            <span className="text-muted-foreground">Razón:</span> {report.reason}
                          </p>
                          {report.description && (
                            <p className="text-sm text-muted-foreground mt-2">{report.description}</p>
                          )}
                          {report.admin_notes && (
                            <p className="text-sm text-green-700 dark:text-green-400 mt-2 p-2 bg-green-50 dark:bg-green-950 rounded">
                              <span className="font-medium">Notas del Admin:</span> {report.admin_notes}
                            </p>
                          )}
                        </div>
                        {report.status === "pending" && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => {
                                const notes = prompt("Notas del administrador (opcional):")
                                handleReportAction(report.id, "reviewed", notes || "")
                              }}
                            >
                              Marcar Revisado
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReportAction(report.id, "dismissed")}
                            >
                              Descartar
                            </Button>
                          </div>
                        )}
                      </div>
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
                <p className="text-muted-foreground">No hay tickets</p>
              ) : (
                <div className="space-y-4">
                  {tickets.map((ticket) => (
                    <Card key={ticket.id} className="p-4 border-l-4 border-l-purple-500">
                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-semibold text-foreground">
                              {ticket.user_first_name} {ticket.user_last_name}
                            </p>
                            <Badge
                              variant={
                                ticket.status === "open"
                                  ? "destructive"
                                  : ticket.status === "in_progress"
                                    ? "secondary"
                                    : "outline"
                              }
                            >
                              {ticket.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            <span className="font-medium">Email:</span> {ticket.user_email} |{" "}
                            <span className="font-medium">Categoría:</span> {ticket.category || "General"}
                          </p>
                          <p className="text-sm font-medium text-foreground mb-1">
                            <span className="text-muted-foreground">Asunto:</span> {ticket.subject}
                          </p>
                          <p className="text-sm text-muted-foreground mt-2">{ticket.message}</p>
                          {ticket.admin_response && (
                            <p className="text-sm text-blue-700 dark:text-blue-400 mt-2 p-2 bg-blue-50 dark:bg-blue-950 rounded">
                              <span className="font-medium">Respuesta:</span> {ticket.admin_response}
                            </p>
                          )}
                        </div>
                        {ticket.status !== "closed" && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => {
                                const response = prompt("Respuesta al ticket:")
                                if (response) handleTicketAction(ticket.id, "in_progress", response)
                              }}
                            >
                              Responder
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleTicketAction(ticket.id, "closed")}>
                              Cerrar
                            </Button>
                          </div>
                        )}
                      </div>
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
