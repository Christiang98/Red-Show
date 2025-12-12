"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { AppNavbar } from "@/components/navigation/app-navbar"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { BarChart3, Users, BookOpen, MessageSquare, Star, Calendar } from "lucide-react"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      router.push("/login")
    } else {
      setUser(currentUser)
    }
  }, [router])

  const { data: bookingsData } = useSWR(user ? `/api/bookings?userId=${user.id}` : null, fetcher)

  const { data: messagesData } = useSWR(user ? `/api/messages?userId=${user.id}` : null, fetcher)

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>
  }

  const totalBookings = bookingsData?.length || 0
  const unreadMessages = messagesData?.filter((m: any) => !m.read && m.receiver_id === user.id).length || 0
  const acceptedBookings = bookingsData?.filter((b: any) => b.status === "accepted").length || 0

  const stats = [
    { label: "Contrataciones", value: totalBookings, icon: Calendar },
    { label: "Confirmadas", value: acceptedBookings, icon: Star },
    { label: "Mensajes nuevos", value: unreadMessages, icon: MessageSquare },
    {
      label: "Perfil",
      value: user.role === "owner" ? "Propietario" : user.role === "artist" ? "Artista" : "Organizador",
      icon: Users,
    },
  ]

  const quickActions = [
    {
      title: "Buscar Oportunidades",
      description: user.role === "owner" ? "Encuentra artistas para tu espacio" : "Explora espacios y eventos",
      href: "/search",
      icon: Users,
      color: "bg-blue-50 border-blue-200",
    },
    {
      title: "Gestionar Contrataciones",
      description: "Ve solicitudes recibidas y enviadas",
      href: "/bookings",
      icon: BookOpen,
      color: "bg-green-50 border-green-200",
    },
    {
      title: "Mensajes",
      description: "Comunícate con otros usuarios",
      href: "/messaging",
      icon: MessageSquare,
      color: "bg-purple-50 border-purple-200",
    },
    {
      title: "Tu Perfil",
      description: user.role === "owner" ? "Edita tu información de negocio" : "Actualiza tu portafolio",
      href: user.role === "owner" ? "/profile/owner" : "/profile/artist",
      icon: BarChart3,
      color: "bg-orange-50 border-orange-200",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">
            ¡Bienvenido, {user.firstName} {user.lastName}!
          </h1>
          <p className="text-muted-foreground">Gestiona tu perfil y conecta con otros usuarios en Red Show</p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, idx) => {
            const Icon = stat.icon
            return (
              <Card key={idx} className="p-6 hover:shadow-lg transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-bold text-primary mt-2">{stat.value}</p>
                  </div>
                  <Icon className="text-secondary opacity-50" size={32} />
                </div>
              </Card>
            )
          })}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-2xl font-bold text-primary mb-6">Acciones Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quickActions.map((action, idx) => {
              const Icon = action.icon
              return (
                <Link key={idx} href={action.href}>
                  <Card
                    className={`p-6 ${action.color} border-2 hover:shadow-lg hover:border-primary/50 transition cursor-pointer h-full`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg text-foreground">{action.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{action.description}</p>
                      </div>
                      <Icon className="text-primary opacity-60" size={28} />
                    </div>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Recent Activity - Últimas contrataciones */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-primary mb-6">Actividad Reciente</h2>
          <Card className="p-6">
            {bookingsData && bookingsData.length > 0 ? (
              <div className="space-y-4">
                {bookingsData.slice(0, 3).map((booking: any) => (
                  <div key={booking.id} className="flex items-center gap-4 pb-4 border-b last:border-b-0">
                    <div
                      className={`w-12 h-12 ${
                        booking.status === "accepted"
                          ? "bg-green-100"
                          : booking.status === "pending"
                            ? "bg-yellow-100"
                            : "bg-red-100"
                      } rounded-lg flex items-center justify-center`}
                    >
                      <Calendar
                        className={`${
                          booking.status === "accepted"
                            ? "text-green-600"
                            : booking.status === "pending"
                              ? "text-yellow-600"
                              : "text-red-600"
                        }`}
                        size={24}
                      />
                    </div>
                    <div>
                      <p className="font-semibold">{booking.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Estado:{" "}
                        {booking.status === "pending"
                          ? "Pendiente"
                          : booking.status === "accepted"
                            ? "Aceptada"
                            : "Rechazada"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No hay actividad reciente. ¡Empieza a explorar!</p>
            )}
          </Card>
        </div>
      </main>
    </div>
  )
}
