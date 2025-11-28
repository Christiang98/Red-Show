"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { BarChart3, Users, BookOpen, MessageSquare, Star, Calendar } from "lucide-react"

export default function DashboardPage() {
  const [user, setUser] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      router.push("/login")
    } else {
      setUser(currentUser)
    }
  }, [router])

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>
  }

  const stats = [
    { label: "Contrataciones", value: user.role === "owner" ? 8 : 5, icon: Calendar },
    { label: "Valoración", value: "4.8", subtext: "⭐", icon: Star },
    { label: "Mensajes", value: 12, icon: MessageSquare },
    { label: "Clientes", value: user.role === "owner" ? 24 : "N/A", icon: Users },
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
      <main className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">¡Bienvenido, {user.username}!</h1>
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
                    <p className="text-3xl font-bold text-primary mt-2">
                      {stat.value}
                      {stat.subtext && <span className="text-xl ml-1">{stat.subtext}</span>}
                    </p>
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

        {/* Recent Activity */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-primary mb-6">Actividad Reciente</h2>
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="text-blue-600" size={24} />
                </div>
                <div>
                  <p className="font-semibold">Nueva contratación confirmada</p>
                  <p className="text-sm text-muted-foreground">
                    Se confirmó la reserva con DJ Phoenix para el 20 de diciembre
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 pb-4 border-b">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="text-green-600" size={24} />
                </div>
                <div>
                  <p className="font-semibold">Nuevo mensaje de La Sala del Tango</p>
                  <p className="text-sm text-muted-foreground">Te respondieron sobre tu consulta de disponibilidad</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Star className="text-purple-600" size={24} />
                </div>
                <div>
                  <p className="font-semibold">Recibiste una nueva reseña</p>
                  <p className="text-sm text-muted-foreground">
                    Juan García te dio 5 estrellas después de tu último evento
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}
