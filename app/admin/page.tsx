"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getCurrentUser } from "@/lib/auth"
import { Shield, Users, AlertCircle, HelpCircle, CheckCircle, Calendar } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AdminPanel() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [reports, setReports] = useState<any[]>([])
  const [tickets, setTickets] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [bookings, setBookings] = useState<any[]>([])

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

      const bookingsRes = await fetch(`/api/admin/bookings?isAdmin=true`)
      const bookingsData = await bookingsRes.json()
      setBookings(bookingsData.bookings || [])
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
        alert(`Usuario ${action}`)
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

  return (
    <div className="min-h-screen bg-background">
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
        <div className="grid md:grid-cols-5 gap-4 mb-8">
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
                <p className="text-sm text-muted-foreground">Reportes Pendientes</p>
                <p className="text-3xl font-bold text-destructive">{pendingReports.length}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-destructive/60" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tickets Abiertos</p>
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
                <p className="text-sm text-muted-foreground">Perfiles Publicados</p>
                <p className="text-3xl font-bold text-green-600">
                  {users.filter((u) => u.artist_published || u.owner_published).length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600/60" />
            </div>
          </Card>
        </div>

        {/* Tabs principales */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full md:w-auto grid-cols-4">
            <TabsTrigger value="users">Usuarios</TabsTrigger>
            <TabsTrigger value="bookings">Contrataciones ({activeBookings.length})</TabsTrigger>
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
                        <div>
                          <p className="font-semibold text-foreground">
                            {usr.first_name} {usr.last_name}
                            {usr.is_verified && <CheckCircle className="inline h-4 w-4 ml-1 text-green-600" />}
                          </p>
                          <p className="text-sm text-muted-foreground">{usr.email}</p>
                          <div className="flex gap-2 mt-2">
                            <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary capitalize">
                              {usr.role}
                            </span>
                            {usr.artist_published && (
                              <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                                Artista Publicado
                              </span>
                            )}
                            {usr.owner_published && (
                              <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                                Local Publicado
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {!usr.is_verified && (
                            <Button size="sm" variant="outline" onClick={() => handleUserAction(usr.id, "verify")}>
                              Verificar
                            </Button>
                          )}
                          {usr.is_verified && (
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
                <p className="text-muted-foreground">No hay contrataciones</p>
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
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            booking.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : booking.status === "accepted"
                                ? "bg-green-100 text-green-800"
                                : booking.status === "rejected"
                                  ? "bg-red-100 text-red-800"
                                  : booking.status === "completed"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {booking.status}
                        </span>
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

          {/* Tab de Reportes */}
          <TabsContent value="reports">
            <Card className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">Reportes de Usuarios</h2>
              {reports.length === 0 ? (
                <p className="text-muted-foreground">No hay reportes</p>
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
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            report.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : report.status === "resolved"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {report.status}
                        </span>
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

          {/* Tab de Soporte */}
          <TabsContent value="support">
            <Card className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">Tickets de Soporte</h2>
              {tickets.length === 0 ? (
                <p className="text-muted-foreground">No hay tickets de soporte</p>
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
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              ticket.priority === "urgent"
                                ? "bg-red-100 text-red-800"
                                : ticket.priority === "high"
                                  ? "bg-orange-100 text-orange-800"
                                  : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {ticket.priority}
                          </span>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              ticket.status === "open"
                                ? "bg-yellow-100 text-yellow-800"
                                : ticket.status === "resolved"
                                  ? "bg-green-100 text-green-800"
                                  : ticket.status === "closed"
                                    ? "bg-gray-100 text-gray-800"
                                    : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {ticket.status}
                          </span>
                        </div>
                      </div>
                      <div className="mb-3">
                        <p className="text-sm font-medium text-foreground">Categoría: {ticket.category}</p>
                        <p className="text-sm text-muted-foreground mt-1">{ticket.message}</p>
                      </div>
                      {(ticket.status === "open" || ticket.status === "in_progress") && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTicketAction(ticket.id, "in_progress")}
                          >
                            En Proceso
                          </Button>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() =>
                              handleTicketAction(
                                ticket.id,
                                "resolved",
                                "Tu consulta ha sido resuelta. Gracias por contactarnos.",
                              )
                            }
                          >
                            Resolver
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleTicketAction(ticket.id, "closed")}
                          >
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
