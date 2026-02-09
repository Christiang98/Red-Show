"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getCurrentUser, logoutUser } from "@/lib/auth"
import {
  Shield,
  Users,
  AlertCircle,
  HelpCircle,
  CheckCircle,
  Calendar,
  SettingsIcon,
  Database,
  ArrowRight,
} from "lucide-react"

export default function AdminPanel() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingReports: 0,
    openTickets: 0,
    activeBookings: 0,
    publishedProfiles: 0,
  })

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser || currentUser.role !== "admin") {
      alert("Acceso denegado. Solo administradores pueden acceder a esta página.")
      router.push("/dashboard")
      return
    }
    setUser(currentUser)
    loadStats()
  }, [])

  const loadStats = async () => {
    setLoading(true)
    try {
      const usersRes = await fetch(`/api/admin/users`)
      const usersData = await usersRes.json()
      const users = usersData.users || []

      const reportsRes = await fetch(`/api/reports?isAdmin=true`)
      const reportsData = await reportsRes.json()
      const reports = reportsData.reports || []

      const ticketsRes = await fetch(`/api/support?isAdmin=true`)
      const ticketsData = await ticketsRes.json()
      const tickets = ticketsData.tickets || []

      const bookingsRes = await fetch(`/api/admin/bookings?isAdmin=true`)
      const bookingsData = await bookingsRes.json()
      const bookings = bookingsData.bookings || []

      setStats({
        totalUsers: users.length,
        pendingReports: reports.filter((r: any) => r.status === "pending").length,
        openTickets: tickets.filter((t: any) => t.status === "open" || t.status === "in_progress").length,
        activeBookings: bookings.filter((b: any) => b.status === "pending" || b.status === "accepted").length,
        publishedProfiles: users.filter((u: any) => u.artist_published || u.owner_published).length,
      })
    } catch (error) {
      console.error("[v0] Error cargando estadísticas:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdvancedManagement = () => {
    router.push("/admin/management")
  }

  const handleLogout = () => {
    logoutUser()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground text-lg">Cargando panel de administración...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="bg-gradient-to-r from-primary via-secondary to-primary text-primary-foreground py-12 px-4 shadow-lg">
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="bg-primary-foreground/10 p-4 rounded-xl backdrop-blur-sm">
                <Shield className="h-10 w-10" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-1">Panel de Administración del Sistema</h1>
                <p className="text-primary-foreground/90 text-lg">Gestión completa de la plataforma Red Show</p>
              </div>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="bg-primary-foreground/10 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/20"
            >
              Cerrar Sesión
            </Button>
          </div>
          <div className="flex items-center gap-2 text-primary-foreground/80">
            <CheckCircle className="h-5 w-5" />
            <span className="text-sm">
              Sesión iniciada como:{" "}
              <strong>
                {user?.firstName} {user?.lastName}
              </strong>{" "}
              ({user?.email})
            </span>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 py-12">
        <div className="grid md:grid-cols-5 gap-6 mb-12">
          <Card className="p-6 hover:shadow-lg transition-shadow border-l-4 border-l-primary">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Total Usuarios</p>
                <p className="text-4xl font-bold text-primary mt-2">{stats.totalUsers}</p>
              </div>
              <Users className="h-10 w-10 text-primary/40" />
            </div>
          </Card>
          <Card className="p-6 hover:shadow-lg transition-shadow border-l-4 border-l-destructive">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Reportes Pendientes</p>
                <p className="text-4xl font-bold text-destructive mt-2">{stats.pendingReports}</p>
              </div>
              <AlertCircle className="h-10 w-10 text-destructive/40" />
            </div>
          </Card>
          <Card className="p-6 hover:shadow-lg transition-shadow border-l-4 border-l-secondary">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Tickets Abiertos</p>
                <p className="text-4xl font-bold text-secondary mt-2">{stats.openTickets}</p>
              </div>
              <HelpCircle className="h-10 w-10 text-secondary/40" />
            </div>
          </Card>
          <Card className="p-6 hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Contrataciones</p>
                <p className="text-4xl font-bold text-blue-600 mt-2">{stats.activeBookings}</p>
              </div>
              <Calendar className="h-10 w-10 text-blue-600/40" />
            </div>
          </Card>
          <Card className="p-6 hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Perfiles Publicados</p>
                <p className="text-4xl font-bold text-green-600 mt-2">{stats.publishedProfiles}</p>
              </div>
              <CheckCircle className="h-10 w-10 text-green-600/40" />
            </div>
          </Card>
        </div>

        <div className="mb-12">
          <Card className="p-8 bg-gradient-to-br from-primary/5 to-secondary/5 border-2 border-primary/20">
            <div className="text-center max-w-3xl mx-auto">
              <div className="flex justify-center mb-6">
                <div className="bg-primary/10 p-6 rounded-2xl">
                  <Database className="h-16 w-16 text-primary" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-3">Consola de Gestión Avanzada</h2>
              <p className="text-muted-foreground text-lg mb-8">
                Accede al panel de gestión completo para administrar usuarios, contrataciones, reportes, tickets de
                soporte y configuraciones avanzadas del sistema.
              </p>
              <Button
                onClick={handleAdvancedManagement}
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-10 py-6 h-auto shadow-lg hover:shadow-xl transition-all"
              >
                <ArrowRight className="mr-3 h-6 w-6" />
                Acceder a la Consola de Gestión Avanzada
              </Button>
              <p className="text-sm text-muted-foreground mt-4">Gestión completa de la plataforma Red Show</p>
            </div>
          </Card>
        </div>

        <h3 className="text-2xl font-bold text-foreground mb-6">Gestión Rápida de la Plataforma</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card
            className="p-6 hover:shadow-lg transition-all cursor-pointer hover:border-primary"
            onClick={() => router.push("/admin/management")}
          >
            <div className="text-center">
              <div className="bg-primary/10 p-4 rounded-xl inline-flex mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h4 className="font-semibold text-foreground mb-2">Gestión de Usuarios</h4>
              <p className="text-sm text-muted-foreground">Administrar cuentas, verificaciones y roles</p>
              <Button variant="outline" className="mt-4 w-full bg-transparent">
                Ver Usuarios
              </Button>
            </div>
          </Card>

          <Card
            className="p-6 hover:shadow-lg transition-all cursor-pointer hover:border-blue-500"
            onClick={() => router.push("/admin/management")}
          >
            <div className="text-center">
              <div className="bg-blue-100 p-4 rounded-xl inline-flex mb-4">
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
              <h4 className="font-semibold text-foreground mb-2">Contrataciones</h4>
              <p className="text-sm text-muted-foreground">Supervisar y gestionar reservas</p>
              <Button variant="outline" className="mt-4 w-full bg-transparent">
                Ver Contrataciones
              </Button>
            </div>
          </Card>

          <Card
            className="p-6 hover:shadow-lg transition-all cursor-pointer hover:border-destructive"
            onClick={() => router.push("/admin/management")}
          >
            <div className="text-center">
              <div className="bg-destructive/10 p-4 rounded-xl inline-flex mb-4">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <h4 className="font-semibold text-foreground mb-2">Reportes</h4>
              <p className="text-sm text-muted-foreground">Revisar denuncias de usuarios</p>
              <Button variant="outline" className="mt-4 w-full bg-transparent">
                Ver Reportes
              </Button>
            </div>
          </Card>

          <Card
            className="p-6 hover:shadow-lg transition-all cursor-pointer hover:border-secondary"
            onClick={() => router.push("/admin/management")}
          >
            <div className="text-center">
              <div className="bg-secondary/10 p-4 rounded-xl inline-flex mb-4">
                <HelpCircle className="h-8 w-8 text-secondary" />
              </div>
              <h4 className="font-semibold text-foreground mb-2">Soporte</h4>
              <p className="text-sm text-muted-foreground">Atender tickets de usuarios</p>
              <Button variant="outline" className="mt-4 w-full bg-transparent">
                Ver Tickets
              </Button>
            </div>
          </Card>
        </div>

        <div className="mt-12">
          <Card className="p-6">
            <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Navegación del Sistema
            </h4>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => router.push("/dashboard")}>
                Ver Dashboard Principal
              </Button>
              <Button variant="outline" onClick={() => router.push("/admin/management")}>
                Panel de Gestión Detallado
              </Button>
              <Button variant="outline" onClick={() => router.push("/")}>
                Ir a Inicio
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
