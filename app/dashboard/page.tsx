"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { AppNavbar } from "@/components/navigation/app-navbar"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { BarChart3, Users, BookOpen, MessageSquare, Star, Calendar, Crown, Clock } from "lucide-react"
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
  const { data: subscriptionData, mutate: refetchSub } = useSWR(
    user ? `/api/subscriptions?userId=${user.id}` : null, fetcher
  )

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>
  }

  const totalBookings = bookingsData?.length || 0
  const unreadMessages = messagesData?.filter((m: any) => !m.read && m.receiver_id === user.id).length || 0
  const acceptedBookings = bookingsData?.filter((b: any) => b.status === "accepted").length || 0
  const subscription = subscriptionData?.subscription

  const stats = [
    { label: "Contrataciones", value: totalBookings, icon: Calendar },
    { label: "Confirmadas", value: acceptedBookings, icon: Star },
    { label: "Mensajes nuevos", value: unreadMessages, icon: MessageSquare },
    {
      label: "Perfil",
      value: user.role === "owner" ? "Propietario" : user.role === "artist" ? "Artista" : user.role === "user" ? "Usuario" : "Organizador",
      icon: Users,
    },
  ]

  const quickActions = [
    {
      title: "Buscar Oportunidades",
      description: user.role === "owner" ? "Encuentra artistas para tu espacio" : user.role === "user" ? "Explorá artistas y locales disponibles" : "Explora espacios y eventos",
      href: "/search",
      icon: Users,
      color: "bg-blue-500/20 border-blue-400/30 hover:bg-blue-500/30",
      iconColor: "text-blue-400",
    },
    {
      title: "Gestionar Contrataciones",
      description: "Ve solicitudes recibidas y enviadas",
      href: "/bookings",
      icon: BookOpen,
      color: "bg-green-500/20 border-green-400/30 hover:bg-green-500/30",
      iconColor: "text-green-400",
    },
    {
      title: "Mensajes",
      description: "Comunícate con otros usuarios",
      href: "/messaging",
      icon: MessageSquare,
      color: "bg-purple-500/20 border-purple-400/30 hover:bg-purple-500/30",
      iconColor: "text-purple-400",
    },
    {
      title: "Tu Perfil",
      description: user.role === "owner" ? "Ve y edita tu información de negocio" : user.role === "user" ? "Editá tus datos personales" : "Ve y actualiza tu portafolio",
      href: "/my-profile",
      icon: BarChart3,
      color: "bg-orange-500/20 border-orange-400/30 hover:bg-orange-500/30",
      iconColor: "text-orange-400",
    },
    {
      title: "Eventos",
      description: "Descubrí y publicá eventos de la comunidad",
      href: "/events",
      icon: Calendar,
      color: "bg-pink-500/20 border-pink-400/30 hover:bg-pink-500/30",
      iconColor: "text-pink-400",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <AppNavbar />

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Welcome Section */}
        <div className="mb-8 bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-6 md:p-8 text-primary-foreground shadow-lg">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            ¡Bienvenido, {user.firstName} {user.lastName}!
          </h1>
          <p className="text-primary-foreground/80">Gestiona tu perfil y conecta con otros usuarios en Red Show</p>
        </div>

        {/* Active Subscription Banner */}
        {subscription && (
          <div className="mb-8 rounded-2xl p-5 flex items-center justify-between gap-4"
            style={{ background: "linear-gradient(135deg, rgba(183,68,184,0.15), rgba(0,28,85,0.2))", border: "1px solid rgba(183,68,184,0.3)" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #B744B8, #7a1a8a)" }}>
                <Crown className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-foreground">Plan {subscription.plan_name} activo</p>
                <p className="text-sm text-muted-foreground">
                  {subscription.plan_type === "artist" ? "Artista" :
                   subscription.plan_type === "owner"  ? "Dueño de establecimiento" :
                   subscription.plan_type === "premium" ? "Premium" :
                   subscription.plan_type === "basic"   ? "Básico" :
                   subscription.plan_type}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <Clock className="h-4 w-4 text-purple-400" />
              <span className="font-bold text-foreground text-sm">
                {subscription.days_remaining > 0 ? `${subscription.days_remaining} días restantes` : "Expira hoy"}
              </span>
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, idx) => {
            const Icon = stat.icon
            const colors = [
              "bg-primary/20 border-primary/30",
              "bg-green-500/20 border-green-400/30",
              "bg-secondary/20 border-secondary/30",
              "bg-orange-500/20 border-orange-400/30",
            ]
            const iconColors = ["text-primary", "text-green-400", "text-secondary", "text-orange-400"]
            return (
              <Card key={idx} className={`p-6 hover:shadow-lg transition border-2 ${colors[idx]}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                    <p className="text-3xl font-bold text-foreground mt-2">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${colors[idx]}`}>
                    <Icon className={iconColors[idx]} size={28} />
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-2xl font-bold text-primary mb-6">Acciones Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickActions.map((action, idx) => {
              const Icon = action.icon
              return (
                <Link key={idx} href={action.href}>
                  <Card
                    className={`p-6 ${action.color} border-2 hover:shadow-lg transition cursor-pointer h-full`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg text-foreground">{action.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{action.description}</p>
                      </div>
                      <Icon className={action.iconColor} size={28} />
                    </div>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">Actividad Reciente</h2>
          <Card className="p-6 border-2 border-border/50 bg-card/80 backdrop-blur">
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
